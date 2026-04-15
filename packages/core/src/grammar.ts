import type { AxonMsg, PerformativeType } from "./types.js";
import {
  CODEBOOK,
  INTENT_SYMBOL_TO_PERFORMATIVE,
  PERFORMATIVE_TO_SYMBOL,
  PERFORMATIVE_TO_ASCII,
} from "./codebook.js";

// Build a map of ASCII intent symbols → PerformativeType
const ASCII_INTENT_MAP = new Map<string, PerformativeType>();
for (const entry of CODEBOOK) {
  if (entry.category === "intent" && entry.ascii) {
    ASCII_INTENT_MAP.set(entry.ascii, entry.name as PerformativeType);
  }
}

/**
 * Parse an AXON-encoded message string into an AxonMsg object.
 *
 * Supports both Unicode and ASCII-safe formats:
 *   Unicode: [INTENT] [@AGENT] ⟦PAYLOAD⟧ ⟨CONTEXT⟩
 *   ASCII:   [INTENT] [@AGENT] [[PAYLOAD]] <<CONTEXT>>
 */
export function parseAxon(msg: string): AxonMsg {
  const raw = msg.trim();
  if (!raw) {
    throw new Error("Cannot parse empty AXON message");
  }

  let remaining = raw;

  // 1. Extract intent symbol — try Unicode symbols first, then ASCII alternatives
  let performative: PerformativeType | undefined;
  let intentSymbol = "";

  for (const [symbol, perf] of INTENT_SYMBOL_TO_PERFORMATIVE) {
    if (remaining.startsWith(symbol)) {
      performative = perf;
      intentSymbol = symbol;
      break;
    }
  }

  // Try ASCII intent symbols (longer ones first to avoid partial matches)
  if (!performative) {
    const asciiEntries = [...ASCII_INTENT_MAP.entries()].sort(
      (a, b) => b[0].length - a[0].length,
    );
    for (const [ascii, perf] of asciiEntries) {
      if (remaining.startsWith(ascii)) {
        performative = perf;
        intentSymbol = ascii;
        break;
      }
    }
  }

  if (!performative) {
    throw new Error(`No valid intent symbol found at start of message: "${raw}"`);
  }

  remaining = remaining.slice(intentSymbol.length).trimStart();

  // 2. Extract agent (optional, starts with @)
  let agent: string | undefined;
  if (remaining.startsWith("@")) {
    remaining = remaining.slice(1);
    const agentMatch = remaining.match(/^([^\s⟦⟨⟧⟩\[\]<>]+)/);
    if (agentMatch) {
      agent = agentMatch[1];
      remaining = remaining.slice(agent.length).trimStart();
    }
  }

  // 3. Extract payload — try Unicode ⟦⟧ first, then ASCII [[]]
  let payload: string | undefined;
  let payloadFound = false;

  const uPayloadOpen = remaining.indexOf("⟦");
  const uPayloadClose = remaining.lastIndexOf("⟧");
  if (uPayloadOpen !== -1 && uPayloadClose > uPayloadOpen) {
    payload = remaining.slice(uPayloadOpen + "⟦".length, uPayloadClose);
    remaining =
      remaining.slice(0, uPayloadOpen) +
      remaining.slice(uPayloadClose + "⟧".length);
    remaining = remaining.trim();
    payloadFound = true;
  }

  if (!payloadFound) {
    const aPayloadOpen = remaining.indexOf("[[");
    const aPayloadClose = remaining.lastIndexOf("]]");
    if (aPayloadOpen !== -1 && aPayloadClose > aPayloadOpen) {
      payload = remaining.slice(aPayloadOpen + 2, aPayloadClose);
      remaining =
        remaining.slice(0, aPayloadOpen) +
        remaining.slice(aPayloadClose + 2);
      remaining = remaining.trim();
      payloadFound = true;
    }
  }

  // 4. Extract context — try Unicode ⟨⟩ first, then ASCII <<>>
  let context: string | undefined;

  const uCtxOpen = remaining.indexOf("⟨");
  const uCtxClose = remaining.lastIndexOf("⟩");
  if (uCtxOpen !== -1 && uCtxClose > uCtxOpen) {
    context = remaining.slice(uCtxOpen + "⟨".length, uCtxClose);
    remaining =
      remaining.slice(0, uCtxOpen) +
      remaining.slice(uCtxClose + "⟩".length);
    remaining = remaining.trim();
  } else {
    const aCtxOpen = remaining.indexOf("<<");
    const aCtxClose = remaining.lastIndexOf(">>");
    if (aCtxOpen !== -1 && aCtxClose > aCtxOpen) {
      context = remaining.slice(aCtxOpen + 2, aCtxClose);
      remaining =
        remaining.slice(0, aCtxOpen) +
        remaining.slice(aCtxClose + 2);
      remaining = remaining.trim();
    }
  }

  // If no payload was found in delimiters, treat remaining text as payload
  if (payload === undefined && remaining.length > 0) {
    payload = remaining;
  }

  return {
    performative,
    agent,
    payload: payload || undefined,
    context: context || undefined,
    raw,
  };
}

export interface FormatOptions {
  ascii?: boolean;
}

/**
 * Format an AxonMsg object back into an AXON wire format string.
 *
 * @param msg The message to format
 * @param options.ascii If true, use ASCII-safe symbols (1 token each on cl100k_base)
 */
export function formatAxon(msg: AxonMsg, options?: FormatOptions): string {
  const useAscii = options?.ascii ?? false;

  let intentStr: string | undefined;
  if (useAscii) {
    intentStr = PERFORMATIVE_TO_ASCII.get(msg.performative);
  } else {
    intentStr = PERFORMATIVE_TO_SYMBOL.get(msg.performative);
  }

  if (!intentStr) {
    throw new Error(`Unknown performative type: ${msg.performative}`);
  }

  let result = intentStr;

  if (msg.agent) {
    result += `@${msg.agent}`;
  }

  const pOpen = useAscii ? "[[" : "⟦";
  const pClose = useAscii ? "]]" : "⟧";
  const cOpen = useAscii ? "<<" : "⟨";
  const cClose = useAscii ? ">>" : "⟩";

  if (msg.payload) {
    result += ` ${pOpen}${msg.payload}${pClose}`;
  }

  if (msg.context) {
    result += ` ${cOpen}${msg.context}${cClose}`;
  }

  return result;
}
