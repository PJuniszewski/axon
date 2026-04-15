import { encodingForModel } from "js-tiktoken";

let _enc: ReturnType<typeof encodingForModel> | null = null;

function getEncoder() {
  if (!_enc) {
    _enc = encodingForModel("gpt-4o");
  }
  return _enc;
}

/**
 * Count tokens using cl100k_base (GPT-4o encoding).
 * Closest available proxy for Claude's tokenizer.
 */
export function countTokens(text: string): number {
  if (!text.trim()) return 0;
  return getEncoder().encode(text).length;
}

/**
 * Estimate token count for natural language text.
 * Uses real cl100k_base tokenizer.
 */
export function estimateNLTokens(text: string): number {
  return countTokens(text);
}

/**
 * Estimate token count for AXON-encoded text.
 * Uses real cl100k_base tokenizer.
 */
export function estimateAxonTokens(text: string): number {
  return countTokens(text);
}

/**
 * Generic estimator that dispatches based on type.
 * With real tokenizer, both modes use the same underlying counter.
 */
export function estimateTokens(text: string, type: "nl" | "axon"): number {
  return countTokens(text);
}
