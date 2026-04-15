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
  axonTokensUni: number;
  axonTokensAsc: number;
  reductionPctUni: number;
  reductionPctAsc: number;
  encodedUni: string;
  encodedAsc: string;
  natural: string;
}

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function colorPct(pct: number): string {
  if (pct >= 40) return green(`${pct}%`);
  if (pct >= 25) return yellow(`${pct}%`);
  return red(`${pct}%`);
}

function pad(s: string, len: number): string { return s.padEnd(len); }
function padL(s: string, len: number): string { return s.padStart(len); }

console.log();
console.log(bold("  AXON Protocol — Benchmark Suite (real cl100k_base tokens)"));
console.log(dim(`  ${BENCHMARK_SUITE.length} canonical inter-agent messages`));
console.log();

// Header
console.log(dim(`  ${pad("ID", 4)} ${pad("Category", 12)} ${padL("NL", 4)} ${padL("Uni", 4)} ${padL("Uni%", 7)} ${padL("Asc", 4)} ${padL("Asc%", 7)}  ${pad("ASCII Encoded", 50)}`));
console.log(dim("  " + "─".repeat(100)));

const results: ResultRow[] = [];

for (const testCase of BENCHMARK_SUITE) {
  const uniResult = encode(testCase.natural);
  const ascResult = encode(testCase.natural, { ascii: true });

  results.push({
    id: testCase.id,
    category: testCase.category,
    nlTokens: uniResult.nlTokens,
    axonTokensUni: uniResult.axonTokens,
    axonTokensAsc: ascResult.axonTokens,
    reductionPctUni: uniResult.reductionPct,
    reductionPctAsc: ascResult.reductionPct,
    encodedUni: uniResult.encoded,
    encodedAsc: ascResult.encoded,
    natural: testCase.natural,
  });

  const pass = ascResult.reductionPct > 0 ? green("✓") : red("✗");
  const encTrunc = ascResult.encoded.length > 50 ? ascResult.encoded.slice(0, 47) + "..." : ascResult.encoded;

  console.log(
    `  ${pass} ${pad(testCase.id, 3)} ${pad(testCase.category, 12)} ${padL(String(uniResult.nlTokens), 4)} ${padL(String(uniResult.axonTokens), 4)} ${padL(colorPct(uniResult.reductionPct), 16)} ${padL(String(ascResult.axonTokens), 4)} ${padL(colorPct(ascResult.reductionPct), 16)}  ${dim(encTrunc)}`
  );
}

console.log(dim("  " + "─".repeat(100)));
console.log();

// Summary
const avgUni = Math.round(results.reduce((s, r) => s + r.reductionPctUni, 0) / results.length);
const avgAsc = Math.round(results.reduce((s, r) => s + r.reductionPctAsc, 0) / results.length);
const bestAsc = Math.max(...results.map((r) => r.reductionPctAsc));
const worstAsc = Math.min(...results.map((r) => r.reductionPctAsc));

console.log(bold("  Summary (real cl100k_base tokens):"));
console.log(`    Unicode avg:    ${colorPct(avgUni)} ${dim("(multi-token Unicode symbols hurt)")}`);
console.log(`    ASCII avg:      ${colorPct(avgAsc)} ${dim("(1-token ASCII alternatives)")}`);
console.log(`    ASCII best:     ${colorPct(bestAsc)}`);
console.log(`    ASCII worst:    ${colorPct(worstAsc)}`);
console.log();

// Write results JSON
const outputPath = resolve(__dirname, "results.json");
writeFileSync(
  outputPath,
  JSON.stringify({
    timestamp: new Date().toISOString(),
    tokenizer: "cl100k_base (GPT-4o)",
    summary: {
      unicodeAvgReduction: avgUni,
      asciiAvgReduction: avgAsc,
      asciiBestCase: bestAsc,
      asciiWorstCase: worstAsc,
      total: results.length,
    },
    results: results.map(({ id, category, nlTokens, axonTokensUni, axonTokensAsc, reductionPctUni, reductionPctAsc, encodedAsc }) => ({
      id, category, nlTokens, axonTokensUni, axonTokensAsc, reductionPctUni, reductionPctAsc, encodedAsc,
    })),
  }, null, 2),
);
console.log(dim(`  Results written to ${outputPath}`));
console.log();
