/**
 * Test 3 — Round-trip semantic fidelity.
 *
 *   NL → encode(rule-based) → AXON → decode(LLM subagent) → NL'
 *   judge(NL, NL') → similarity score 0–10
 *
 * The judge is a SEPARATE LLM call with no shared context.
 *
 * Usage:
 *   --prepare    : write payload + judge tasks to results/03/
 *   --collect    : after responses.json + judgements.json land, compute metrics
 *
 * The intermediate LLM calls are performed externally (via Claude Code
 * Agent subagents in this run) — this script does not call any API itself.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@axon/codec";
import { CORPUS } from "../corpus/messages.js";
import { RUBRIC_SIMILARITY } from "../metrics/judge_rubrics.js";
import { CODECFIT_INJECT } from "@axon/codec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/03");

interface DecodeTask { id: string; nl: string; axon: string; }
interface JudgeTask { id: string; original: string; decoded: string; }
interface DecodeResponse { id: string; decoded: string; }
interface JudgeResponse { id: string; score: number; missing: string[]; added: string[]; rationale: string; }

function prepare() {
  mkdirSync(OUT_DIR, { recursive: true });

  const decodeTasks: DecodeTask[] = [];
  for (const m of CORPUS) {
    const enc = encode(m.nl, { ascii: false });
    decodeTasks.push({ id: m.id, nl: m.nl, axon: enc.encoded });
  }

  writeFileSync(resolve(OUT_DIR, "decode_payload.json"), JSON.stringify(decodeTasks, null, 2));

  const decodeInstructions = `
You are a decoding agent. You will be given a list of AXON-encoded agent messages.
AXON uses these symbols and conventions:

${CODECFIT_INJECT}

For EACH message in the payload below, expand it back to natural English. Do not
add facts that are not present in the AXON. Do not omit facts that are present.
Preserve numbers, identifiers, qualifiers, and intent exactly.

Output ONLY a JSON array of {"id": "<id>", "decoded": "<natural english>"}.
No markdown, no commentary, no code fences. Just the JSON array.

PAYLOAD:
${JSON.stringify(decodeTasks, null, 2)}
`.trim();

  writeFileSync(resolve(OUT_DIR, "decode_instructions.md"), decodeInstructions);
  console.log(`Prepared ${decodeTasks.length} decode tasks → ${OUT_DIR}/decode_payload.json`);
  console.log(`Send the contents of decode_instructions.md to a fresh LLM subagent.`);
  console.log(`Save the response JSON array to ${OUT_DIR}/decode_responses.json.`);
}

function collect() {
  const decodePath = resolve(OUT_DIR, "decode_responses.json");
  if (!existsSync(decodePath)) {
    console.error(`Missing ${decodePath}. Run --prepare first, get subagent response, then save it.`);
    process.exit(1);
  }
  const decodes: DecodeResponse[] = JSON.parse(readFileSync(decodePath, "utf-8"));
  const decodeById = new Map(decodes.map((d) => [d.id, d.decoded]));

  // Prepare judge tasks: original NL vs decoded NL
  const judgeTasks: JudgeTask[] = [];
  for (const m of CORPUS) {
    const decoded = decodeById.get(m.id);
    if (!decoded) {
      console.warn(`No decode for ${m.id}, skipping`);
      continue;
    }
    judgeTasks.push({ id: m.id, original: m.nl, decoded });
  }
  writeFileSync(resolve(OUT_DIR, "judge_payload.json"), JSON.stringify(judgeTasks, null, 2));

  const judgeInstructions = `
You are a semantic similarity judge. Score independently.

${RUBRIC_SIMILARITY}

For EACH item in the payload below, output one judgement.

Output ONLY a JSON array of {"id", "score", "missing", "added", "rationale"} objects.
No markdown. No commentary. No code fences.

PAYLOAD:
${JSON.stringify(judgeTasks, null, 2)}
`.trim();

  writeFileSync(resolve(OUT_DIR, "judge_instructions.md"), judgeInstructions);

  const judgePath = resolve(OUT_DIR, "judge_responses.json");
  if (!existsSync(judgePath)) {
    console.log(`\nDecode responses loaded. Judge tasks written.`);
    console.log(`Send judge_instructions.md to a fresh subagent.`);
    console.log(`Save response JSON to ${judgePath}, then re-run --collect.`);
    return;
  }

  const judgements: JudgeResponse[] = JSON.parse(readFileSync(judgePath, "utf-8"));

  const scores = judgements.map((j) => j.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  // Bootstrap 95% CI for mean
  const B = 2000;
  const means: number[] = [];
  for (let i = 0; i < B; i++) {
    let s = 0;
    for (let j = 0; j < scores.length; j++) s += scores[Math.floor(Math.random() * scores.length)];
    means.push(s / scores.length);
  }
  means.sort((a, b) => a - b);
  const lo = means[Math.floor(B * 0.025)];
  const hi = means[Math.floor(B * 0.975)];

  // Distribution
  const buckets: Record<string, number> = { "0-3": 0, "4-6": 0, "7-8": 0, "9-10": 0 };
  for (const s of scores) {
    if (s <= 3) buckets["0-3"]++;
    else if (s <= 6) buckets["4-6"]++;
    else if (s <= 8) buckets["7-8"]++;
    else buckets["9-10"]++;
  }

  console.log("\n=== TEST 3: Round-trip semantic fidelity ===\n");
  console.log(`n=${scores.length}`);
  console.log(`Mean score:   ${mean.toFixed(2)} / 10   [95% CI bootstrap: ${lo.toFixed(2)}–${hi.toFixed(2)}]`);
  console.log(`Median:       ${median} / 10`);
  console.log(`Range:        ${min}–${max}`);
  console.log(`\nDistribution:`);
  for (const [k, v] of Object.entries(buckets)) console.log(`  ${k}:  ${v}  (${(v / scores.length * 100).toFixed(0)}%)`);

  const worst = [...judgements].sort((a, b) => a.score - b.score).slice(0, 5);
  console.log(`\n--- Worst 5 ---`);
  for (const w of worst) {
    const original = CORPUS.find((c) => c.id === w.id)?.nl ?? "?";
    const decoded = decodeById.get(w.id) ?? "?";
    console.log(`\n  [${w.id}] score=${w.score}/10`);
    console.log(`  original: ${original}`);
    console.log(`  decoded:  ${decoded}`);
    console.log(`  rationale: ${w.rationale}`);
    if (w.missing?.length) console.log(`  missing: ${w.missing.join("; ")}`);
    if (w.added?.length) console.log(`  added:   ${w.added.join("; ")}`);
  }

  writeFileSync(resolve(OUT_DIR, "../03_roundtrip_fidelity.json"), JSON.stringify({
    test: "roundtrip_fidelity",
    n: scores.length,
    mean, median, min, max, ci95: [lo, hi], buckets,
    judgements,
  }, null, 2));
  console.log(`\nResults → results/03_roundtrip_fidelity.json`);
}

const mode = process.argv[2];
if (mode === "--prepare") prepare();
else if (mode === "--collect") collect();
else { console.error("Usage: 03_roundtrip_fidelity.ts --prepare | --collect"); process.exit(1); }
