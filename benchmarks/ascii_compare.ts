import { encode } from "@axon/codec";
import { countTokens } from "@axon/codec";

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;

const messages = [
  "Please review the pull request number 42 and check if all tests are passing, then report back with a summary",
  "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff",
  "The deployment of service number 12 is finished and running, health check is passing, and there are no errors",
  "Forward to the code review team to check the security of the diff and assess the code structure according to standards",
];

console.log();
console.log(bold("  Unicode vs ASCII mode (real cl100k_base tokens)"));
console.log();
console.log(dim(`  ${"Message".padEnd(55)} ${"NL".padStart(4)} ${"Uni".padStart(5)} ${"Uni%".padStart(5)} ${"Asc".padStart(5)} ${"Asc%".padStart(5)}`));
console.log(dim("  " + "─".repeat(82)));

for (const nl of messages) {
  const uni = encode(nl);
  const asc = encode(nl, { ascii: true });

  const nlTok = uni.nlTokens;
  const uniPct = uni.reductionPct;
  const ascPct = asc.reductionPct;

  const uniCol = uniPct >= 40 ? green : red;
  const ascCol = ascPct >= 40 ? green : red;

  console.log(
    `  ${(nl.slice(0, 52) + "...").padEnd(55)} ${String(nlTok).padStart(4)} ${String(uni.axonTokens).padStart(5)} ${uniCol(uniPct + "%").padStart(14)} ${String(asc.axonTokens).padStart(5)} ${ascCol(ascPct + "%").padStart(14)}`
  );
  console.log(dim(`    Uni: ${uni.encoded}`));
  console.log(dim(`    Asc: ${asc.encoded}`));
  console.log();
}
