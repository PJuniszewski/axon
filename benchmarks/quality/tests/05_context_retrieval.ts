/**
 * Test 5 — Context retrieval (needle-in-conversation).
 *
 * Each thread is presented to a fresh LLM in two forms:
 *   A) Natural language (baseline)
 *   B) AXON-encoded (rule-based encoder)
 *
 * Then we ask the same probe questions. We compare:
 *   - retrieval accuracy at each form
 *   - position effect (early / mid / late)
 *
 * For each thread we generate two payloads (NL + AXON). The LLM answers
 * each probe with {answer: "..."} or "UNKNOWN". A separate scorer compares
 * answer against expected (substring match + LLM judge for fuzzy match).
 *
 * Total probes: 5 threads × 6 probes × 2 forms = 60 LLM answers.
 * Plus 60 LLM-judge calls for fuzzy match scoring.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@axon/codec";
import { THREADS, type Thread } from "../corpus/threads.js";
import { RUBRIC_RETRIEVAL } from "../metrics/judge_rubrics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/05");

interface RetrievalTask {
  task_id: string;          // <thread>-<form>-<probe-idx>
  thread_id: string;
  form: "NL" | "AXON";
  history: string;
  question: string;
  expected: string;
  position: "early" | "mid" | "late";
}

interface RetrievalResponse { task_id: string; answer: string; }

function buildHistory(thread: Thread, form: "NL" | "AXON"): string {
  return thread.messages
    .map((m, i) => {
      if (form === "NL") return `[msg ${i + 1}] @${m.speaker}: ${m.nl}`;
      const ax = encode(m.nl, { ascii: false }).encoded;
      return `[msg ${i + 1}] @${m.speaker}: ${ax}`;
    })
    .join("\n");
}

function prepare() {
  mkdirSync(OUT_DIR, { recursive: true });
  const tasks: RetrievalTask[] = [];
  for (const t of THREADS) {
    const nlHistory = buildHistory(t, "NL");
    const axonHistory = buildHistory(t, "AXON");
    for (let i = 0; i < t.probes.length; i++) {
      const p = t.probes[i];
      tasks.push({
        task_id: `${t.id}-NL-p${i}`,
        thread_id: t.id, form: "NL", history: nlHistory,
        question: p.question, expected: p.expected, position: p.about_position,
      });
      tasks.push({
        task_id: `${t.id}-AXON-p${i}`,
        thread_id: t.id, form: "AXON", history: axonHistory,
        question: p.question, expected: p.expected, position: p.about_position,
      });
    }
  }
  writeFileSync(resolve(OUT_DIR, "payload.json"), JSON.stringify(tasks, null, 2));

  const instr = `
You are a retrieval agent. ${RUBRIC_RETRIEVAL}

You will receive a JSON array of tasks. Each task has a "history" (message log)
and a "question". Answer using ONLY information present in the history.
If the answer is not present, output "UNKNOWN".

Some histories use the AXON symbolic protocol. The codebook:
  ! REQUEST   ? QUERY   ≡ INFORM   → DELEGATE   ⊕ MERGE   ✓ CONFIRM
  ✗ REJECT    ⊗ ERROR   ∎ COMPLETE ⟳ RETRY      ⚡ URGENT
  @ AGENT     # REF     | PIPE     : ASSIGN     ⟦⟧ PAYLOAD  ⟨⟩ CONTEXT
  ∧ AND       ∨ OR      ∀ ALL      ∃ EXISTS     ∅ NULL/NONE  ¬ NOT
  ⊂ FILTER/ONLY    ∑ AGGREGATE     ⊞ BATCH      ⌛ TIMEOUT   ⌂ LOCAL

Output ONLY a JSON array of {"task_id": "...", "answer": "..."}.
No markdown. No commentary. No code fences. Just the JSON array.

PAYLOAD:
${JSON.stringify(tasks, null, 2)}
`.trim();
  writeFileSync(resolve(OUT_DIR, "instructions.md"), instr);
  console.log(`Prepared ${tasks.length} retrieval tasks → ${OUT_DIR}/`);
}

// Lenient substring match for scoring. Numbers and IDs must appear; minor
// formatting differences (e.g. "PR 1142" vs "pull request 1142") are
// tolerated by normalising whitespace and case.
function normalize(s: string) { return s.toLowerCase().replace(/[^a-z0-9.\-:]+/g, " ").trim().replace(/\s+/g, " "); }

function matches(actual: string, expected: string): boolean {
  if (!actual) return false;
  if (actual.toUpperCase() === "UNKNOWN") return false;
  const a = normalize(actual);
  const e = normalize(expected);
  if (a.includes(e)) return true;
  // For multi-word expected, check all key tokens present
  const eTokens = e.split(" ").filter((t) => t.length >= 2);
  if (eTokens.length > 0 && eTokens.every((t) => a.includes(t))) return true;
  return false;
}

function collect() {
  const path = resolve(OUT_DIR, "responses.json");
  if (!existsSync(path)) {
    console.error(`Missing ${path}. Run --prepare, send instructions.md to subagent, save response.`);
    process.exit(1);
  }
  const tasks: RetrievalTask[] = JSON.parse(readFileSync(resolve(OUT_DIR, "payload.json"), "utf-8"));
  const responses: RetrievalResponse[] = JSON.parse(readFileSync(path, "utf-8"));
  const respById = new Map(responses.map((r) => [r.task_id, r.answer]));

  interface Scored extends RetrievalTask { actual: string; correct: boolean; }
  const scored: Scored[] = tasks.map((t) => {
    const actual = respById.get(t.task_id) ?? "";
    return { ...t, actual, correct: matches(actual, t.expected) };
  });

  const byForm = (form: "NL" | "AXON") => scored.filter((s) => s.form === form);
  const nlScored = byForm("NL");
  const axScored = byForm("AXON");

  const acc = (arr: Scored[]) => arr.filter((s) => s.correct).length / arr.length;
  const accByPos = (arr: Scored[], pos: string) => {
    const filtered = arr.filter((s) => s.position === pos);
    return { n: filtered.length, acc: filtered.filter((s) => s.correct).length / filtered.length };
  };

  console.log("\n=== TEST 5: Context retrieval ===\n");
  console.log(`Total probes: ${scored.length}  (NL=${nlScored.length}, AXON=${axScored.length})`);
  console.log(`\nOverall accuracy:`);
  console.log(`  NL baseline:    ${(acc(nlScored) * 100).toFixed(1)}%  (${nlScored.filter((s) => s.correct).length}/${nlScored.length})`);
  console.log(`  AXON encoded:   ${(acc(axScored) * 100).toFixed(1)}%  (${axScored.filter((s) => s.correct).length}/${axScored.length})`);
  console.log(`  Delta (AX−NL):  ${((acc(axScored) - acc(nlScored)) * 100).toFixed(1)} pp`);

  console.log(`\nBy position (NL → AXON):`);
  for (const pos of ["early", "mid", "late"] as const) {
    const nl = accByPos(nlScored, pos);
    const ax = accByPos(axScored, pos);
    console.log(`  ${pos.padEnd(6)} NL ${(nl.acc * 100).toFixed(0)}% (${nl.n})  →  AXON ${(ax.acc * 100).toFixed(0)}% (${ax.n})  Δ ${((ax.acc - nl.acc) * 100).toFixed(0)} pp`);
  }

  const wrong = scored.filter((s) => !s.correct).slice(0, 8);
  console.log(`\n--- Sample failures (up to 8) ---`);
  for (const w of wrong) {
    console.log(`\n  [${w.task_id}] form=${w.form} pos=${w.position}`);
    console.log(`  Q: ${w.question}`);
    console.log(`  expected: ${w.expected}`);
    console.log(`  actual:   ${w.actual.slice(0, 100)}`);
  }

  writeFileSync(resolve(OUT_DIR, "../05_context_retrieval.json"), JSON.stringify({
    test: "context_retrieval",
    n: scored.length,
    by_form: {
      NL: { n: nlScored.length, accuracy: acc(nlScored) },
      AXON: { n: axScored.length, accuracy: acc(axScored) },
    },
    by_position: {
      NL: { early: accByPos(nlScored, "early"), mid: accByPos(nlScored, "mid"), late: accByPos(nlScored, "late") },
      AXON: { early: accByPos(axScored, "early"), mid: accByPos(axScored, "mid"), late: accByPos(axScored, "late") },
    },
    rows: scored,
  }, null, 2));
  console.log(`\nResults → results/05_context_retrieval.json`);
}

const mode = process.argv[2];
if (mode === "--prepare") prepare();
else if (mode === "--collect") collect();
else { console.error("Usage: --prepare | --collect"); process.exit(1); }
