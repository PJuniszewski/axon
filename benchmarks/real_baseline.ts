/**
 * AXON Phase 3 — Realistic Baseline Validation
 *
 * Runs real verbose agent output through the encoder and measures
 * honest token savings with cl100k_base. No encoder changes — measurement only.
 *
 * Includes:
 *   Task 2 — Main comparison table (NL vs AXON vs human intent)
 *   Task 3 — Segment analysis (filler vs phrase vs structural breakdown)
 *   Task 4 — Heuristic vs real token count audit
 */

import { REAL_AGENT_SAMPLES } from "./real_agent_samples.js";
import { encode } from "@axon/codec";
import { countTokens } from "@axon/codec";
import { PHRASE_MAP } from "@axon/core";

// ── Colors ──
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
function pad(s: string, n: number) { return s.padEnd(n); }
function padL(s: string, n: number) { return s.padStart(n); }
function pct(n: number) { return n >= 50 ? green(`${n}%`) : n >= 35 ? yellow(`${n}%`) : red(`${n}%`); }

// ═══════════════════════════════════════════════════════════════════
// TASK 2 — Main Comparison Table
// ═══════════════════════════════════════════════════════════════════

console.log();
console.log(bold("  ╔══════════════════════════════════════════════════════════════════╗"));
console.log(bold("  ║  REAL AGENT OUTPUT BASELINE (cl100k_base, ASCII mode)           ║"));
console.log(bold("  ╚══════════════════════════════════════════════════════════════════╝"));
console.log();

interface BaselineResult {
  id: string;
  scenario: string;
  nlTokens: number;
  axonTokens: number;
  intentTokens: number;
  reductionPct: number;
  intentReductionPct: number;
  encoded: string;
  skipped: boolean;
}

const results: BaselineResult[] = [];

console.log(dim(`  ${pad("ID", 7)} ${pad("Scenario", 28)} ${padL("NL", 5)} ${padL("AXON", 6)} ${padL("Red%", 6)} ${padL("Intent", 8)} ${padL("Max%", 6)}`));
console.log(dim("  " + "─".repeat(70)));

for (const sample of REAL_AGENT_SAMPLES) {
  const nlTokens = countTokens(sample.agentOutput);
  const axonResult = encode(sample.agentOutput, { ascii: true });
  const intentTokens = countTokens(sample.expectedIntent);

  const reductionPct = nlTokens > 0 ? Math.round((1 - axonResult.axonTokens / nlTokens) * 100) : 0;
  const intentReductionPct = nlTokens > 0 ? Math.round((1 - intentTokens / nlTokens) * 100) : 0;

  results.push({
    id: sample.id,
    scenario: sample.scenario,
    nlTokens,
    axonTokens: axonResult.axonTokens,
    intentTokens,
    reductionPct,
    intentReductionPct,
    encoded: axonResult.encoded,
    skipped: !!axonResult.skipped,
  });

  console.log(
    `  ${pad(sample.id, 7)} ${pad(sample.scenario.slice(0, 27), 28)} ${padL(String(nlTokens), 5)} ${padL(String(axonResult.axonTokens), 6)} ${padL(pct(reductionPct), 15)} ${padL(String(intentTokens), 8)} ${padL(pct(intentReductionPct), 15)}`
  );
}

console.log(dim("  " + "─".repeat(70)));
console.log();

const avgNL = Math.round(results.reduce((s, r) => s + r.nlTokens, 0) / results.length * 10) / 10;
const avgAXON = Math.round(results.reduce((s, r) => s + r.axonTokens, 0) / results.length * 10) / 10;
const avgIntent = Math.round(results.reduce((s, r) => s + r.intentTokens, 0) / results.length * 10) / 10;
const avgReduction = Math.round(results.reduce((s, r) => s + r.reductionPct, 0) / results.length);
const avgIntentReduction = Math.round(results.reduce((s, r) => s + r.intentReductionPct, 0) / results.length);
const bestReduction = Math.max(...results.map(r => r.reductionPct));
const worstReduction = Math.min(...results.map(r => r.reductionPct));
const gap = avgIntentReduction - avgReduction;

console.log(bold("  SUMMARY"));
console.log(`    Average NL tokens:           ${bold(String(avgNL))}`);
console.log(`    Average AXON tokens:         ${bold(String(avgAXON))}`);
console.log(`    Average reduction:           ${pct(avgReduction)}`);
console.log(`    Best reduction:              ${pct(bestReduction)}`);
console.log(`    Worst reduction:             ${pct(worstReduction)}`);
console.log(`    Average intent tokens:       ${bold(String(avgIntent))}`);
console.log(`    Theoretical max (human):     ${pct(avgIntentReduction)}`);
console.log(`    Gap to theoretical max:      ${bold(gap + " pp")}`);
console.log();

// ═══════════════════════════════════════════════════════════════════
// TASK 3 — Segment Analysis
// ═══════════════════════════════════════════════════════════════════

console.log(bold("  ╔══════════════════════════════════════════════════════════════════╗"));
console.log(bold("  ║  SEGMENT ANALYSIS — Where do savings come from?                ║"));
console.log(bold("  ╚══════════════════════════════════════════════════════════════════╝"));
console.log();

// Filler words from the encoder
const FILLER_MULTI = [
  "it should be noted that", "please be aware that", "i would like you to",
  "you are required to", "please make sure", "i need you to", "i want you to",
  "could you please", "would you please", "please note that", "the following task",
  "your task is to", "the task is to", "make sure that", "make sure to",
  "you need to", "ensure that", "in order to", "following that", "described below",
  "outlined below", "the following", "listed below", "so that", "such that",
  "note that", "and then", "after that", "subsequently", "at the moment",
  "at this time", "as soon as possible", "in addition", "additionally",
  "furthermore", "moreover", "as follows", "could you", "would you",
  "you should", "you must", "i need",
];
const FILLER_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "it", "its", "this", "that", "these", "those", "also", "just", "then",
  "so", "very", "really", "basically", "actually", "currently", "of", "with",
  "if", "no", "not", "there", "and", "or", "but", "to", "for", "from",
  "by", "at", "in", "on", "up", "has", "have", "had", "do", "does", "did",
  "can", "could", "would", "should", "may", "might", "i", "you", "we",
  "they", "he", "she", "send", "sent", "get", "got", "data", "them",
  "into", "need", "needs", "gone", "across", "when", "now", "due", "back",
  "next", "step", "while", "where", "what", "which", "how", "my", "your",
  "our", "their", "any", "some", "each", "every", "here", "below", "above",
  "please", "kindly", "than", "more", "most", "less", "like", "such", "only",
  "about", "over", "under", "between", "other", "another", "rest", "using",
  "through", "after", "before", "being", "having", "will", "carefully",
  "thoroughly", "properly", "correctly", "all", "still", "been", "then",
  "that", "these", "each", "them", "its", "own", "relevant", "required",
  "specified", "within", "against", "during", "including", "based", "per",
  "both", "multiple", "standard", "final", "detailed", "comprehensive",
  "assigned", "provided", "available", "acceptable", "potential", "applicable",
  "appropriate", "out", "down", "already",
]);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFillersOnly(text: string): string {
  let result = text;
  for (const phrase of FILLER_MULTI) {
    result = result.replace(new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi"), " ");
  }
  const words = result.split(/\s+/).filter(Boolean);
  return words.filter(w => !FILLER_WORDS.has(w.toLowerCase())).join(" ");
}

function compressPhrasesOnly(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PHRASE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

interface SegmentRow {
  id: string;
  fillerSaved: number;
  phraseSaved: number;
  structuralOverhead: number;
  netSaving: number;
  netPct: number;
}

const segments: SegmentRow[] = [];

console.log(dim(`  ${pad("ID", 7)} ${padL("Filler", 8)} ${padL("Phrase", 8)} ${padL("Struct", 8)} ${padL("Net", 8)} ${padL("Net%", 6)}`));
console.log(dim("  " + "─".repeat(50)));

for (const sample of REAL_AGENT_SAMPLES) {
  const nlTokens = countTokens(sample.agentOutput);

  // Filler-only pass: strip fillers, count remaining tokens
  const afterFiller = stripFillersOnly(sample.agentOutput);
  const afterFillerTokens = countTokens(afterFiller);
  const fillerSaved = nlTokens - afterFillerTokens;

  // Phrase-only pass: compress phrases (no filler strip), count tokens
  const afterPhrase = compressPhrasesOnly(sample.agentOutput);
  const afterPhraseTokens = countTokens(afterPhrase);
  const phraseSaved = nlTokens - afterPhraseTokens;

  // Full encode
  const fullResult = encode(sample.agentOutput, { ascii: true });
  const netSaving = nlTokens - fullResult.axonTokens;
  const netPct = nlTokens > 0 ? Math.round((netSaving / nlTokens) * 100) : 0;

  // Structural overhead = what the encoder adds (intent symbol, wrappers, etc.)
  // overhead = (fillerSaved + phraseSaved) - netSaving
  // (i.e., how much of the raw savings is eaten by protocol structure)
  const structuralOverhead = (fillerSaved + phraseSaved) - netSaving;

  segments.push({ id: sample.id, fillerSaved, phraseSaved, structuralOverhead, netSaving, netPct });

  console.log(
    `  ${pad(sample.id, 7)} ${padL(fillerSaved + " tok", 8)} ${padL(phraseSaved + " tok", 8)} ${padL("-" + structuralOverhead + " tok", 8)} ${padL(netSaving + " tok", 8)} ${padL(pct(netPct), 15)}`
  );
}

console.log(dim("  " + "─".repeat(50)));
console.log();

const avgFiller = Math.round(segments.reduce((s, r) => s + r.fillerSaved, 0) / segments.length * 10) / 10;
const avgPhrase = Math.round(segments.reduce((s, r) => s + r.phraseSaved, 0) / segments.length * 10) / 10;
const avgOverhead = Math.round(segments.reduce((s, r) => s + r.structuralOverhead, 0) / segments.length * 10) / 10;
const avgNet = Math.round(segments.reduce((s, r) => s + r.netSaving, 0) / segments.length * 10) / 10;
const avgNetPct = Math.round(segments.reduce((s, r) => s + r.netPct, 0) / segments.length);

console.log(`  ${bold("Averages:")}`);
console.log(`    Filler tokens saved:     ${bold(String(avgFiller))} tok/msg`);
console.log(`    Phrase tokens saved:     ${bold(String(avgPhrase))} tok/msg`);
console.log(`    Structural overhead:     ${bold("-" + avgOverhead)} tok/msg`);
console.log(`    Net saving:              ${bold(String(avgNet))} tok/msg (${pct(avgNetPct)})`);
console.log();

// ═══════════════════════════════════════════════════════════════════
// TASK 4 — Heuristic vs Real Token Count Audit
// ═══════════════════════════════════════════════════════════════════

console.log(bold("  ╔══════════════════════════════════════════════════════════════════╗"));
console.log(bold("  ║  HEURISTIC vs REAL TOKEN COUNT AUDIT                           ║"));
console.log(bold("  ╚══════════════════════════════════════════════════════════════════╝"));
console.log();
console.log(dim("  Old heuristic: NL = words × 1.35, AXON = chars / 4"));
console.log();

function heuristicNL(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.35);
}
function heuristicAXON(text: string): number {
  return Math.ceil(text.length / 4);
}

console.log(dim(`  ${pad("Sample", 7)} ${padL("NL(heur)", 9)} ${padL("NL(real)", 9)} ${padL("Err%", 6)} ${padL("AX(heur)", 9)} ${padL("AX(real)", 9)} ${padL("Err%", 6)} ${padL("Heur%", 7)} ${padL("Real%", 7)}`));
console.log(dim("  " + "─".repeat(80)));

let totalHeurNL = 0, totalRealNL = 0;
let totalHeurAX = 0, totalRealAX = 0;

for (const sample of REAL_AGENT_SAMPLES) {
  const realNL = countTokens(sample.agentOutput);
  const heurNL = heuristicNL(sample.agentOutput);
  const nlErr = Math.round(((heurNL - realNL) / realNL) * 100);

  const axonResult = encode(sample.agentOutput, { ascii: true });
  const realAX = axonResult.axonTokens;
  const heurAX = heuristicAXON(axonResult.encoded);
  const axErr = realAX > 0 ? Math.round(((heurAX - realAX) / realAX) * 100) : 0;

  const heurReduction = heurNL > 0 ? Math.round((1 - heurAX / heurNL) * 100) : 0;
  const realReduction = realNL > 0 ? Math.round((1 - realAX / realNL) * 100) : 0;

  totalHeurNL += heurNL; totalRealNL += realNL;
  totalHeurAX += heurAX; totalRealAX += realAX;

  const nlErrColor = Math.abs(nlErr) <= 15 ? green : Math.abs(nlErr) <= 25 ? yellow : red;
  const axErrColor = Math.abs(axErr) <= 15 ? green : Math.abs(axErr) <= 25 ? yellow : red;

  console.log(
    `  ${pad(sample.id, 7)} ${padL(String(heurNL), 9)} ${padL(String(realNL), 9)} ${padL(nlErrColor(nlErr + "%"), 15)} ${padL(String(heurAX), 9)} ${padL(String(realAX), 9)} ${padL(axErrColor(axErr + "%"), 15)} ${padL(pct(heurReduction), 16)} ${padL(pct(realReduction), 16)}`
  );
}

console.log(dim("  " + "─".repeat(80)));
console.log();

const avgNLErr = Math.round(((totalHeurNL - totalRealNL) / totalRealNL) * 100);
const avgAXErr = totalRealAX > 0 ? Math.round(((totalHeurAX - totalRealAX) / totalRealAX) * 100) : 0;
const heurOverall = Math.round((1 - totalHeurAX / totalHeurNL) * 100);
const realOverall = Math.round((1 - totalRealAX / totalRealNL) * 100);

console.log(`  ${bold("Heuristic error totals:")}`);
console.log(`    NL estimation error:     ${avgNLErr > 0 ? red("+" + avgNLErr + "%") : green(avgNLErr + "%")} (heuristic ${avgNLErr > 0 ? "overestimates" : "underestimates"})`);
console.log(`    AXON estimation error:   ${avgAXErr < 0 ? red(avgAXErr + "%") : avgAXErr > 0 ? yellow("+" + avgAXErr + "%") : green(avgAXErr + "%")} (heuristic ${avgAXErr < 0 ? "underestimates" : "overestimates"})`);
console.log(`    Heuristic reduction:     ${pct(heurOverall)}`);
console.log(`    Real reduction:          ${pct(realOverall)}`);
console.log(`    Inflation:               ${bold((heurOverall - realOverall) + " pp")} (heuristic overstates savings)`);
console.log();

// ═══════════════════════════════════════════════════════════════════
// Final Verdict
// ═══════════════════════════════════════════════════════════════════

console.log(bold("  ╔══════════════════════════════════════════════════════════════════╗"));
console.log(bold("  ║  VERDICT                                                       ║"));
console.log(bold("  ╚══════════════════════════════════════════════════════════════════╝"));
console.log();
console.log(`  AXON achieves ${pct(avgReduction)} average real token savings on verbose agent output.`);
console.log(`  On ${REAL_AGENT_SAMPLES.length} realistic samples averaging ${avgNL} NL tokens each.`);
console.log();
if (avgReduction >= 50) {
  console.log(green("  ✓ AXON achieves 50%+ savings on realistic verbose agent traffic."));
} else if (avgReduction >= 40) {
  console.log(yellow("  ~ AXON achieves 40-49% savings. Close but below 50% target."));
} else {
  console.log(red(`  ✗ AXON achieves only ${avgReduction}% savings. Below 50% target.`));
}
console.log(`  Gap to human-compressed intent: ${bold(gap + " pp")} — room for LLM-based encoder to close.`);
console.log(`  Filler stripping drives ${bold(Math.round(avgFiller / avgNet * 100) + "%")} of savings, phrase compression drives ${bold(Math.round(avgPhrase / avgNet * 100) + "%")}.`);
console.log();
