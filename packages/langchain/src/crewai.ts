import { AxonMiddleware, type AxonMiddlewareConfig } from "./middleware.js";

/**
 * CrewAI-compatible AXON adapter.
 *
 * Wraps agent-to-agent communication in CrewAI with transparent
 * AXON compression. Drop-in replacement for agent message passing.
 *
 * Usage with CrewAI:
 *   import { createAxonBridge } from "@axon/langchain";
 *
 *   const bridge = createAxonBridge({ ascii: true });
 *
 *   // Before agent delegation:
 *   const compressed = bridge.beforeDelegate(taskDescription);
 *   // Send compressed.encoded instead of taskDescription
 *
 *   // After receiving response:
 *   const restored = await bridge.afterDelegate(agentResponse);
 *
 *   // Check savings:
 *   console.log(bridge.stats());
 */

export interface AxonBridge {
  /** Compress a task description before delegating to another agent */
  beforeDelegate(message: string): { encoded: string; original: string; savedTokens: number };

  /** Decompress a response received from another agent */
  afterDelegate(response: string): Promise<string>;

  /** Get compression statistics */
  stats(): {
    totalMessages: number;
    totalNLTokens: number;
    totalAxonTokens: number;
    totalSaved: number;
    avgReduction: number;
  };

  /** Reset statistics */
  reset(): void;
}

/**
 * Create an AXON bridge for CrewAI inter-agent communication.
 */
export function createAxonBridge(config?: AxonMiddlewareConfig): AxonBridge {
  const mw = new AxonMiddleware(config);

  return {
    beforeDelegate(message: string) {
      const result = mw.compress(message);
      return {
        encoded: result.encoded,
        original: result.original,
        savedTokens: result.nlTokens - result.axonTokens,
      };
    },

    async afterDelegate(response: string) {
      return mw.decompress(response);
    },

    stats() {
      return mw.getStats();
    },

    reset() {
      mw.resetStats();
    },
  };
}
