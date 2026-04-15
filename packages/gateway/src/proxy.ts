import { AxonCodec } from "@axon/sdk";
import type { AnalyticsTracker } from "./analytics.js";

const codec = new AxonCodec();

export interface ProxyRequest {
  message: string;
  target?: string;
}

export interface ProxyResponse {
  original: string;
  encoded: string;
  nlTokens: number;
  axonTokens: number;
  reductionPct: number;
}

export async function handleEncode(
  body: ProxyRequest,
  analytics: AnalyticsTracker,
): Promise<ProxyResponse> {
  const result = await codec.encode(body.message);

  analytics.record({
    originalTokens: result.nlTokens,
    axonTokens: result.axonTokens,
    reductionPct: result.reductionPct,
    direction: "encode",
  });

  return {
    original: result.original,
    encoded: result.encoded,
    nlTokens: result.nlTokens,
    axonTokens: result.axonTokens,
    reductionPct: result.reductionPct,
  };
}

export async function handleDecode(
  body: { axon: string },
  analytics: AnalyticsTracker,
): Promise<{ decoded: string }> {
  const decoded = await codec.decode(body.axon);
  return { decoded };
}

export async function handleProxy(
  body: ProxyRequest,
  analytics: AnalyticsTracker,
): Promise<ProxyResponse & { decoded?: string }> {
  const encodeResult = await handleEncode(body, analytics);

  // In POC, simulate forwarding by decoding back
  let decoded: string | undefined;
  try {
    decoded = await codec.decode(encodeResult.encoded);
  } catch {
    // Decode is best-effort in POC (may fail without API key)
  }

  return { ...encodeResult, decoded };
}
