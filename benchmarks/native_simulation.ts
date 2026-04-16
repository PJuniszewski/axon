/**
 * AXON Native Output Simulation
 *
 * Tests the architectural thesis: if agents write AXON directly
 * (via CodecFit injection), how much do we save vs verbose NL?
 *
 * Calls Claude with CODECFIT_INJECT as system prompt for each
 * of the 20 real agent samples.
 *
 * Requires ANTHROPIC_API_KEY in .env
 * Run: pnpm tsx benchmarks/native_simulation.ts
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Load .env manually (no dotenv dependency)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(resolve(__dirname, "../.env"), "utf-8");
  for (const line of envFile.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length > 0) process.env[key.trim()] = rest.join("=").trim();
  }
} catch { /* no .env file */ }

import Anthropic from "@anthropic-ai/sdk";
import { CODECFIT_INJECT } from "@axon/codec";
import { countTokens } from "@axon/codec";
import { REAL_AGENT_SAMPLES } from "./real_agent_samples.js";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
function pad(s: string, n: number) { return s.padEnd(n); }
function padL(s: string, n: number) { return s.padStart(n); }
function pct(n: number) { return n >= 70 ? green(`${n}%`) : n >= 50 ? yellow(`${n}%`) : red(`${n}%`); }

const client = new Anthropic();

interface SimResult {
  id: string;
  scenario: string;
  nlTokens: number;
  nativeAxonOutput: string;
  nativeAxonTokens: number;
  reductionPct: number;
}

console.log();
console.log(bold("  ╔═══════════════════════════════════════════════════════════════╗"));
console.log(bold("  ║  NATIVE OUTPUT SIMULATION                                    ║"));
console.log(bold("  ║  Claude with CodecFit injection → AXON output vs NL baseline ║"));
console.log(bold("  ╚═══════════════════════════════════════════════════════════════╝"));
console.log();
console.log(dim(`  CodecFit prompt: ${countTokens(CODECFIT_INJECT)} tokens`));
console.log(dim(`  Model: claude-sonnet-4-20250514`));
console.log(dim(`  Samples: ${REAL_AGENT_SAMPLES.length}`));
console.log();

console.log(dim(`  ${pad("ID", 7)} ${pad("Scenario", 28)} ${padL("NL", 5)} ${padL("AXON", 6)} ${padL("Red%", 7)}  ${pad("Native Output", 50)}`));
console.log(dim("  " + "─".repeat(110)));

const results: SimResult[] = [];

for (const sample of REAL_AGENT_SAMPLES) {
  const nlTokens = countTokens(sample.agentOutput);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: CODECFIT_INJECT,
      messages: [{
        role: "user",
        content: `You are an agent. Communicate the following as an inter-agent message:\n\n${sample.expectedIntent}`,
      }],
    });

    const block = response.content[0];
    const nativeOutput = block.type === "text" ? block.text.trim() : "";
    const nativeTokens = countTokens(nativeOutput);
    const reductionPct = nlTokens > 0 ? Math.round((1 - nativeTokens / nlTokens) * 100) : 0;

    results.push({
      id: sample.id,
      scenario: sample.scenario,
      nlTokens,
      nativeAxonOutput: nativeOutput,
      nativeAxonTokens: nativeTokens,
      reductionPct,
    });

    const outTrunc = nativeOutput.length > 48 ? nativeOutput.slice(0, 45) + "..." : nativeOutput;
    console.log(
      `  ${pad(sample.id, 7)} ${pad(sample.scenario.slice(0, 27), 28)} ${padL(String(nlTokens), 5)} ${padL(String(nativeTokens), 6)} ${padL(pct(reductionPct), 16)}  ${dim(outTrunc)}`,
    );
  } catch (err: any) {
    console.log(`  ${pad(sample.id, 7)} ${pad(sample.scenario.slice(0, 27), 28)} ${red("ERROR: " + err.message)}`);
  }

  // Small delay to avoid rate limits
  await new Promise((r) => setTimeout(r, 200));
}

console.log(dim("  " + "─".repeat(110)));
console.log();

// Summary
const avgNL = Math.round(results.reduce((s, r) => s + r.nlTokens, 0) / results.length * 10) / 10;
const avgNative = Math.round(results.reduce((s, r) => s + r.nativeAxonTokens, 0) / results.length * 10) / 10;
const avgReduction = Math.round(results.reduce((s, r) => s + r.reductionPct, 0) / results.length);
const best = Math.max(...results.map((r) => r.reductionPct));
const worst = Math.min(...results.map((r) => r.reductionPct));

console.log(bold("  SUMMARY"));
console.log(`    Average NL baseline (verbose):    ${bold(String(avgNL))} tok`);
console.log(`    Average native AXON output:       ${bold(String(avgNative))} tok`);
console.log(`    Average reduction vs verbose NL:  ${pct(avgReduction)}`);
console.log(`    Best:                             ${pct(best)}`);
console.log(`    Worst:                            ${pct(worst)}`);
console.log();
console.log(`    vs rule-based encoder (46%):      ${bold("+" + (avgReduction - 46) + " pp")}`);
console.log();

console.log(bold("  ARCHITECTURAL THESIS"));
if (avgReduction >= 70) {
  console.log(green("  ✓ Native AXON output achieves 70%+ savings."));
  console.log(green("  ✓ Compression happens at generation, not transmission."));
  console.log(green("  ✓ AxonGate's value is CodecFit injection + AXON validation."));
} else if (avgReduction >= 50) {
  console.log(yellow("  ~ Native output achieves 50-69% — significant but not at thesis target."));
} else {
  console.log(red("  ✗ Native output below 50% — CodecFit prompt needs work."));
}
console.log();
