import { CODEBOOK, SYMBOL_MAP, PHRASE_MAP } from "@axon/core";
import type { AxonSymbol, CompressionResult } from "@axon/core";
import { countTokens } from "./tokenCounter.js";

// ── Intent Detection ──

const INTENT_RULES: Array<{ patterns: RegExp; symbol: string }> = [
  { patterns: /\b(urgent(?:ly)?|immediately|asap|right away)\b/i,  symbol: "⚡" },
  { patterns: /\b(error|failed|exception|unable)\b/i,              symbol: "⊗" },
  { patterns: /\b(done|finished|completed|finalized)\b/i,          symbol: "∎" },
  { patterns: /\b(forward to|delegate|assign to)\b/i,              symbol: "→" },
  { patterns: /\b(confirm(?:ed)?|acknowledge[d]?|accept(?:ed)?|agreed|approved)\b/i, symbol: "✓" },
  { patterns: /\b(reject|refuse|deny|denied|decline)\b/i,          symbol: "✗" },
  { patterns: /\b(merge|combine|consolidate)\b/i,                  symbol: "⊕" },
  { patterns: /\b(retry|again|re-?run|repeat)\b/i,                 symbol: "⟳" },
  { patterns: /\b(what|which|verify|is there|are there|how many|how much|where)\b/i, symbol: "?" },
  { patterns: /\b(report|inform|result is|status:|here is|here are|update:)\b/i, symbol: "≡" },
  { patterns: /\b(please|could you|would you|i need|do|run|execute|create|send|fetch|deploy|review|start|build|process|make|get|pull|push|check)\b/i, symbol: "!" },
];

function detectIntent(text: string): { symbol: string; remaining: string } {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.test(text)) {
      return { symbol: rule.symbol, remaining: text };
    }
  }
  return { symbol: "!", remaining: text };
}

// ── Agent Extraction ──

const AGENT_PATTERNS = [
  /\bto (?:the )?(\w[\w-]*)\s*(?:agent|service|worker|module|team)\b/i,
  /\bforward (?:to )?(\w[\w-]*)\b/i,
  /\bdelegate (?:to )?(\w[\w-]*)\b/i,
  /\bassign (?:to )?(\w[\w-]*)\b/i,
  /\bsend (?:to )?(\w[\w-]*)\s*(?:agent|service|worker)\b/i,
  /@(\w[\w-]*)\b/,
];

function extractAgent(text: string): { agent?: string; remaining: string } {
  for (const pattern of AGENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const agent = match[1];
      const remaining = text.replace(match[0], " ").trim();
      return { agent, remaining };
    }
  }
  return { remaining: text };
}

// ── Phrase Compression (Change 1) ──
// Uses the 200+ entry PHRASE_MAP from @axon/core/phrases.ts
// Already sorted longest-first for greedy matching.

function compressPhrases(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PHRASE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── Filler Stripping (Change 2 — applied AFTER phrase compression) ──

const FILLER_MULTI = [
  // Longest first
  "it should be noted that",
  "please be aware that",
  "i would like you to",
  "you are required to",
  "please make sure",
  "i need you to",
  "i want you to",
  "could you please",
  "would you please",
  "please note that",
  "the following task",
  "your task is to",
  "the task is to",
  "make sure that",
  "make sure to",
  "you need to",
  "ensure that",
  "in order to",
  "following that",
  "described below",
  "outlined below",
  "the following",
  "listed below",
  "so that",
  "such that",
  "note that",
  "and then",
  "after that",
  "subsequently",
  "at the moment",
  "at this time",
  "as soon as possible",
  "in addition",
  "additionally",
  "furthermore",
  "moreover",
  "as follows",
  "could you",
  "would you",
  "you should",
  "you must",
  "i need",
];

const FILLER_WORDS = new Set([
  "the", "a", "an",
  "is", "are", "was", "were", "be", "been", "being",
  "it", "its", "this", "that", "these", "those",
  "also", "just", "then", "so", "very", "really",
  "basically", "actually", "currently",
  "of", "with", "if", "no", "not", "there", "and", "or", "but",
  "to", "for", "from", "by", "at", "in", "on", "up",
  "has", "have", "had", "do", "does", "did",
  "can", "could", "would", "should", "may", "might",
  "i", "you", "we", "they", "he", "she",
  "send", "sent", "get", "got",
  "data", "them", "into", "need", "needs",
  "gone", "across", "when", "now", "due",
  "back", "next", "step", "while",
  "where", "what", "which", "how",
  "my", "your", "our", "their",
  "any", "some", "each", "every",
  "here", "below", "above",
  "please", "kindly",
  "than", "more", "most", "less",
  "like", "such", "only",
  "about", "over", "under", "between",
  "other", "another", "rest",
  "using", "through", "after", "before",
  "being", "having", "will",
  "carefully", "thoroughly", "properly", "correctly",
  "all", "still",
  "been", "then", "that", "these",
  "each", "them", "its", "own",
  "relevant", "required", "specified",
  "within", "against", "during",
  "including", "based", "per", "both",
  "multiple", "standard", "final",
  "detailed", "comprehensive", "assigned",
  "provided", "available", "acceptable",
  "potential", "applicable", "appropriate",
  "out", "down", "already",
]);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripFillers(text: string): string {
  let result = text;

  // Multi-word fillers first (already longest-first)
  for (const phrase of FILLER_MULTI) {
    result = result.replace(new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi"), " ");
  }

  // Single filler words
  const words = result.split(/\s+/).filter(Boolean);
  const filtered = words.filter((w) => !FILLER_WORDS.has(w.toLowerCase()));
  return filtered.join(" ");
}

// ── Stem Compression ──

function compressStems(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words
    .map((word) => {
      // Skip words with non-alpha chars (symbols, dots, numbers, slashes)
      if (/[^a-zA-Z]/.test(word)) return word;
      // Preserve phrase-map outputs (≤6 chars)
      if (word.length <= 6) return word;
      // Aggressive: 7-9 chars → 4, 10+ chars → 3
      if (word.length >= 10) return word.slice(0, 3);
      return word.slice(0, 4);
    })
    .join(" ");
}

// ── Cleanup ──

function cleanupOutput(text: string): string {
  return text
    .replace(/[,;.!?:]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Symbol Detection ──

function detectSymbols(encoded: string): AxonSymbol[] {
  const found: AxonSymbol[] = [];
  for (const entry of CODEBOOK) {
    if (encoded.includes(entry.symbol) || (entry.ascii && encoded.includes(entry.ascii))) {
      found.push(entry);
    }
  }
  return found;
}

// ── Smart Wrapper Check (Change 3) ──

const COMPLEX_PAYLOAD_PATTERN = /[|∧∨⊂]|&&|\|\||<:/;

function needsWrappers(payload: string, hasContext: boolean): boolean {
  if (!payload) return false;
  if (hasContext) return true;
  if (COMPLEX_PAYLOAD_PATTERN.test(payload)) return true;
  if (payload.startsWith("@")) return true;

  // Count tokens — if short enough, omit wrappers
  const tokCount = countTokens(payload);
  return tokCount > 8;
}

// ── Main Encoder ──

export interface EncodeOptions {
  /** Use ASCII-safe symbols (1 token each on cl100k_base) instead of Unicode */
  ascii?: boolean;
}

export function encode(nl: string, options?: EncodeOptions): CompressionResult {
  const original = nl.trim();
  const useAscii = options?.ascii ?? false;

  if (!original) {
    return { original, encoded: "", nlTokens: 0, axonTokens: 0, reductionPct: 0, symbols: [] };
  }

  // Change 4 — short message pass-through
  const nlTokens = countTokens(original);
  if (nlTokens <= 5) {
    return {
      original,
      encoded: original,
      nlTokens,
      axonTokens: nlTokens,
      reductionPct: 0,
      symbols: [],
      skipped: true,
    };
  }

  // 1. Detect intent
  const { symbol: intentSymbol, remaining: afterIntent } = detectIntent(original);

  // 2. Extract agent
  const { agent, remaining: afterAgent } = extractAgent(afterIntent);

  // 3. Phrase compression FIRST (Change 1 — uses core PHRASE_MAP)
  const phrased = compressPhrases(afterAgent);

  // 4. Filler stripping AFTER phrase compression (Change 2)
  const stripped = stripFillers(phrased);

  // 5. Stem compression on leftovers
  const stemmed = compressStems(stripped);

  // 6. Cleanup
  const cleaned = cleanupOutput(stemmed);

  // 7. Build AXON format
  let finalIntent = intentSymbol;
  if (useAscii) {
    const entry = SYMBOL_MAP.get(intentSymbol);
    if (entry?.ascii) finalIntent = entry.ascii;
  }

  let encoded = finalIntent;
  if (agent) {
    encoded += ` @${agent}`;
  }

  if (cleaned) {
    let payload = cleaned;
    if (useAscii) {
      for (const entry of CODEBOOK) {
        if (entry.ascii && payload.includes(entry.symbol)) {
          payload = payload.replaceAll(entry.symbol, entry.ascii);
        }
      }
    }

    // Change 3 — smart wrapper omission
    const wrap = needsWrappers(payload, false);
    if (wrap) {
      const pOpen = useAscii ? "[[" : "⟦";
      const pClose = useAscii ? "]]" : "⟧";
      encoded += ` ${pOpen}${payload}${pClose}`;
    } else {
      encoded += ` ${payload}`;
    }
  }

  // 8. Token counts
  const axonTokens = countTokens(encoded);
  const reductionPct = nlTokens > 0 ? Math.round((1 - axonTokens / nlTokens) * 100) : 0;

  return {
    original,
    encoded,
    nlTokens,
    axonTokens,
    reductionPct,
    symbols: detectSymbols(encoded),
  };
}
