/**
 * Test 9 — Adversarial / malformed AXON.
 *
 * What happens when the decoder receives:
 *   - syntactically broken AXON (unbalanced delimiters)
 *   - symbols not in the codebook
 *   - ambiguous payloads (could mean multiple things)
 *   - intentionally contradictory directives
 *   - empty / pathological inputs
 *
 * Each case has a designated "correct" behaviour, one of:
 *   - "refuse": decoder should explicitly say it cannot parse / unsure
 *   - "preserve_uncertainty": expansion should hedge or mark ambiguous
 *   - "best_effort": expansion is OK if it stays inside what's there
 *
 * Failure mode we worry about: confident hallucination of a meaning that
 * was never in the input.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CODECFIT_INJECT } from "@axon/codec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/09");

interface Case {
  id: string;
  kind: string;
  axon: string;
  correct_behaviour: "refuse" | "preserve_uncertainty" | "best_effort";
  notes: string;
}

const CASES: Case[] = [
  { id: "ad-01", kind: "unbalanced-payload", axon: "⊗ ⟦pay.svc:timeout", correct_behaviour: "refuse", notes: "missing ⟧" },
  { id: "ad-02", kind: "unbalanced-context", axon: "?@inv ⟦status⟩ ⌛5s", correct_behaviour: "refuse", notes: "mismatched ⟨⟩ vs ⟦⟧" },
  { id: "ad-03", kind: "unknown-symbol", axon: "🜨 ⟦deploy v2⟧", correct_behaviour: "refuse", notes: "🜨 not in codebook" },
  { id: "ad-04", kind: "two-intents", axon: "! ⊗ ⟦pay.svc fail⟧", correct_behaviour: "preserve_uncertainty", notes: "both REQUEST and ERROR" },
  { id: "ad-05", kind: "empty-payload", axon: "≡ ⟦⟧", correct_behaviour: "preserve_uncertainty", notes: "INFORM with no content" },
  { id: "ad-06", kind: "just-symbols", axon: "∀ ∃ ∅ ⊂ ⊕", correct_behaviour: "refuse", notes: "no intent, no payload, just operators" },
  { id: "ad-07", kind: "contradiction", axon: "∎ ⟦depl fail | depl ok⟧", correct_behaviour: "preserve_uncertainty", notes: "states both success and failure" },
  { id: "ad-08", kind: "agent-no-name", axon: "→@ ⟦rev PR#42⟧", correct_behaviour: "refuse", notes: "@ with no agent name" },
  { id: "ad-09", kind: "negation-injection", axon: "¬⊗ ⟦pay.svc:timeout⟧", correct_behaviour: "preserve_uncertainty", notes: "negated ERROR — meaning unclear" },
  { id: "ad-10", kind: "circular-ref", axon: "@a → @b → @a ⟦loop⟧", correct_behaviour: "preserve_uncertainty", notes: "circular delegation chain" },
  { id: "ad-11", kind: "empty-string", axon: "", correct_behaviour: "refuse", notes: "" },
  { id: "ad-12", kind: "only-whitespace", axon: "   \n\t  ", correct_behaviour: "refuse", notes: "" },
  { id: "ad-13", kind: "nl-disguise", axon: "Please review pull request 42", correct_behaviour: "best_effort", notes: "no AXON syntax — could be passthrough" },
  { id: "ad-14", kind: "wrong-numeric", axon: "≡ ⟦records:NaN⟧", correct_behaviour: "preserve_uncertainty", notes: "NaN is not a real count" },
  { id: "ad-15", kind: "future-reference", axon: "? @tomorrow.weather ⟦?⟧", correct_behaviour: "best_effort", notes: "valid syntax, semantically odd" },
];

function prepare() {
  mkdirSync(OUT_DIR, { recursive: true });

  const instr = `
You are an AXON decoder. AXON codebook:

${CODECFIT_INJECT}

You will receive a list of AXON inputs. Some are MALFORMED, AMBIGUOUS, or
PATHOLOGICAL. For each, you must decide:

  - "decoded": if the input can be confidently expanded to natural English,
    output the expansion. If not, output "REFUSE".
  - "confidence": 0–10 (10 = certain unambiguous meaning, 0 = nothing to
    decode).
  - "issue": brief tag explaining the issue if any, else "" (empty).

Do NOT invent meaning. If the input is broken, prefer REFUSE.

Output ONLY a JSON array of {"id", "decoded", "confidence", "issue"}.

PAYLOAD:
${JSON.stringify(CASES.map((c) => ({ id: c.id, axon: c.axon })), null, 2)}
`.trim();
  writeFileSync(resolve(OUT_DIR, "instructions.md"), instr);
  writeFileSync(resolve(OUT_DIR, "cases.json"), JSON.stringify(CASES, null, 2));
  console.log(`Adversarial cases prepared → ${OUT_DIR}/`);
}

interface Resp { id: string; decoded: string; confidence: number; issue: string; }

function collect() {
  const path = resolve(OUT_DIR, "responses.json");
  if (!existsSync(path)) { console.error(`Missing ${path}`); process.exit(1); }
  const responses: Resp[] = JSON.parse(readFileSync(path, "utf-8"));
  const respById = new Map(responses.map((r) => [r.id, r]));

  let refused = 0, hallucinated = 0, hedged = 0, bestEffortOk = 0;
  const rows: any[] = [];
  for (const c of CASES) {
    const r = respById.get(c.id);
    if (!r) continue;
    const isRefuse = (r.decoded ?? "").trim().toUpperCase() === "REFUSE" || (r.confidence ?? 10) <= 2;
    const isHedge = /(unclear|ambiguous|cannot determine|unable|might|possibly)/i.test(r.decoded ?? "") || (r.confidence ?? 10) <= 5;

    let verdict: "correct" | "hallucinated" | "over_refused" | "ok_hedge" = "correct";
    if (c.correct_behaviour === "refuse") {
      if (isRefuse) { refused++; verdict = "correct"; }
      else { hallucinated++; verdict = "hallucinated"; }
    } else if (c.correct_behaviour === "preserve_uncertainty") {
      if (isHedge || isRefuse) { hedged++; verdict = "ok_hedge"; }
      else { hallucinated++; verdict = "hallucinated"; }
    } else { // best_effort
      if (isRefuse && c.axon.trim() !== "") { verdict = "over_refused"; }
      else if (!isRefuse) { bestEffortOk++; verdict = "correct"; }
    }
    rows.push({ id: c.id, kind: c.kind, expected: c.correct_behaviour, decoded: r.decoded, confidence: r.confidence, verdict });
  }

  const total = rows.length;
  console.log("\n=== TEST 9: Adversarial / malformed AXON ===\n");
  console.log(`n = ${total} cases`);
  const counts = { correct: rows.filter((r) => r.verdict === "correct").length, ok_hedge: rows.filter((r) => r.verdict === "ok_hedge").length, hallucinated: rows.filter((r) => r.verdict === "hallucinated").length, over_refused: rows.filter((r) => r.verdict === "over_refused").length };
  console.log(`Correct refuse / ok_hedge: ${counts.correct + counts.ok_hedge}/${total}  (${((counts.correct + counts.ok_hedge) / total * 100).toFixed(0)}%)`);
  console.log(`Hallucinated:              ${counts.hallucinated}/${total}  (${(counts.hallucinated / total * 100).toFixed(0)}%)`);
  console.log(`Over-refused:              ${counts.over_refused}/${total}  (${(counts.over_refused / total * 100).toFixed(0)}%)`);

  console.log(`\n--- Hallucinated cases ---`);
  for (const r of rows.filter((r) => r.verdict === "hallucinated")) {
    const c = CASES.find((c) => c.id === r.id)!;
    console.log(`\n  [${r.id}] kind=${r.kind} expected=${r.expected}`);
    console.log(`  AXON in:    ${c.axon || "(empty)"}`);
    console.log(`  decoded:    ${r.decoded}`);
    console.log(`  confidence: ${r.confidence}`);
  }

  writeFileSync(resolve(OUT_DIR, "../09_adversarial.json"), JSON.stringify({
    test: "adversarial", n: total, counts, rows,
  }, null, 2));
  console.log(`\nResults → results/09_adversarial.json`);
}

const mode = process.argv[2];
if (mode === "--prepare") prepare();
else if (mode === "--collect") collect();
else { console.error("Usage: --prepare | --collect"); process.exit(1); }
