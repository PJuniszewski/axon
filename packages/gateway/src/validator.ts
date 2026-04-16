import { parseAxon, INTENT_SYMBOL_TO_PERFORMATIVE, CODEBOOK } from "@axon/core";
import type { AxonMsg } from "@axon/core";

export interface ValidationResult {
  valid: boolean;
  isAxon: boolean;
  hasIntent: boolean;
  parseable: boolean;
  reason?: string;
  parsed?: AxonMsg;
  fallbackToNL?: boolean;
}

const INTENT_SYMBOLS = new Set([...INTENT_SYMBOL_TO_PERFORMATIVE.keys()]);
const ASCII_INTENTS = new Set(
  CODEBOOK.filter((s) => s.category === "intent" && s.ascii).map((s) => s.ascii!),
);

const NL_INDICATORS = [
  /\bplease\b/i, /\bi would like\b/i, /\bcould you\b/i,
  /\bi am\b/i, /\bi have\b/i, /\bI need\b/i,
  /\bthe following\b/i, /\bin order to\b/i,
];

export function isNaturalLanguage(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;

  // If it starts with a known intent symbol, it's probably AXON
  for (const sym of INTENT_SYMBOLS) {
    if (trimmed.startsWith(sym)) return false;
  }
  for (const ascii of ASCII_INTENTS) {
    if (trimmed.startsWith(ascii)) return false;
  }

  // Check for NL indicators
  return NL_INDICATORS.some((rx) => rx.test(trimmed));
}

export function validate(message: string): ValidationResult {
  const trimmed = message.trim();

  if (!trimmed) {
    return { valid: false, isAxon: false, hasIntent: false, parseable: false, reason: "empty message" };
  }

  // Check if it starts with a known intent symbol (unicode or ascii)
  let hasIntent = false;
  for (const sym of INTENT_SYMBOLS) {
    if (trimmed.startsWith(sym)) { hasIntent = true; break; }
  }
  if (!hasIntent) {
    for (const ascii of ASCII_INTENTS) {
      if (trimmed.startsWith(ascii)) { hasIntent = true; break; }
    }
  }

  // Try to parse
  let parsed: AxonMsg | undefined;
  let parseable = false;
  try {
    parsed = parseAxon(trimmed);
    parseable = true;
  } catch {
    // Not parseable
  }

  const isAxon = hasIntent && parseable;
  const fallbackToNL = !isAxon && isNaturalLanguage(trimmed);

  return {
    valid: isAxon,
    isAxon,
    hasIntent,
    parseable,
    parsed,
    fallbackToNL: fallbackToNL || undefined,
    reason: isAxon ? undefined : fallbackToNL ? "appears to be natural language" : "no valid intent symbol",
  };
}
