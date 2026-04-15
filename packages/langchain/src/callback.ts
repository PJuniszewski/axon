import { encode, countTokens, type EncodeOptions } from "@axon/codec";
import type { CompressionResult } from "@axon/core";

/**
 * LangChain-compatible callback handler that tracks AXON compression potential.
 *
 * Drop this into any LangChain chain or agent to measure how much token
 * savings AXON would provide on inter-agent messages.
 *
 * Works without importing @langchain/core — implements the callback
 * interface as a plain object so it can be used with any version.
 *
 * Usage with LangChain:
 *   import { AxonCallbackHandler } from "@axon/langchain";
 *
 *   const handler = new AxonCallbackHandler({ ascii: true });
 *   const chain = prompt.pipe(model).pipe(parser);
 *   await chain.invoke(input, { callbacks: [handler] });
 *   console.log(handler.getReport());
 */

export interface AxonCallbackConfig {
  /** Use ASCII-safe symbols for measurement */
  ascii?: boolean;
  /** Log each message to console */
  verbose?: boolean;
}

export interface CompressionEvent {
  type: "llm_start" | "llm_end" | "chain_start" | "chain_end" | "agent_action" | "tool_start";
  original: string;
  result: CompressionResult;
  timestamp: number;
}

export class AxonCallbackHandler {
  private ascii: boolean;
  private verbose: boolean;
  private events: CompressionEvent[] = [];

  // LangChain callback handler name
  name = "AxonCallbackHandler";

  constructor(config: AxonCallbackConfig = {}) {
    this.ascii = config.ascii ?? true;
    this.verbose = config.verbose ?? false;
  }

  private record(type: CompressionEvent["type"], text: string) {
    if (!text || text.trim().length === 0) return;

    const result = encode(text, { ascii: this.ascii });
    const event: CompressionEvent = {
      type,
      original: text,
      result,
      timestamp: Date.now(),
    };
    this.events.push(event);

    if (this.verbose) {
      console.log(
        `[AXON] ${type}: ${result.nlTokens}→${result.axonTokens} tok (${result.reductionPct}%)`,
      );
    }
  }

  // ── LangChain Callback Interface ──

  handleLLMStart(_llm: unknown, prompts: string[]) {
    for (const p of prompts) {
      this.record("llm_start", p);
    }
  }

  handleLLMEnd(output: { generations?: Array<Array<{ text?: string }>> }) {
    if (output.generations) {
      for (const gen of output.generations) {
        for (const g of gen) {
          if (g.text) this.record("llm_end", g.text);
        }
      }
    }
  }

  handleChainStart(_chain: unknown, inputs: Record<string, unknown>) {
    const text = typeof inputs.input === "string" ? inputs.input : JSON.stringify(inputs);
    this.record("chain_start", text);
  }

  handleChainEnd(outputs: Record<string, unknown>) {
    const text = typeof outputs.output === "string" ? outputs.output : JSON.stringify(outputs);
    this.record("chain_end", text);
  }

  handleAgentAction(action: { tool: string; toolInput: string; log: string }) {
    this.record("agent_action", action.log);
  }

  handleToolStart(_tool: unknown, input: string) {
    this.record("tool_start", input);
  }

  // ── Analytics ──

  getEvents(): CompressionEvent[] {
    return [...this.events];
  }

  getReport() {
    if (this.events.length === 0) {
      return {
        totalEvents: 0,
        totalNLTokens: 0,
        totalAxonTokens: 0,
        totalSaved: 0,
        avgReduction: 0,
        byType: {},
      };
    }

    const totalNL = this.events.reduce((s, e) => s + e.result.nlTokens, 0);
    const totalAxon = this.events.reduce((s, e) => s + e.result.axonTokens, 0);

    const byType: Record<string, { count: number; nlTokens: number; axonTokens: number; avgReduction: number }> = {};
    for (const e of this.events) {
      if (!byType[e.type]) {
        byType[e.type] = { count: 0, nlTokens: 0, axonTokens: 0, avgReduction: 0 };
      }
      byType[e.type].count++;
      byType[e.type].nlTokens += e.result.nlTokens;
      byType[e.type].axonTokens += e.result.axonTokens;
    }

    for (const t of Object.values(byType)) {
      t.avgReduction = t.nlTokens > 0 ? Math.round((1 - t.axonTokens / t.nlTokens) * 100) : 0;
    }

    return {
      totalEvents: this.events.length,
      totalNLTokens: totalNL,
      totalAxonTokens: totalAxon,
      totalSaved: totalNL - totalAxon,
      avgReduction: totalNL > 0 ? Math.round((1 - totalAxon / totalNL) * 100) : 0,
      byType,
    };
  }

  reset() {
    this.events = [];
  }
}
