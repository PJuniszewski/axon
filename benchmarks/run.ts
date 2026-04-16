import { encode } from "@axon/codec";
import { BENCHMARK_SUITE } from "./suite.js";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ResultRow {
  id: string;
  category: string;
  nlTokens: number;
  axonTokens: number;
  reductionPct: number;
  encoded: string;
  skipped: boolean;
  tier: "short" | "medium" | "long";
  pass: boolean;
}

// Tiered pass criteria
function getPassCriteria(nlTokens: number, reductionPct: number, skipped: boolean): { tier: "short" | "medium" | "long"; pass: boolean } {
  if (nlTokens <= 5) return { tier: "short", pass: skipped };
  if (nlTokens <= 20) return { tier: "medium", pass: reductionPct >= 20 };
  return { tier: "long", pass: reductionPct >= 40 };
}

// Colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function colorPct(pct: number): string {
  if (pct >= 45) return green(`${pct}%`);
  if (pct >= 30) return yellow(`${pct}%`);
  return red(`${pct}%`);
}
function pad(s: string, n: number) { return s.padEnd(n); }
function padL(s: string, n: number) { return s.padStart(n); }

console.log();
console.log(bold("  AXON Encoder Benchmark — Phase 2 (real cl100k_base, ASCII mode)"));
console.log(dim(`  ${BENCHMARK_SUITE.length} messages, tiered pass criteria`));
console.log();

console.log(dim(`  ${pad("ID", 4)} ${pad("Category", 12)} ${padL("NL", 4)} ${padL("AXON", 5)} ${padL("Red%", 6)} ${pad("Tier", 7)} ${pad("Skip", 5)} ${pad("Encoded", 55)}`));
console.log(dim("  " + "─".repeat(105)));

const results: ResultRow[] = [];
let failures = 0;

for (const testCase of BENCHMARK_SUITE) {
  const r = encode(testCase.natural, { ascii: true });
  const { tier, pass } = getPassCriteria(r.nlTokens, r.reductionPct, !!r.skipped);
  if (!pass) failures++;

  results.push({
    id: testCase.id,
    category: testCase.category,
    nlTokens: r.nlTokens,
    axonTokens: r.axonTokens,
    reductionPct: r.reductionPct,
    encoded: r.encoded,
    skipped: !!r.skipped,
    tier,
    pass,
  });

  const mark = pass ? green("✓") : red("✗");
  const skipStr = r.skipped ? dim("skip") : "    ";
  const encTrunc = r.encoded.length > 52 ? r.encoded.slice(0, 49) + "..." : r.encoded;

  console.log(
    `  ${mark} ${pad(testCase.id, 3)} ${pad(testCase.category, 12)} ${padL(String(r.nlTokens), 4)} ${padL(String(r.axonTokens), 5)} ${padL(colorPct(r.reductionPct), 15)} ${pad(tier, 7)} ${skipStr}  ${dim(encTrunc)}`
  );
}

console.log(dim("  " + "─".repeat(105)));
console.log();

// Summary
const nonSkipped = results.filter((r) => !r.skipped);
const longCases = results.filter((r) => r.tier === "long");
const avgAll = nonSkipped.length > 0
  ? Math.round(nonSkipped.reduce((s, r) => s + r.reductionPct, 0) / nonSkipped.length)
  : 0;
const avgLong = longCases.length > 0
  ? Math.round(longCases.reduce((s, r) => s + r.reductionPct, 0) / longCases.length)
  : 0;
const best = nonSkipped.length > 0 ? Math.max(...nonSkipped.map((r) => r.reductionPct)) : 0;
const worst = nonSkipped.length > 0 ? Math.min(...nonSkipped.map((r) => r.reductionPct)) : 0;
const passRate = `${results.length - failures}/${results.length}`;

const overallPass = avgAll >= 35;

console.log(bold("  Summary (ASCII mode, real cl100k_base tokens):"));
console.log(`    Avg (non-skipped):  ${colorPct(avgAll)} ${overallPass ? green("PASS (≥35%)") : red("FAIL (<35%)")}`);
console.log(`    Avg (long, 21+tok): ${colorPct(avgLong)}`);
console.log(`    Best:               ${colorPct(best)}`);
console.log(`    Worst:              ${colorPct(worst)}`);
console.log(`    Pass rate:          ${passRate}`);
console.log();
console.log(dim("  Tiered criteria: short(≤5tok)=skip, medium(6-20tok)≥20%, long(21+tok)≥40%"));
console.log();

// Write results
const outputPath = resolve(__dirname, "results.json");
writeFileSync(
  outputPath,
  JSON.stringify({
    timestamp: new Date().toISOString(),
    tokenizer: "cl100k_base",
    mode: "ascii",
    summary: { avgReduction: avgAll, avgLong, best, worst, total: results.length, passed: results.length - failures },
    results: results.map(({ id, category, nlTokens, axonTokens, reductionPct, encoded, skipped, tier, pass }) => ({
      id, category, nlTokens, axonTokens, reductionPct, encoded, skipped, tier, pass,
    })),
  }, null, 2),
);
console.log(dim(`  Written to ${outputPath}`));
console.log();

if (!overallPass) {
  console.log(red(`  FAIL: average reduction ${avgAll}% is below 35% target.`));
  process.exit(1);
}
if (failures > 0) {
  console.log(yellow(`  ${failures} case(s) failed tiered criteria (but overall avg passes).`));
}
