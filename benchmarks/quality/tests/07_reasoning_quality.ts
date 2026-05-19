/**
 * Test 7 — Reasoning quality under CodecFit injection.
 *
 * Same 20 reasoning problems given to two fresh subagents:
 *   A) baseline (no CodecFit in system prompt)
 *   B) CodecFit injected
 *
 * Both told: "think step by step, then output your final numeric answer
 * on the last line as `ANSWER: <value>`."
 *
 * Metric: accuracy_with_inject  vs  accuracy_baseline. Delta = how much
 * CodecFit hurts (or helps) reasoning.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { REASONING_PROBLEMS } from "../corpus/reasoning.js";
import { CODECFIT_INJECT } from "@axon/codec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/07");

interface ReasoningResponse { id: string; reasoning: string; answer: string; }

function buildInstructions(arm: "baseline" | "codecfit"): string {
  const systemPrefix = arm === "codecfit" ? `${CODECFIT_INJECT}\n\n---\n\n` : "";
  return `
${systemPrefix}You are a careful reasoning agent. For each problem, think step by
step. Then output your final answer.

Output ONLY a JSON array of {"id": "<id>", "reasoning": "<step-by-step, <=80 words>", "answer": "<numeric or short text>"}.
The answer field should contain ONLY the value (no units, no commentary).
No markdown, no commentary outside the JSON, no code fences.

PROBLEMS:
${JSON.stringify(REASONING_PROBLEMS.map((p) => ({ id: p.id, prompt: p.prompt })), null, 2)}
`.trim();
}

function prepare() {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, "baseline_instructions.md"), buildInstructions("baseline"));
  writeFileSync(resolve(OUT_DIR, "codecfit_instructions.md"), buildInstructions("codecfit"));
  console.log(`Prepared two arms (baseline, codecfit) at ${OUT_DIR}/`);
}

function normalizeNum(s: string): number | null {
  if (!s) return null;
  const cleaned = String(s).replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function gradeArm(arm: "baseline" | "codecfit") {
  const path = resolve(OUT_DIR, `${arm}_responses.json`);
  if (!existsSync(path)) return null;
  const responses: ReasoningResponse[] = JSON.parse(readFileSync(path, "utf-8"));
  const byId = new Map(responses.map((r) => [r.id, r]));

  const graded = REASONING_PROBLEMS.map((p) => {
    const r = byId.get(p.id);
    const ansStr = r?.answer ?? "";
    const expectedN = normalizeNum(p.answer);
    const actualN = normalizeNum(ansStr);
    let correct = false;
    if (expectedN !== null && actualN !== null) {
      correct = Math.abs(expectedN - actualN) <= 0.05 * Math.abs(expectedN) || Math.abs(expectedN - actualN) < 0.5;
    } else {
      correct = ansStr.toLowerCase().includes(String(p.answer).toLowerCase());
    }
    return { id: p.id, difficulty: p.difficulty, expected: p.answer, actual: ansStr, reasoning: r?.reasoning ?? "", correct };
  });

  return graded;
}

function collect() {
  const baseline = gradeArm("baseline");
  const codecfit = gradeArm("codecfit");
  if (!baseline || !codecfit) {
    console.error("Both baseline_responses.json and codecfit_responses.json required.");
    process.exit(1);
  }

  const acc = (rows: { correct: boolean }[]) => rows.filter((r) => r.correct).length / rows.length;
  const accByDiff = (rows: any[], diff: string) => {
    const f = rows.filter((r) => r.difficulty === diff);
    return { n: f.length, acc: f.filter((r) => r.correct).length / f.length };
  };

  console.log("\n=== TEST 7: Reasoning quality under CodecFit ===\n");
  console.log(`n = ${baseline.length} problems`);
  console.log(`\nOverall:`);
  console.log(`  Baseline:  ${(acc(baseline) * 100).toFixed(1)}%  (${baseline.filter((r) => r.correct).length}/${baseline.length})`);
  console.log(`  CodecFit:  ${(acc(codecfit) * 100).toFixed(1)}%  (${codecfit.filter((r) => r.correct).length}/${codecfit.length})`);
  console.log(`  Δ:         ${((acc(codecfit) - acc(baseline)) * 100).toFixed(1)} pp`);

  console.log(`\nBy difficulty:`);
  for (const d of ["easy", "med", "hard"]) {
    const b = accByDiff(baseline, d);
    const c = accByDiff(codecfit, d);
    console.log(`  ${d.padEnd(5)} baseline ${(b.acc * 100).toFixed(0)}% (${b.n})  →  codecfit ${(c.acc * 100).toFixed(0)}% (${c.n})  Δ ${((c.acc - b.acc) * 100).toFixed(0)} pp`);
  }

  console.log(`\n--- Disagreements (baseline correct, codecfit wrong, or vice versa) ---`);
  for (let i = 0; i < baseline.length; i++) {
    const b = baseline[i], c = codecfit[i];
    if (b.correct !== c.correct) {
      const p = REASONING_PROBLEMS[i];
      console.log(`\n  [${b.id} | ${b.difficulty}] expected=${b.expected}`);
      console.log(`  baseline: ${b.correct ? "✓" : "✗"} actual=${b.actual}`);
      console.log(`  codecfit: ${c.correct ? "✓" : "✗"} actual=${c.actual}`);
    }
  }

  writeFileSync(resolve(OUT_DIR, "../07_reasoning_quality.json"), JSON.stringify({
    test: "reasoning_quality",
    n: baseline.length,
    arms: {
      baseline: { accuracy: acc(baseline), rows: baseline },
      codecfit: { accuracy: acc(codecfit), rows: codecfit },
    },
    delta: acc(codecfit) - acc(baseline),
    by_difficulty: {
      easy:  { baseline: accByDiff(baseline, "easy"),  codecfit: accByDiff(codecfit, "easy") },
      med:   { baseline: accByDiff(baseline, "med"),   codecfit: accByDiff(codecfit, "med") },
      hard:  { baseline: accByDiff(baseline, "hard"),  codecfit: accByDiff(codecfit, "hard") },
    },
  }, null, 2));
  console.log(`\nResults → results/07_reasoning_quality.json`);
}

const mode = process.argv[2];
if (mode === "--prepare") prepare();
else if (mode === "--collect") collect();
else { console.error("Usage: --prepare | --collect"); process.exit(1); }
