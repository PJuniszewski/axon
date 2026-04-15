/**
 * Estimate token count for natural language text.
 * Rough approximation: average English word ≈ 1.35 tokens.
 * Longer and compound words tend toward 1.5-2 tokens.
 */
export function estimateNLTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * 1.35);
}

/**
 * Estimate token count for AXON-encoded text.
 * AXON is denser than NL due to symbols (1 token each) and short stems.
 * Unicode symbols often count as 1 token. Short stems (3-4 chars) ≈ 1 token.
 */
export function estimateAxonTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generic estimator that dispatches based on type.
 */
export function estimateTokens(text: string, type: "nl" | "axon"): number {
  return type === "nl" ? estimateNLTokens(text) : estimateAxonTokens(text);
}
