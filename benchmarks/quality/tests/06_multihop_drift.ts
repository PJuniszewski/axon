/**
 * Test 6 — Multi-hop semantic drift.
 *
 * Simulate an agent chain that re-encodes the message at every hop:
 *   NL₀ → AXON₁ → NL₁ → AXON₂ → NL₂ → AXON₃ → NL₃
 *
 * The rule-based encoder is deterministic, so it handles the NL→AXON
 * steps. The LLM handles AXON→NL at each hop. After each hop the judge
 * computes similarity(NL₀, NLₖ).
 *
 * Hops: 3. Threads × messages = 10 samples (first 2 messages from each
 * of 5 threads, all "early" position so we're not double-counting tests).
 *
 * What we're measuring: does meaning degrade as a function of hop count?
 * A flat curve = AXON is lossless after the first compression. A linear
 * decay = each pass strips more.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@axon/codec";
import { THREADS } from "../corpus/threads.js";
import { RUBRIC_SIMILARITY } from "../metrics/judge_rubrics.js";
import { CODECFIT_INJECT } from "@axon/codec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/06");

const HOPS = 3;

interface ChainState {
  id: string;
  nl0: string;
  axon1: string;
  nl1?: string; axon2?: string;
  nl2?: string; axon3?: string;
  nl3?: string;
}

function selectSamples() {
  const samples: { id: string; nl: string }[] = [];
  for (const t of THREADS) {
    samples.push({ id: `${t.id}-m0`, nl: t.messages[0].nl });
    samples.push({ id: `${t.id}-m1`, nl: t.messages[1].nl });
  }
  return samples;
}

function prepareHop(hop: 1 | 2 | 3) {
  mkdirSync(OUT_DIR, { recursive: true });

  const samples = selectSamples();
  let state: ChainState[];

  if (hop === 1) {
    state = samples.map((s) => ({ id: s.id, nl0: s.nl, axon1: encode(s.nl, { ascii: false }).encoded }));
    writeFileSync(resolve(OUT_DIR, "state.json"), JSON.stringify(state, null, 2));
  } else {
    state = JSON.parse(readFileSync(resolve(OUT_DIR, "state.json"), "utf-8"));
  }

  // Determine which AXON we're decoding this hop
  const inputAxonKey = `axon${hop}` as keyof ChainState;
  const tasks = state.map((s) => ({ id: s.id, axon: s[inputAxonKey] as string }));

  writeFileSync(resolve(OUT_DIR, `hop${hop}_decode_payload.json`), JSON.stringify(tasks, null, 2));

  const instr = `
You are an AXON decoder. AXON codebook:

${CODECFIT_INJECT}

For EACH item, expand the AXON to natural English. Preserve every fact,
number, identifier, qualifier, and intent. Do not add facts. Do not omit
facts. Output natural English only — no AXON in the response.

Output ONLY a JSON array of {"id": "<id>", "decoded": "<natural english>"}.
No markdown, no commentary, no code fences.

PAYLOAD:
${JSON.stringify(tasks, null, 2)}
`.trim();
  writeFileSync(resolve(OUT_DIR, `hop${hop}_decode_instructions.md`), instr);
  console.log(`Hop ${hop} decode payload → ${OUT_DIR}/hop${hop}_decode_instructions.md`);
}

function processHop(hop: 1 | 2 | 3) {
  const respPath = resolve(OUT_DIR, `hop${hop}_decode_responses.json`);
  if (!existsSync(respPath)) {
    console.error(`Missing ${respPath}.`);
    process.exit(1);
  }
  const responses: { id: string; decoded: string }[] = JSON.parse(readFileSync(respPath, "utf-8"));
  const respById = new Map(responses.map((r) => [r.id, r.decoded]));

  const state: ChainState[] = JSON.parse(readFileSync(resolve(OUT_DIR, "state.json"), "utf-8"));
  const nlKey = `nl${hop}` as keyof ChainState;
  for (const s of state) {
    const d = respById.get(s.id);
    if (!d) continue;
    (s as any)[nlKey] = d;
    if (hop < HOPS) {
      const nextAxonKey = `axon${hop + 1}` as keyof ChainState;
      (s as any)[nextAxonKey] = encode(d, { ascii: false }).encoded;
    }
  }
  writeFileSync(resolve(OUT_DIR, "state.json"), JSON.stringify(state, null, 2));
  console.log(`Hop ${hop} processed. Updated state.json.`);

  if (hop < HOPS) {
    console.log(`Run --prepare-hop${hop + 1} next.`);
  } else {
    console.log(`All hops complete. Run --prepare-judge.`);
  }
}

function prepareJudge() {
  const state: ChainState[] = JSON.parse(readFileSync(resolve(OUT_DIR, "state.json"), "utf-8"));

  // Build judge tasks: compare NL0 vs NL1, NL0 vs NL2, NL0 vs NL3
  const tasks: { id: string; hop: number; original: string; decoded: string }[] = [];
  for (const s of state) {
    if (s.nl1) tasks.push({ id: `${s.id}-h1`, hop: 1, original: s.nl0, decoded: s.nl1 });
    if (s.nl2) tasks.push({ id: `${s.id}-h2`, hop: 2, original: s.nl0, decoded: s.nl2 });
    if (s.nl3) tasks.push({ id: `${s.id}-h3`, hop: 3, original: s.nl0, decoded: s.nl3 });
  }
  writeFileSync(resolve(OUT_DIR, "judge_payload.json"), JSON.stringify(tasks, null, 2));

  const instr = `
You are a semantic similarity judge.

${RUBRIC_SIMILARITY}

For EACH item, output one judgement.

Output ONLY a JSON array of {"id", "score", "missing", "added", "rationale"}.
No markdown, no commentary.

PAYLOAD:
${JSON.stringify(tasks, null, 2)}
`.trim();
  writeFileSync(resolve(OUT_DIR, "judge_instructions.md"), instr);
  console.log(`Prepared ${tasks.length} judge tasks → ${OUT_DIR}/judge_instructions.md`);
}

function collect() {
  const path = resolve(OUT_DIR, "judge_responses.json");
  if (!existsSync(path)) { console.error(`Missing ${path}`); process.exit(1); }
  const judges: { id: string; score: number; missing: string[]; added: string[]; rationale: string }[] =
    JSON.parse(readFileSync(path, "utf-8"));

  const byHop: Record<number, number[]> = { 1: [], 2: [], 3: [] };
  for (const j of judges) {
    const m = j.id.match(/-h(\d)$/);
    if (m) byHop[+m[1]].push(j.score);
  }

  console.log("\n=== TEST 6: Multi-hop semantic drift ===\n");
  console.log(`Hop  n   mean   median   min  max   loss_per_hop`);
  let prev = 10;
  const summary: any = {};
  for (const h of [1, 2, 3] as const) {
    const xs = byHop[h];
    if (xs.length === 0) continue;
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sorted = [...xs].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const loss = prev - mean;
    console.log(`  ${h}  ${String(xs.length).padStart(2)}  ${mean.toFixed(2)}    ${median}      ${min}    ${max}    ${loss.toFixed(2)}`);
    summary[`hop${h}`] = { n: xs.length, mean, median, min, max, drop_from_prev: loss };
    prev = mean;
  }

  writeFileSync(resolve(OUT_DIR, "../06_multihop_drift.json"), JSON.stringify({ test: "multihop_drift", summary, judges }, null, 2));
  console.log(`\nResults → results/06_multihop_drift.json`);
}

const mode = process.argv[2];
const map: Record<string, () => void> = {
  "--prepare-hop1": () => prepareHop(1),
  "--process-hop1": () => processHop(1),
  "--prepare-hop2": () => prepareHop(2),
  "--process-hop2": () => processHop(2),
  "--prepare-hop3": () => prepareHop(3),
  "--process-hop3": () => processHop(3),
  "--prepare-judge": prepareJudge,
  "--collect": collect,
};
const fn = map[mode];
if (!fn) { console.error("Usage: --prepare-hop[1-3] | --process-hop[1-3] | --prepare-judge | --collect"); process.exit(1); }
fn();
