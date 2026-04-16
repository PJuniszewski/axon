import { parseAxon } from "@axon/core";
import type { AxonMsg } from "@axon/core";
import { validate } from "./validator.js";
import { encode } from "@axon/codec";
import type { AgentRegistry } from "./injector.js";

export interface RouteResult {
  targetAgent: string | null;
  axonMsg?: AxonMsg;
  forwarded: boolean;
  response?: string;
  error?: string;
  nlFallback?: boolean;
}

export async function routeAxonMessage(
  raw: string,
  registry: AgentRegistry,
): Promise<RouteResult> {
  const validation = validate(raw);

  // NL fallback: encode with rule-based encoder, then route the result
  if (!validation.valid && validation.fallbackToNL) {
    const encoded = encode(raw, { ascii: true });
    return routeAxonMessage(encoded.encoded, registry);
  }

  if (!validation.valid || !validation.parsed) {
    return {
      targetAgent: null,
      forwarded: false,
      error: `ERR route:parse <<${validation.reason ?? "invalid AXON"}>>`,
    };
  }

  const msg = validation.parsed;
  const targetId = msg.agent;

  // No target → broadcast to all (or return message as-is for POC)
  if (!targetId || targetId === "*" || targetId === "∀") {
    const agents = registry.getAll();
    return {
      targetAgent: "*",
      axonMsg: msg,
      forwarded: agents.length > 0,
      response: raw,
    };
  }

  // Resolve agent
  const agent = registry.resolve(targetId);
  if (!agent) {
    return {
      targetAgent: targetId,
      axonMsg: msg,
      forwarded: false,
      error: `ERR route:_ <<agent "${targetId}" not registered>>`,
    };
  }

  // In POC: simulate forwarding (no real HTTP call to upstream)
  // In production: fetch(agent.url, { method: "POST", body: raw })
  return {
    targetAgent: agent.id,
    axonMsg: msg,
    forwarded: true,
    response: raw,
  };
}
