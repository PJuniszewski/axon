import { encode, type EncodeOptions } from "@axon/codec";
import { decode } from "@axon/codec";
import { countTokens } from "@axon/codec";
import type { CompressionResult } from "@axon/core";

/**
 * AxonMiddleware — transparent compression layer for inter-agent messages.
 *
 * Sits between agents in any framework (LangChain, CrewAI, custom).
 * Encodes outgoing NL messages to AXON, decodes incoming AXON to NL.
 *
 * Usage:
 *   const axon = new AxonMiddleware({ ascii: true });
 *
 *   // In your agent pipeline:
 *   const compressed = axon.compress(agentMessage);
 *   // ... send compressed.encoded to downstream agent ...
 *   const restored = await axon.decompress(compressed.encoded);
 */

export interface AxonMiddlewareConfig {
  /** Use ASCII-safe symbols (recommended for real token savings) */
  ascii?: boolean;
  /** API key for LLM-based decoding (falls back to symbol expansion without) */
  apiKey?: string;
  /** Callback for compression events (analytics, logging) */
  onCompress?: (result: CompressionResult) => void;
}

export class AxonMiddleware {
  private ascii: boolean;
  private apiKey?: string;
  private onCompress?: (result: CompressionResult) => void;

  // Running stats
  private totalMessages = 0;
  private totalNLTokens = 0;
  private totalAxonTokens = 0;

  constructor(config: AxonMiddlewareConfig = {}) {
    this.ascii = config.ascii ?? true; // ASCII by default for real savings
    this.apiKey = config.apiKey;
    this.onCompress = config.onCompress;
  }

  /**
   * Compress a natural language message to AXON.
   * Synchronous — no LLM call needed.
   */
  compress(message: string): CompressionResult {
    const result = encode(message, { ascii: this.ascii });

    this.totalMessages++;
    this.totalNLTokens += result.nlTokens;
    this.totalAxonTokens += result.axonTokens;

    this.onCompress?.(result);
    return result;
  }

  /**
   * Decompress an AXON message back to natural language.
   * Uses LLM if API key available, otherwise symbol expansion.
   */
  async decompress(axon: string): Promise<string> {
    return decode(axon, this.apiKey);
  }

  /**
   * Wrap a message for inter-agent transport.
   * Returns the compressed string ready to send.
   */
  wrap(message: string): string {
    return this.compress(message).encoded;
  }

  /**
   * Unwrap a received AXON message back to NL.
   */
  async unwrap(axon: string): Promise<string> {
    return this.decompress(axon);
  }

  /**
   * Process a message through the full pipeline:
   * compress → (user-provided transport) → decompress
   *
   * The `transport` function simulates or performs the actual forwarding.
   */
  async pipe(
    message: string,
    transport: (encoded: string) => Promise<string> | string,
  ): Promise<{ compressed: CompressionResult; response: string; decoded: string }> {
    const compressed = this.compress(message);
    const response = await transport(compressed.encoded);
    const decoded = await this.decompress(response);
    return { compressed, response, decoded };
  }

  /**
   * Get running compression statistics.
   */
  getStats() {
    return {
      totalMessages: this.totalMessages,
      totalNLTokens: this.totalNLTokens,
      totalAxonTokens: this.totalAxonTokens,
      totalSaved: this.totalNLTokens - this.totalAxonTokens,
      avgReduction:
        this.totalMessages > 0
          ? Math.round(
              (1 - this.totalAxonTokens / this.totalNLTokens) * 100,
            )
          : 0,
    };
  }

  /**
   * Reset running statistics.
   */
  resetStats() {
    this.totalMessages = 0;
    this.totalNLTokens = 0;
    this.totalAxonTokens = 0;
  }
}
