export type SymbolCategory = "intent" | "structure" | "logic" | "domain";

export interface AxonSymbol {
  symbol: string;
  name: string;
  desc: string;
  category: SymbolCategory;
  tokenHint?: number;
  ascii?: string;        // ASCII-safe alternative (1 token on cl100k_base)
  cl100kTokens?: number; // actual token count on cl100k_base
}

export type PerformativeType =
  | "REQUEST"
  | "QUERY"
  | "INFORM"
  | "DELEGATE"
  | "MERGE"
  | "CONFIRM"
  | "REJECT"
  | "ERROR"
  | "COMPLETE"
  | "RETRY"
  | "URGENT";

export interface AxonMsg {
  performative: PerformativeType;
  agent?: string;
  payload?: string;
  context?: string;
  raw: string;
}

export interface CompressionResult {
  original: string;
  encoded: string;
  nlTokens: number;
  axonTokens: number;
  reductionPct: number;
  symbols: AxonSymbol[];
}
