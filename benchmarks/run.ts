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
  natural: string;
  passedMin: boolean;
}

const results: ResultRow[] = [];
let failures = 0;

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function colorPct(pct: number): string {
  if (pct >= 60) return green(`${pct}%`);
  if (pct >= 50) return yellow(`${pct}%`);
  return red(`${pct}%`);
}

function pad(s: string, len: number): string {
  return s.padEnd(len);
}

function padLeft(s: string, len: number): string {
  return s.padStart(len);
}

console.log();
console.log(bold("  AXON Protocol — Benchmark Suite"));
console.log(dim(`  ${BENCHMARK_SUITE.length} canonical inter-agent messages`));
console.log();

// Header
const header = `  ${pad("ID", 4)} ${pad("Category", 12)} ${padLeft("NL", 4)} ${padLeft("AXON", 5)} ${padLeft("Reduction", 10)}  ${pad("Encoded", 50)}`;
console.log(dim(header));
console.log(dim("  " + "─".repeat(90)));

for (const testCase of BENCHMARK_SUITE) {
  const result = encode(testCase.natural);
  const passedMin = result.reductionPct >= testCase.minReductionPct;

  if (!passedMin) failures++;

  results.push({
    id: testCase.id,
    category: testCase.category,
    nlTokens: result.nlTokens,
    axonTokens: result.axonTokens,
    reductionPct: result.reductionPct,
    encoded: result.encoded,
    natural: testCase.natural,
    passedMin,
  });

  const statusMark = passedMin ? green("✓") : red("✗");
  const encodedTrunc = result.encoded.length > 50 ? result.encoded.slice(0, 47) + "..." : result.encoded;

  console.log(
    `  ${statusMark} ${pad(testCase.id, 3)} ${pad(testCase.category, 12)} ${padLeft(String(result.nlTokens), 4)} ${padLeft(String(result.axonTokens), 5)} ${padLeft(colorPct(result.reductionPct), 19)}  ${dim(encodedTrunc)}`
  );
}

// Summary
const avgReduction = Math.round(results.reduce((s, r) => s + r.reductionPct, 0) / results.length);
const bestCase = Math.max(...results.map((r) => r.reductionPct));
const worstCase = Math.min(...results.map((r) => r.reductionPct));

console.log(dim("  " + "─".repeat(90)));
console.log();
console.log(`  ${bold("Summary:")}`);
console.log(`    Average reduction: ${colorPct(avgReduction)}`);
console.log(`    Best case:         ${colorPct(bestCase)}`);
console.log(`    Worst case:        ${colorPct(worstCase)}`);
console.log(`    Passed:            ${results.length - failures}/${results.length}`);
console.log();

// Write results JSON
const outputPath = resolve(__dirname, "results.json");
writeFileSync(
  outputPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      summary: { avgReduction, bestCase, worstCase, total: results.length, passed: results.length - failures },
      results: results.map(({ id, category, nlTokens, axonTokens, reductionPct, encoded, passedMin }) => ({
        id, category, nlTokens, axonTokens, reductionPct, encoded, passedMin,
      })),
    },
    null,
    2,
  ),
);
console.log(dim(`  Results written to ${outputPath}`));
console.log();

if (failures > 0) {
  console.log(red(`  ${failures} case(s) failed minimum reduction threshold.`));
  process.exit(1);
}
