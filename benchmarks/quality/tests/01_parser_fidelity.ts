/**
 * Test 1 — Parser fidelity.
 *
 * Question: does the rule-based encoder always emit AXON that the
 * grammar parser accepts? And do native AXON samples we've seen LLMs
 * generate also parse?
 *
 * Method:
 *  - Run the rule-based encoder on all 30 corpus messages
 *  - Attempt parseAxon() on each output
 *  - Record exceptions / parse failures
 *  - Also test a set of known native LLM outputs (collected separately)
 *
 * Metric: % valid_parse (Wilson 95% CI)
 *
 * Deterministic. No LLM calls.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@axon/codec";
import { parseAxon } from "@axon/core";
import { CORPUS } from "../corpus/messages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results");

// AXON outputs observed in the wild from native_simulation runs.
// Pasted from earlier benchmark logs. These are real LLM emissions.
const NATIVE_SAMPLES = [
  "→@review ⟦rev PR#42 | ?tst.∀:pass → ∑@orch⟧",
  "≡ ⟦db.qry ∎ | rec:1247 ok ⊂ malformed:3⟧",
  "≡ ⟦hchk ∎ | svc:11/12 ok | pay.svc:lat↑ → ⚡ infra⟧",
  "⊗ ⟦auth.svc:timeout⟨30s⟩ → ⟳ expbkf max:5⟧",
  "!@worker.∀ ⟦scrape top10 ∀kw | ⊞ struct.data → ∑aggr⟧",
  "∎ ⟦depl ∎ | k8s.prod | svc:12 ok | hchk:∀pass⟧",
  "→@sec ⟦audit diff | ?std.comp | ∑struct.rep⟧",
  "! ⟦users.db ⊂ status:pending ∧ age≤30d → validate → ∑err.rep⟧",
  "⚡ ⟦lb:∅resp | traffic:∀aff → infra now⟧",
  "?@user.svc ⟦status ⊂ region:eu-west-1⟧",
  "→@deploy ⟦v2.4.1 ⟳ rollback api-gateway⟧",
  "✗ ⟦PR#88 | comm:3 unres ∧ ci:2 fail⟧",
  "⊕ ⟦worker-1 ∧ worker-2 ∧ worker-3 → ∑rep⟧",
  "⟳ ⟦pay.tx user:88421 → secondary⟧",
  "?@inv.svc ⟦status⟩ ⌛5s",
  "! ⟦cache.⌂ upd | ¬propagate⟧",
  "?∃ ⟦worker.pod | state:CrashLoopBackOff⟧",
  "≡ ⟦search ⊂ cust:c-44291 → ∅⟧",
  "≡ ⟦search.lat > 500ms | thresh:breach⟧",
  "! ⟦restart metrics-collector @host-01,host-02 → ?prom.scrape ⌛60s⟧",
];

interface Row { id: string; source: string; axon: string; parsed: boolean; error?: string; }

function tryParse(axon: string): { ok: boolean; err?: string } {
  try {
    parseAxon(axon);
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

function wilson(success: number, total: number): [number, number] {
  if (total === 0) return [0, 0];
  const p = success / total;
  const z = 1.96;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const halfWidth = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return [Math.max(0, (centre - halfWidth) / denom), Math.min(1, (centre + halfWidth) / denom)];
}

function main() {
  const rows: Row[] = [];

  for (const m of CORPUS) {
    const result = encode(m.nl, { ascii: false });
    const p = tryParse(result.encoded);
    rows.push({ id: m.id, source: "rule-encoder", axon: result.encoded, parsed: p.ok, error: p.err });
  }
  for (let i = 0; i < NATIVE_SAMPLES.length; i++) {
    const axon = NATIVE_SAMPLES[i];
    const p = tryParse(axon);
    rows.push({ id: `native-${String(i + 1).padStart(2, "0")}`, source: "native-llm", axon, parsed: p.ok, error: p.err });
  }

  const ruleRows = rows.filter((r) => r.source === "rule-encoder");
  const nativeRows = rows.filter((r) => r.source === "native-llm");
  const total = rows.length;
  const passed = rows.filter((r) => r.parsed).length;

  const rulePassed = ruleRows.filter((r) => r.parsed).length;
  const nativePassed = nativeRows.filter((r) => r.parsed).length;

  const overall = passed / total;
  const [lo, hi] = wilson(passed, total);
  const [rLo, rHi] = wilson(rulePassed, ruleRows.length);
  const [nLo, nHi] = wilson(nativePassed, nativeRows.length);

  console.log("\n=== TEST 1: Parser Fidelity ===\n");
  console.log(`Rule-based encoder:  ${rulePassed}/${ruleRows.length} parsed  (${(rulePassed / ruleRows.length * 100).toFixed(1)}%)  [95% CI: ${(rLo * 100).toFixed(1)}–${(rHi * 100).toFixed(1)}%]`);
  console.log(`Native LLM samples:  ${nativePassed}/${nativeRows.length} parsed  (${(nativePassed / nativeRows.length * 100).toFixed(1)}%)  [95% CI: ${(nLo * 100).toFixed(1)}–${(nHi * 100).toFixed(1)}%]`);
  console.log(`Overall:             ${passed}/${total} parsed  (${(overall * 100).toFixed(1)}%)  [95% CI: ${(lo * 100).toFixed(1)}–${(hi * 100).toFixed(1)}%]`);

  const failures = rows.filter((r) => !r.parsed);
  if (failures.length > 0) {
    console.log("\n--- Parse failures ---");
    for (const f of failures) {
      console.log(`  [${f.source} ${f.id}]  ${f.axon}`);
      console.log(`    → ${f.error}`);
    }
  } else {
    console.log("\nAll samples parsed cleanly.");
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const out = {
    test: "parser_fidelity",
    n: total,
    overall: { passed, total, rate: overall, ci95: [lo, hi] },
    by_source: {
      rule_encoder: { passed: rulePassed, total: ruleRows.length, rate: rulePassed / ruleRows.length, ci95: [rLo, rHi] },
      native_llm: { passed: nativePassed, total: nativeRows.length, rate: nativePassed / nativeRows.length, ci95: [nLo, nHi] },
    },
    rows,
  };
  writeFileSync(resolve(OUT_DIR, "01_parser_fidelity.json"), JSON.stringify(out, null, 2));
  console.log(`\nResults → ${resolve(OUT_DIR, "01_parser_fidelity.json")}`);
}

main();
