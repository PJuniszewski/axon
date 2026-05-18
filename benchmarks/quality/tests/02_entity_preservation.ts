/**
 * Test 2 — Entity preservation under NL→AXON encoding.
 *
 * Question: when the rule-based encoder compresses a NL message, do the
 * critical entities (numbers, IDs, agent names) survive into the AXON?
 *
 * Method:
 *  - For each annotated corpus message, encode NL → AXON
 *  - Check whether each ground-truth entity (numbers, ids) appears
 *    substring-wise (case-insensitive) in the AXON output
 *  - For intent: check that the AXON output starts with the expected
 *    performative symbol (mapped from the intent label)
 *  - For qualifiers: check substring or codebook-symbol coverage
 *      (e.g. "all" → ∀, "any" → ∃, "no/none/null" → ∅, "only/filter" → ⊂)
 *
 * Metric: per-message entity_recall = matched / total
 *         aggregate macro-average
 *
 * Deterministic. No LLM calls.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@axon/codec";
import { CORPUS, type AnnotatedMessage } from "../corpus/messages.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results");

const INTENT_TO_SYMBOL: Record<string, string[]> = {
  request: ["!"],
  query: ["?"],
  inform: ["≡"],
  delegate: ["→"],
  merge: ["⊕"],
  confirm: ["✓"],
  reject: ["✗"],
  error: ["⊗"],
  complete: ["∎"],
  retry: ["⟳"],
  urgent: ["⚡"],
};

const QUALIFIER_FALLBACKS: Record<string, string[]> = {
  all: ["∀", "all"],
  any: ["∃", "any"],
  no: ["∅", "no", "not"],
  none: ["∅", "none"],
  not: ["¬", "∅", "not"],
  only: ["⊂", "only"],
  filter: ["⊂", "filter"],
  greater: [">", "≥", "greater"],
  "greater than": [">", "≥"],
  "less than": ["<", "≤"],
  "less than or equal": ["≤"],
  "approximately": ["~", "approx", "≈"],
  "might": ["?", "might", "maybe"],
  "before": ["before"],
  "after": ["after", "⌛"],
  "within": ["⌛", "within"],
  "if": ["if", "?"],
  "otherwise": ["otherwise", "else", "|"],
  "during": ["during"],
  "until": ["until", "before"],
  "because": ["because", "→", "due"],
  "depends on": ["depends", "→", "dep"],
  "primary": ["primary", "prim"],
  "immediate": ["⚡", "now", "immediate"],
  "exponential": ["expbkf", "exp"],
  "maximum": ["max", "≤"],
  "exceeded": ["exceed", ">", "breach"],
  "breached": ["breach", "exceed"],
};

interface EntityHits {
  numbers: { wanted: (string | number)[]; matched: string[]; missed: (string | number)[] };
  ids: { wanted: string[]; matched: string[]; missed: string[] };
  intent: { wanted: string; matched: boolean; foundSymbol?: string };
  qualifiers: { wanted: string[]; matched: string[]; missed: string[] };
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function checkEntities(msg: AnnotatedMessage, axon: string): EntityHits {
  const axonLower = axon.toLowerCase();

  const numMatched: string[] = [];
  const numMissed: (string | number)[] = [];
  for (const n of msg.entities.numbers) {
    const s = String(n).toLowerCase();
    if (axonLower.includes(s)) numMatched.push(s);
    else numMissed.push(n);
  }

  const idMatched: string[] = [];
  const idMissed: string[] = [];
  for (const id of msg.entities.ids) {
    const idLower = id.toLowerCase();
    // try full match, then progressively shortened (handle service-name → svc-name compressions)
    const variants = [idLower, idLower.replace(/-service$/, ""), idLower.replace(/-/g, "")];
    if (variants.some((v) => v.length >= 2 && axonLower.includes(v))) idMatched.push(id);
    else idMissed.push(id);
  }

  const intentSymbols = INTENT_TO_SYMBOL[msg.entities.intent] ?? [];
  let intentHit = false;
  let foundSym: string | undefined;
  for (const sym of intentSymbols) {
    if (axon.includes(sym)) { intentHit = true; foundSym = sym; break; }
  }

  const qMatched: string[] = [];
  const qMissed: string[] = [];
  for (const q of msg.entities.qualifiers) {
    const qLower = q.toLowerCase();
    const alts = QUALIFIER_FALLBACKS[qLower] ?? [qLower];
    if (alts.some((a) => axonLower.includes(a.toLowerCase()) || axon.includes(a))) qMatched.push(q);
    else qMissed.push(q);
  }

  return {
    numbers: { wanted: msg.entities.numbers, matched: numMatched, missed: numMissed },
    ids: { wanted: msg.entities.ids, matched: idMatched, missed: idMissed },
    intent: { wanted: msg.entities.intent, matched: intentHit, foundSymbol: foundSym },
    qualifiers: { wanted: msg.entities.qualifiers, matched: qMatched, missed: qMissed },
  };
}

function recallOf(group: { wanted: any[]; matched: any[] }) {
  if (group.wanted.length === 0) return null;
  return group.matched.length / group.wanted.length;
}

interface Row {
  id: string;
  category: string;
  nl: string;
  axon: string;
  numberRecall: number | null;
  idRecall: number | null;
  intentHit: boolean | null;
  qualifierRecall: number | null;
  overallRecall: number;
  hits: EntityHits;
}

function main() {
  const rows: Row[] = [];

  for (const m of CORPUS) {
    const enc = encode(m.nl, { ascii: false });
    const hits = checkEntities(m, enc.encoded);

    const nR = recallOf(hits.numbers);
    const iR = recallOf(hits.ids);
    const iH = INTENT_TO_SYMBOL[m.entities.intent] ? hits.intent.matched : null;
    const qR = recallOf(hits.qualifiers);

    const groups = [nR, iR, iH === null ? null : iH ? 1 : 0, qR].filter((x): x is number => x !== null);
    const overall = groups.length === 0 ? 0 : groups.reduce((a, b) => a + b, 0) / groups.length;

    rows.push({
      id: m.id,
      category: m.category,
      nl: m.nl,
      axon: enc.encoded,
      numberRecall: nR,
      idRecall: iR,
      intentHit: iH,
      qualifierRecall: qR,
      overallRecall: overall,
      hits,
    });
  }

  const meanRecall = (key: keyof Row) => {
    const vals = rows.map((r) => r[key]).filter((v): v is number => typeof v === "number");
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  const meanBool = (key: keyof Row) => {
    const vals = rows.map((r) => r[key]).filter((v): v is boolean => typeof v === "boolean");
    return vals.length === 0 ? 0 : vals.filter(Boolean).length / vals.length;
  };

  const macro = {
    numbers: meanRecall("numberRecall"),
    ids: meanRecall("idRecall"),
    intent: meanBool("intentHit"),
    qualifiers: meanRecall("qualifierRecall"),
    overall: rows.reduce((a, b) => a + b.overallRecall, 0) / rows.length,
  };

  console.log("\n=== TEST 2: Entity Preservation (NL → AXON) ===\n");
  console.log(`Numbers macro-recall:    ${(macro.numbers * 100).toFixed(1)}%`);
  console.log(`IDs macro-recall:        ${(macro.ids * 100).toFixed(1)}%`);
  console.log(`Intent hit rate:         ${(macro.intent * 100).toFixed(1)}%`);
  console.log(`Qualifiers macro-recall: ${(macro.qualifiers * 100).toFixed(1)}%`);
  console.log(`Overall macro-recall:    ${(macro.overall * 100).toFixed(1)}%`);

  const worst = [...rows].sort((a, b) => a.overallRecall - b.overallRecall).slice(0, 5);
  console.log("\n--- Worst 5 cases (lowest recall) ---");
  for (const w of worst) {
    console.log(`\n  [${w.id} | ${w.category}] recall=${(w.overallRecall * 100).toFixed(0)}%`);
    console.log(`  NL:    ${w.nl}`);
    console.log(`  AXON:  ${w.axon}`);
    if (w.hits.numbers.missed.length) console.log(`  missed numbers:    ${w.hits.numbers.missed.join(", ")}`);
    if (w.hits.ids.missed.length) console.log(`  missed ids:        ${w.hits.ids.missed.join(", ")}`);
    if (w.intentHit === false) console.log(`  missed intent:     ${w.hits.intent.wanted}`);
    if (w.hits.qualifiers.missed.length) console.log(`  missed qualifiers: ${w.hits.qualifiers.missed.join(", ")}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, "02_entity_preservation.json"), JSON.stringify({ test: "entity_preservation", n: rows.length, macro, rows }, null, 2));
  console.log(`\nResults → ${resolve(OUT_DIR, "02_entity_preservation.json")}`);
}

main();
