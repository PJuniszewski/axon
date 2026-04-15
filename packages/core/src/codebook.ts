import type { AxonSymbol, PerformativeType } from "./types.js";

export const CODEBOOK: AxonSymbol[] = [
  // INTENT (11)
  //                                                                                                      cl100k
  { symbol: "!",  name: "REQUEST",       desc: "Initiate action",                category: "intent",    cl100kTokens: 1, tokenHint: 1 },
  { symbol: "?",  name: "QUERY",         desc: "Request information or status",  category: "intent",    cl100kTokens: 1, tokenHint: 1 },
  { symbol: "≡",  name: "INFORM",        desc: "Transmit data or state update",  category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "==" },
  { symbol: "→",  name: "DELEGATE",      desc: "Transfer task ownership",        category: "intent",    cl100kTokens: 1, tokenHint: 1 },
  { symbol: "⊕",  name: "MERGE",         desc: "Combine multiple results",       category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "+>" },
  { symbol: "✓",  name: "CONFIRM",       desc: "Acknowledge and accept",         category: "intent",    cl100kTokens: 1, tokenHint: 1 },
  { symbol: "✗",  name: "REJECT",        desc: "Refuse or deny",                 category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "NO" },
  { symbol: "⊗",  name: "ERROR",         desc: "Signal failure state",           category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "ERR" },
  { symbol: "∎",  name: "COMPLETE",      desc: "Task finalized",                 category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "DONE" },
  { symbol: "⟳",  name: "RETRY",         desc: "Repeat last operation",          category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "RPT" },
  { symbol: "⚡", name: "URGENT",        desc: "High-priority escalation",       category: "intent",    cl100kTokens: 2, tokenHint: 1, ascii: "!!" },

  // STRUCTURE (8)
  { symbol: "#",  name: "REF",           desc: "ID or entity reference",         category: "structure", cl100kTokens: 1, tokenHint: 1 },
  { symbol: "@",  name: "AGENT",         desc: "Target agent address",           category: "structure", cl100kTokens: 1, tokenHint: 1 },
  { symbol: "|",  name: "PIPE",          desc: "Sequential operation chain",     category: "structure", cl100kTokens: 1, tokenHint: 1 },
  { symbol: ":",  name: "ASSIGN",        desc: "Property assignment",            category: "structure", cl100kTokens: 1, tokenHint: 1 },
  { symbol: "⟦",  name: "PAYLOAD_OPEN",  desc: "Payload open",                   category: "structure", cl100kTokens: 3, tokenHint: 1, ascii: "[[" },
  { symbol: "⟧",  name: "PAYLOAD_CLOSE", desc: "Payload close",                  category: "structure", cl100kTokens: 3, tokenHint: 1, ascii: "]]" },
  { symbol: "⟨",  name: "CTX_OPEN",      desc: "Context open",                   category: "structure", cl100kTokens: 3, tokenHint: 1, ascii: "<<" },
  { symbol: "⟩",  name: "CTX_CLOSE",     desc: "Context close",                  category: "structure", cl100kTokens: 3, tokenHint: 1, ascii: ">>" },

  // LOGIC (7)
  { symbol: "∧",  name: "AND",           desc: "Logical conjunction",            category: "logic",     cl100kTokens: 2, tokenHint: 1, ascii: "&&" },
  { symbol: "∨",  name: "OR",            desc: "Logical disjunction",            category: "logic",     cl100kTokens: 1, tokenHint: 1 },
  { symbol: "∀",  name: "ALL",           desc: "Universal quantifier",           category: "logic",     cl100kTokens: 1, tokenHint: 1 },
  { symbol: "∃",  name: "EXISTS",        desc: "Existential check",              category: "logic",     cl100kTokens: 2, tokenHint: 1, ascii: "??" },
  { symbol: "∅",  name: "NULL",          desc: "Empty, none, not found",         category: "logic",     cl100kTokens: 2, tokenHint: 1, ascii: "_" },
  { symbol: "≥",  name: "GTE",           desc: "Greater than or equal",          category: "logic",     cl100kTokens: 1, tokenHint: 1 },
  { symbol: "≤",  name: "LTE",           desc: "Less than or equal",             category: "logic",     cl100kTokens: 1, tokenHint: 1 },

  // DOMAIN (5)
  { symbol: "⊂",  name: "FILTER",        desc: "Subset or filter condition",     category: "domain",    cl100kTokens: 2, tokenHint: 1, ascii: "<:" },
  { symbol: "∑",  name: "AGGREGATE",     desc: "Summarize or collect results",   category: "domain",    cl100kTokens: 2, tokenHint: 1, ascii: "SUM" },
  { symbol: "⊞",  name: "BATCH",         desc: "Batch operation",                category: "domain",    cl100kTokens: 2, tokenHint: 1, ascii: "[]" },
  { symbol: "⌛", name: "TIMEOUT",       desc: "Time constraint",                category: "domain",    cl100kTokens: 2, tokenHint: 1, ascii: "T/O" },
  { symbol: "⌂",  name: "LOCAL",         desc: "Internal or in-process scope",   category: "domain",    cl100kTokens: 2, tokenHint: 1, ascii: "~" },
];

/** Fast lookup: symbol string → AxonSymbol */
export const SYMBOL_MAP = new Map<string, AxonSymbol>(
  CODEBOOK.map((s) => [s.symbol, s]),
);

/** Fast lookup: name string → AxonSymbol */
export const NAME_MAP = new Map<string, AxonSymbol>(
  CODEBOOK.map((s) => [s.name, s]),
);

/** Fast lookup: ASCII alt → AxonSymbol (for symbols that have ASCII alternatives) */
export const ASCII_MAP = new Map<string, AxonSymbol>(
  CODEBOOK.filter((s) => s.ascii).map((s) => [s.ascii!, s]),
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

/** Map from PerformativeType to ASCII-safe symbol */
export const PERFORMATIVE_TO_ASCII = new Map<PerformativeType, string>(
  CODEBOOK
    .filter((s) => s.category === "intent")
    .map((s) => [s.name as PerformativeType, s.ascii ?? s.symbol]),
);
