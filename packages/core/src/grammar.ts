import type { AxonMsg, PerformativeType } from "./types.js";
import { INTENT_SYMBOL_TO_PERFORMATIVE, PERFORMATIVE_TO_SYMBOL } from "./codebook.js";

/**
 * Parse an AXON-encoded message string into an AxonMsg object.
 *
 * Format: [INTENT] [@AGENT] ⟦PAYLOAD⟧ ⟨CONTEXT⟩
 *
 * - INTENT is required (one of the 11 intent symbols)
 * - @AGENT is optional; omit = broadcast
 * - ⟦PAYLOAD⟧ is the compressed operation body
 * - ⟨CONTEXT⟩ is optional metadata
 */
export function parseAxon(msg: string): AxonMsg {
  const raw = msg.trim();
  if (!raw) {
    throw new Error("Cannot parse empty AXON message");
  }

  let remaining = raw;

  // 1. Extract intent symbol (first character or first few chars)
  let performative: PerformativeType | undefined;
  let intentSymbol = "";

  for (const [symbol, perf] of INTENT_SYMBOL_TO_PERFORMATIVE) {
    if (remaining.startsWith(symbol)) {
      performative = perf;
      intentSymbol = symbol;
      break;
    }
  }

  if (!performative) {
    throw new Error(`No valid intent symbol found at start of message: "${raw}"`);
  }

  remaining = remaining.slice(intentSymbol.length).trimStart();

  // 2. Extract agent (optional, starts with @)
  let agent: string | undefined;
  if (remaining.startsWith("@")) {
    remaining = remaining.slice(1); // remove @
    // Agent name continues until whitespace or ⟦ or ⟨ or end
    const agentMatch = remaining.match(/^([^\s⟦⟨⟧⟩]+)/);
    if (agentMatch) {
      agent = agentMatch[1];
      remaining = remaining.slice(agent.length).trimStart();
    }
  }

  // 3. Extract payload (inside ⟦⟧)
  let payload: string | undefined;
  const payloadOpenIdx = remaining.indexOf("⟦");
  const payloadCloseIdx = remaining.lastIndexOf("⟧");
  if (payloadOpenIdx !== -1 && payloadCloseIdx > payloadOpenIdx) {
    payload = remaining.slice(payloadOpenIdx + "⟦".length, payloadCloseIdx);
    // Remove the payload section from remaining
    remaining =
      remaining.slice(0, payloadOpenIdx) +
      remaining.slice(payloadCloseIdx + "⟧".length);
    remaining = remaining.trim();
  }

  // 4. Extract context (inside ⟨⟩)
  let context: string | undefined;
  const ctxOpenIdx = remaining.indexOf("⟨");
  const ctxCloseIdx = remaining.lastIndexOf("⟩");
  if (ctxOpenIdx !== -1 && ctxCloseIdx > ctxOpenIdx) {
    context = remaining.slice(ctxOpenIdx + "⟨".length, ctxCloseIdx);
  }

  // If no payload was found in ⟦⟧, treat remaining text as payload
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

/**
 * Format an AxonMsg object back into an AXON wire format string.
 *
 * Format: [INTENT] [@AGENT] ⟦PAYLOAD⟧ ⟨CONTEXT⟩
 */
export function formatAxon(msg: AxonMsg): string {
  const symbol = PERFORMATIVE_TO_SYMBOL.get(msg.performative);
  if (!symbol) {
    throw new Error(`Unknown performative type: ${msg.performative}`);
  }

  let result = symbol;

  if (msg.agent) {
    result += `@${msg.agent}`;
  }

  if (msg.payload) {
    result += ` ⟦${msg.payload}⟧`;
  }

  if (msg.context) {
    result += ` ⟨${msg.context}⟩`;
  }

  return result;
}
