import type { AxonSymbol, PerformativeType } from "./types.js";

export const CODEBOOK: AxonSymbol[] = [
  // INTENT (11)
  { symbol: "!",  name: "REQUEST",       desc: "Initiate action",                category: "intent",    tokenHint: 1 },
  { symbol: "?",  name: "QUERY",         desc: "Request information or status",  category: "intent",    tokenHint: 1 },
  { symbol: "≡",  name: "INFORM",        desc: "Transmit data or state update",  category: "intent",    tokenHint: 1 },
  { symbol: "→",  name: "DELEGATE",      desc: "Transfer task ownership",        category: "intent",    tokenHint: 1 },
  { symbol: "⊕",  name: "MERGE",         desc: "Combine multiple results",       category: "intent",    tokenHint: 1 },
  { symbol: "✓",  name: "CONFIRM",       desc: "Acknowledge and accept",         category: "intent",    tokenHint: 1 },
  { symbol: "✗",  name: "REJECT",        desc: "Refuse or deny",                 category: "intent",    tokenHint: 1 },
  { symbol: "⊗",  name: "ERROR",         desc: "Signal failure state",           category: "intent",    tokenHint: 1 },
  { symbol: "∎",  name: "COMPLETE",      desc: "Task finalized",                 category: "intent",    tokenHint: 1 },
  { symbol: "⟳",  name: "RETRY",         desc: "Repeat last operation",          category: "intent",    tokenHint: 1 },
  { symbol: "⚡", name: "URGENT",        desc: "High-priority escalation",       category: "intent",    tokenHint: 1 },

  // STRUCTURE (8)
  { symbol: "#",  name: "REF",           desc: "ID or entity reference",         category: "structure", tokenHint: 1 },
  { symbol: "@",  name: "AGENT",         desc: "Target agent address",           category: "structure", tokenHint: 1 },
  { symbol: "|",  name: "PIPE",          desc: "Sequential operation chain",     category: "structure", tokenHint: 1 },
  { symbol: ":",  name: "ASSIGN",        desc: "Property assignment",            category: "structure", tokenHint: 1 },
  { symbol: "⟦",  name: "PAYLOAD_OPEN",  desc: "Payload open",                   category: "structure", tokenHint: 1 },
  { symbol: "⟧",  name: "PAYLOAD_CLOSE", desc: "Payload close",                  category: "structure", tokenHint: 1 },
  { symbol: "⟨",  name: "CTX_OPEN",      desc: "Context open",                   category: "structure", tokenHint: 1 },
  { symbol: "⟩",  name: "CTX_CLOSE",     desc: "Context close",                  category: "structure", tokenHint: 1 },

  // LOGIC (7)
  { symbol: "∧",  name: "AND",           desc: "Logical conjunction",            category: "logic",     tokenHint: 1 },
  { symbol: "∨",  name: "OR",            desc: "Logical disjunction",            category: "logic",     tokenHint: 1 },
  { symbol: "∀",  name: "ALL",           desc: "Universal quantifier",           category: "logic",     tokenHint: 1 },
  { symbol: "∃",  name: "EXISTS",        desc: "Existential check",              category: "logic",     tokenHint: 1 },
  { symbol: "∅",  name: "NULL",          desc: "Empty, none, not found",         category: "logic",     tokenHint: 1 },
  { symbol: "≥",  name: "GTE",           desc: "Greater than or equal",          category: "logic",     tokenHint: 1 },
  { symbol: "≤",  name: "LTE",           desc: "Less than or equal",             category: "logic",     tokenHint: 1 },

  // DOMAIN (5)
  { symbol: "⊂",  name: "FILTER",        desc: "Subset or filter condition",     category: "domain",    tokenHint: 1 },
  { symbol: "∑",  name: "AGGREGATE",     desc: "Summarize or collect results",   category: "domain",    tokenHint: 1 },
  { symbol: "⊞",  name: "BATCH",         desc: "Batch operation",                category: "domain",    tokenHint: 1 },
  { symbol: "⌛", name: "TIMEOUT",       desc: "Time constraint",                category: "domain",    tokenHint: 1 },
  { symbol: "⌂",  name: "LOCAL",         desc: "Internal or in-process scope",   category: "domain",    tokenHint: 1 },
];

/** Fast lookup: symbol string → AxonSymbol */
export const SYMBOL_MAP = new Map<string, AxonSymbol>(
  CODEBOOK.map((s) => [s.symbol, s]),
);

/** Fast lookup: name string → AxonSymbol */
export const NAME_MAP = new Map<string, AxonSymbol>(
  CODEBOOK.map((s) => [s.name, s]),
);

/** Map from intent symbol to PerformativeType */
export const INTENT_SYMBOL_TO_PERFORMATIVE = new Map<string, PerformativeType>(
  CODEBOOK
    .filter((s) => s.category === "intent")
    .map((s) => [s.symbol, s.name as PerformativeType]),
);

/** Map from PerformativeType to intent symbol */
export const PERFORMATIVE_TO_SYMBOL = new Map<PerformativeType, string>(
  CODEBOOK
    .filter((s) => s.category === "intent")
    .map((s) => [s.name as PerformativeType, s.symbol]),
);
