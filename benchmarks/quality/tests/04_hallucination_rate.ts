/**
 * Test 4 — Hallucination rate under decode.
 *
 * Reuses the decode outputs from test 03 (round-trip) and asks a SEPARATE
 * judge to enumerate:
 *   - facts_added: facts in DECODED but NOT in ORIGINAL  (hallucinations)
 *   - facts_lost:  facts in ORIGINAL but NOT in DECODED  (information loss)
 *   - facts_modified: same fact, wrong value
 *
 * This test does NOT need its own decode pass — it scores the same outputs
 * test 03 collected, with a different rubric. If test 03 has not run, this
 * test errors.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CORPUS } from "../corpus/messages.js";
import { RUBRIC_FACT_DELTA } from "../metrics/judge_rubrics.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/04");

interface JudgeTask { id: string; original: string; decoded: string; }
interface FactDelta { id: string; facts_lost: string[]; facts_added: string[]; facts_modified: string[]; }

function prepare() {
  mkdirSync(OUT_DIR, { recursive: true });

  const decodePath = resolve(__dirname, "../results/03/decode_responses.json");
  if (!existsSync(decodePath)) {
    console.error(`Need test 03 decode responses at ${decodePath}.`);
    console.error(`Run test 03 first.`);
    process.exit(1);
  }
  const decodes: { id: string; decoded: string }[] = JSON.parse(readFileSync(decodePath, "utf-8"));
  const decodeById = new Map(decodes.map((d) => [d.id, d.decoded]));

  const tasks: JudgeTask[] = [];
  for (const m of CORPUS) {
    const d = decodeById.get(m.id);
    if (!d) continue;
    tasks.push({ id: m.id, original: m.nl, decoded: d });
  }
  writeFileSync(resolve(OUT_DIR, "judge_payload.json"), JSON.stringify(tasks, null, 2));

  const instr = `
You are a strict fact-delta judge.

${RUBRIC_FACT_DELTA}

For EACH item in the payload, produce one delta object.

Output ONLY a JSON array of {"id", "facts_lost", "facts_added", "facts_modified"}.
No markdown. No commentary. No code fences.

PAYLOAD:
${JSON.stringify(tasks, null, 2)}
`.trim();
  writeFileSync(resolve(OUT_DIR, "judge_instructions.md"), instr);
  console.log(`Prepared ${tasks.length} fact-delta judge tasks → ${OUT_DIR}/`);
}

function collect() {
  const path = resolve(OUT_DIR, "judge_responses.json");
  if (!existsSync(path)) {
    console.error(`Missing ${path}. Send judge_instructions.md to subagent first.`);
    process.exit(1);
  }
  const deltas: FactDelta[] = JSON.parse(readFileSync(path, "utf-8"));

  const totLost = deltas.reduce((a, b) => a + (b.facts_lost?.length ?? 0), 0);
  const totAdded = deltas.reduce((a, b) => a + (b.facts_added?.length ?? 0), 0);
  const totMod = deltas.reduce((a, b) => a + (b.facts_modified?.length ?? 0), 0);
  const n = deltas.length;

  const halluPerMsg = totAdded / n;
  const lossPerMsg = totLost / n;
  const modPerMsg = totMod / n;
  const cleanMsgs = deltas.filter((d) => (d.facts_added?.length ?? 0) === 0 && (d.facts_modified?.length ?? 0) === 0).length;

  console.log("\n=== TEST 4: Hallucination rate under decode ===\n");
  console.log(`n=${n}`);
  console.log(`Hallucinations (facts_added) per message:  ${halluPerMsg.toFixed(2)}  (total ${totAdded})`);
  console.log(`Information loss (facts_lost) per message: ${lossPerMsg.toFixed(2)}   (total ${totLost})`);
  console.log(`Fact modifications per message:            ${modPerMsg.toFixed(2)}   (total ${totMod})`);
  console.log(`Clean messages (0 added & 0 modified):     ${cleanMsgs}/${n}  (${(cleanMsgs / n * 100).toFixed(0)}%)`);

  // worst hallucinators
  const sortedHall = [...deltas].sort((a, b) => (b.facts_added?.length ?? 0) - (a.facts_added?.length ?? 0));
  console.log(`\n--- Top 5 hallucinators ---`);
  for (const d of sortedHall.slice(0, 5)) {
    if ((d.facts_added?.length ?? 0) === 0) continue;
    const m = CORPUS.find((c) => c.id === d.id);
    console.log(`\n  [${d.id}] added=${d.facts_added.length}`);
    console.log(`  original: ${m?.nl ?? "?"}`);
    for (const a of d.facts_added) console.log(`    + ${a}`);
  }

  writeFileSync(resolve(OUT_DIR, "../04_hallucination_rate.json"), JSON.stringify({
    test: "hallucination_rate",
    n,
    hallucinations_per_msg: halluPerMsg,
    info_loss_per_msg: lossPerMsg,
    modifications_per_msg: modPerMsg,
    clean_msgs: cleanMsgs,
    clean_rate: cleanMsgs / n,
    deltas,
  }, null, 2));
  console.log(`\nResults → results/04_hallucination_rate.json`);
}

const mode = process.argv[2];
if (mode === "--prepare") prepare();
else if (mode === "--collect") collect();
else { console.error("Usage: --prepare | --collect"); process.exit(1); }
