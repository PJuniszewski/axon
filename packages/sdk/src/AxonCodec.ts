import { encode } from "@axon/codec";
import { decode as decodeFn } from "@axon/codec";
import { encodeWithLLM, injectCodecFit as injectFn, CODECFIT_INJECT } from "@axon/codec";
import { countTokens } from "@axon/codec";
import { parseAxon } from "@axon/core";
import type { CompressionResult, AxonMsg } from "@axon/core";

export interface ValidationResult {
  valid: boolean;
  isAxon: boolean;
  hasIntent: boolean;
  parseable: boolean;
  reason?: string;
  parsed?: AxonMsg;
  fallbackToNL?: boolean;
}

export interface AxonCodecConfig {
  apiKey?: string;
  model?: string;
  mode?: "rule" | "llm" | "hybrid" | "native";
}

export class AxonCodec {
  private apiKey?: string;
  private model?: string;
  private mode: "rule" | "llm" | "hybrid" | "native";

  constructor(config: AxonCodecConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.mode = config.mode ?? "rule";
  }

  async encode(nl: string): Promise<CompressionResult> {
    const ruleResult = encode(nl);

    if (this.mode === "rule" || this.mode === "native") {
      return ruleResult;
    }

    if (this.mode === "llm") {
      const llmEncoded = await encodeWithLLM(nl, this.apiKey, this.model);
      return { ...ruleResult, encoded: llmEncoded };
    }

    return ruleResult;
  }

  async decode(axon: string): Promise<string> {
    return decodeFn(axon, this.apiKey);
  }

  analyze(text: string): CompressionResult {
    return encode(text);
  }

  async encodeBatch(messages: string[]): Promise<CompressionResult[]> {
    return messages.map((msg) => encode(msg));
  }

  injectCodecFit(systemPrompt: string): string {
    return injectFn(systemPrompt);
  }

  parseAgentOutput(output: string): ValidationResult {
    const trimmed = output.trim();
    if (!trimmed) {
      return { valid: false, isAxon: false, hasIntent: false, parseable: false, reason: "empty" };
    }

    let parsed: AxonMsg | undefined;
    let parseable = false;
    try {
      parsed = parseAxon(trimmed);
      parseable = true;
    } catch {
      // not parseable
    }

    const hasIntent = parseable && !!parsed?.performative;
    const isAxon = hasIntent && parseable;

    return {
      valid: isAxon,
      isAxon,
      hasIntent,
      parseable,
      parsed,
      fallbackToNL: !isAxon ? true : undefined,
      reason: isAxon ? undefined : "not valid AXON",
    };
  }

  measureBoundarySavings(axon: string, decodedNL: string) {
    const axonTokens = countTokens(axon);
    const nlTokens = countTokens(decodedNL);
    return {
      axonTokens,
      nlTokens,
      savedTokens: nlTokens - axonTokens,
      reductionPct: nlTokens > 0 ? Math.round((1 - axonTokens / nlTokens) * 100) : 0,
    };
  }
}
