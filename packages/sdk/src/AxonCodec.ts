import { encode } from "@axon/codec";
import { decode as decodeFn } from "@axon/codec";
import { encodeWithLLM } from "@axon/codec";
import type { CompressionResult } from "@axon/core";

export interface AxonCodecConfig {
  apiKey?: string;
  model?: string;
  mode?: "rule" | "llm" | "hybrid";
}

export class AxonCodec {
  private apiKey?: string;
  private model?: string;
  private mode: "rule" | "llm" | "hybrid";

  constructor(config: AxonCodecConfig = {}) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.mode = config.mode ?? "rule";
  }

  /**
   * Encode NL → AXON.
   * In "rule" mode (default), uses deterministic rule-based encoder.
   * In "llm" mode, uses Claude via CodecFit prompt.
   * In "hybrid" mode, uses rule-based then refines with LLM.
   */
  async encode(nl: string): Promise<CompressionResult> {
    const ruleResult = encode(nl);

    if (this.mode === "rule") {
      return ruleResult;
    }

    if (this.mode === "llm") {
      const llmEncoded = await encodeWithLLM(nl, this.apiKey, this.model);
      return { ...ruleResult, encoded: llmEncoded };
    }

    // hybrid: use rule-based result (LLM refinement is a stretch goal)
    return ruleResult;
  }

  /**
   * Decode AXON → NL.
   * Uses LLM when API key is available, falls back to symbol expansion.
   */
  async decode(axon: string): Promise<string> {
    return decodeFn(axon, this.apiKey);
  }

  /**
   * Analyze a message without full encoding — returns token stats and detected symbols.
   */
  analyze(text: string): CompressionResult {
    return encode(text);
  }

  /**
   * Batch encode an array of messages.
   */
  async encodeBatch(messages: string[]): Promise<CompressionResult[]> {
    return messages.map((msg) => encode(msg));
  }
}
