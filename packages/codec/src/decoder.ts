import { parseAxon, SYMBOL_MAP } from "@axon/core";
import { decodeWithLLM } from "./codecfit.js";

/**
 * Decode AXON → NL.
 *
 * Uses LLM via CodecFit when API key is available,
 * falls back to symbol expansion otherwise.
 */
export async function decode(
  axon: string,
  apiKey?: string,
): Promise<string> {
  const key = apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (key) {
    return decodeWithLLM(axon, key);
  }

  // Fallback: simple symbol expansion
  return expandSymbols(axon);
}

/**
 * Simple symbol expansion fallback (no LLM needed).
 * Replaces known symbols with their names/descriptions.
 */
function expandSymbols(axon: string): string {
  let result = axon;

  // Remove structural wrappers
  result = result.replace(/⟦/g, "[").replace(/⟧/g, "]");
  result = result.replace(/⟨/g, "(").replace(/⟩/g, ")");

  // Replace known symbols
  for (const [symbol, entry] of SYMBOL_MAP) {
    if (symbol === ":" || symbol === "#" || symbol === "@" || symbol === "|") {
      continue; // keep structural chars
    }
    result = result.replaceAll(symbol, ` ${entry.name} `);
  }

  // Clean up whitespace
  result = result.replace(/\s+/g, " ").trim();
  return result;
}
