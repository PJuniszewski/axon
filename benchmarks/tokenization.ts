/**
 * AXON Symbol Tokenization Benchmark
 *
 * Tests how each of the 31 AXON codebook symbols tokenizes on cl100k_base
 * (GPT-4/4o encoding, closest available proxy for Claude's tokenizer).
 *
 * If a symbol tokenizes as 2+ tokens, the entire compression thesis weakens
 * for that symbol. We flag offenders and propose ASCII-safe alternatives.
 */

import { encodingForModel } from "js-tiktoken";
import { CODEBOOK } from "@axon/core";

const enc = encodingForModel("gpt-4o");

// ── Colors ──
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ASCII-safe alternatives for symbols that may tokenize badly
const ASCII_ALTERNATIVES: Record<string, string> = {
  "≡": "==",
  "⊕": "+>",
  "✓": "OK",
  "✗": "NO",
  "⊗": "ERR",
  "∎": "FIN",
  "⟳": "RPT",
  "⚡": "!!",
  "⟦": "[[",
  "⟧": "]]",
  "⟨": "<<",
  "⟩": ">>",
  "∧": "&&",
  "∨": "||",
  "∀": "ALL",
  "∃": "?E",
  "∅": "NIL",
  "≥": ">=",
  "≤": "<=",
  "⊂": "<:",
  "∑": "SUM",
  "⊞": "[]!",
  "⌛": "T/O",
  "⌂": "LOC",
};

interface SymbolTokenResult {
  symbol: string;
  name: string;
  category: string;
  tokens: number;
  tokenIds: number[];
  status: "ok" | "warn" | "bad";
  asciiAlt?: string;
  asciiAltTokens?: number;
}

console.log();
console.log(bold("  AXON Symbol Tokenization Benchmark"));
console.log(dim("  Encoding: cl100k_base (GPT-4o proxy for Claude)"));
console.log();

const results: SymbolTokenResult[] = [];
let badCount = 0;

// Header
const header = `  ${pad("Symbol", 6)} ${pad("Name", 16)} ${pad("Cat", 10)} ${padL("Tokens", 7)} ${padL("IDs", 20)} ${pad("Status", 8)} ${pad("Alt", 6)} ${padL("AltTok", 7)}`;
console.log(dim(header));
console.log(dim("  " + "─".repeat(85)));

for (const entry of CODEBOOK) {
  const tokenIds = enc.encode(entry.symbol);
  const tokenCount = tokenIds.length;

  let status: "ok" | "warn" | "bad" = "ok";
  if (tokenCount === 2) status = "warn";
  if (tokenCount >= 3) status = "bad";
  if (tokenCount > 1) badCount++;

  const asciiAlt = ASCII_ALTERNATIVES[entry.symbol];
  let asciiAltTokens: number | undefined;
  if (asciiAlt && tokenCount > 1) {
    asciiAltTokens = enc.encode(asciiAlt).length;
  }

  results.push({
    symbol: entry.symbol,
    name: entry.name,
    category: entry.category,
    tokens: tokenCount,
    tokenIds: Array.from(tokenIds),
    status,
    asciiAlt,
    asciiAltTokens,
  });

  const statusIcon =
    status === "ok" ? green("✓ 1") :
    status === "warn" ? yellow(`⚠ ${tokenCount}`) :
    red(`✗ ${tokenCount}`);

  const altStr = (asciiAlt && tokenCount > 1)
    ? `${asciiAlt}`
    : dim("—");
  const altTokStr = (asciiAltTokens !== undefined)
    ? (asciiAltTokens === 1 ? green("1") : yellow(String(asciiAltTokens)))
    : dim("—");

  console.log(
    `  ${pad(entry.symbol, 6)} ${pad(entry.name, 16)} ${pad(entry.category, 10)} ${padL(statusIcon, 16)} ${padL(dim(JSON.stringify(Array.from(tokenIds))), 20)} ${pad("", 8)} ${pad(altStr, 6)} ${padL(altTokStr, 16)}`
  );
}

console.log(dim("  " + "─".repeat(85)));
console.log();

// ── Summary ──
const okCount = results.filter(r => r.status === "ok").length;
const warnCount = results.filter(r => r.status === "warn").length;
const critCount = results.filter(r => r.status === "bad").length;

console.log(bold("  Summary:"));
console.log(`    ${green(`${okCount} symbols`)} tokenize as 1 token ${green("✓")}`);
if (warnCount > 0) {
  console.log(`    ${yellow(`${warnCount} symbols`)} tokenize as 2 tokens ${yellow("⚠")}`);
}
if (critCount > 0) {
  console.log(`    ${red(`${critCount} symbols`)} tokenize as 3+ tokens ${red("✗")}`);
}
console.log();

// ── Offenders detail ──
const offenders = results.filter(r => r.tokens > 1);
if (offenders.length > 0) {
  console.log(bold("  Offenders (symbols that cost >1 token):"));
  for (const r of offenders) {
    const altNote = r.asciiAlt
      ? ` → proposed alt: "${r.asciiAlt}" (${r.asciiAltTokens} tok)`
      : "";
    console.log(`    ${r.symbol} ${r.name} = ${r.tokens} tokens [${r.tokenIds.join(", ")}]${altNote}`);
  }
  console.log();
}

// ── Message-level impact ──
console.log(bold("  Message-level tokenization (6 presets):"));
console.log();

const presets = [
  { name: "PR Review",      axon: "!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧" },
  { name: "Data Pipeline",  axon: "!⟦db.fetch ⊂{status:pending ∧ age≤30} | valid.pipe → ⊗.rpt⟧" },
  { name: "Task Complete",  axon: "∎ depl ⟦svc#12:run ∧ health:pass ∧ ⊗:∅⟧" },
  { name: "Delegation",     axon: "→@code-rev ⟦diff.sec ∧ std.check → assess.struct⟧" },
  { name: "Error Recovery",  axon: "⊗ pay.svc:timeout⟨30s⟩ → ⟳ backoff:exp" },
  { name: "Multi-Agent",    axon: "!@∀workers ⊞⟦scrape.top10⊂keywords | extract.struct⟧ → @orch ∑rpt" },
];

for (const p of presets) {
  const tokens = enc.encode(p.axon);
  console.log(`    ${pad(p.name, 16)} ${padL(String(tokens.length) + " tok", 7)}  ${dim(p.axon)}`);
}

// ── Actual vs estimated comparison ──
console.log();
console.log(bold("  Estimate accuracy (heuristic vs real):"));
console.log();

const nlMessages = [
  "Please review pull request number 42, check if all tests are passing, and then report back with a summary to the orchestrator",
  "Fetch records from the database where status is pending and age is less than or equal to 30, then run them through the validation pipeline and report any errors",
  "The deployment of service number 12 is finished and running, health check is passing, and there are no errors",
  "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff",
];

console.log(dim(`    ${"Message".padEnd(55)} ${"Est NL".padStart(7)} ${"Real NL".padStart(8)} ${"Error".padStart(7)}`));
console.log(dim("    " + "─".repeat(80)));

for (const nl of nlMessages) {
  const words = nl.trim().split(/\s+/).length;
  const estNL = Math.ceil(words * 1.35);
  const realNL = enc.encode(nl).length;
  const errorPct = Math.round(((estNL - realNL) / realNL) * 100);
  const errorColor = Math.abs(errorPct) <= 15 ? green : Math.abs(errorPct) <= 25 ? yellow : red;

  console.log(
    `    ${(nl.slice(0, 52) + "...").padEnd(55)} ${String(estNL).padStart(7)} ${String(realNL).padStart(8)} ${errorColor(errorPct + "%").padStart(16)}`
  );
}

console.log();

// ── Helper ──
function pad(s: string, n: number) { return s.padEnd(n); }
function padL(s: string, n: number) { return s.padStart(n); }
