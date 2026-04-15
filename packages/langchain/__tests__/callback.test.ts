import { describe, it, expect } from "vitest";
import { AxonCallbackHandler } from "../src/callback.js";

describe("AxonCallbackHandler", () => {
  describe("LangChain callback interface", () => {
    it("records LLM start events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMStart({}, ["Please review the pull request"]);

      const events = handler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("llm_start");
      expect(events[0].result.nlTokens).toBeGreaterThan(0);
    });

    it("records LLM end events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMEnd({
        generations: [[{ text: "The review is complete" }]],
      });

      const events = handler.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("llm_end");
    });

    it("records chain start events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleChainStart({}, { input: "Check database status" });

      expect(handler.getEvents()).toHaveLength(1);
      expect(handler.getEvents()[0].type).toBe("chain_start");
    });

    it("records chain end events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleChainEnd({ output: "Status is healthy" });

      expect(handler.getEvents()).toHaveLength(1);
      expect(handler.getEvents()[0].type).toBe("chain_end");
    });

    it("records agent action events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleAgentAction({
        tool: "search",
        toolInput: "query",
        log: "Searching for relevant documents",
      });

      expect(handler.getEvents()).toHaveLength(1);
      expect(handler.getEvents()[0].type).toBe("agent_action");
    });

    it("records tool start events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleToolStart({}, "search query input");

      expect(handler.getEvents()).toHaveLength(1);
      expect(handler.getEvents()[0].type).toBe("tool_start");
    });

    it("handles multiple prompts in LLM start", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMStart({}, [
        "First prompt",
        "Second prompt",
        "Third prompt",
      ]);
      expect(handler.getEvents()).toHaveLength(3);
    });

    it("ignores empty text", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMStart({}, [""]);
      handler.handleLLMEnd({ generations: [[{ text: "" }]] });
      handler.handleToolStart({}, "");
      expect(handler.getEvents()).toHaveLength(0);
    });
  });

  describe("getReport", () => {
    it("returns empty report when no events", () => {
      const handler = new AxonCallbackHandler();
      const report = handler.getReport();
      expect(report.totalEvents).toBe(0);
      expect(report.totalNLTokens).toBe(0);
      expect(report.totalSaved).toBe(0);
      expect(report.avgReduction).toBe(0);
    });

    it("aggregates stats across events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMStart({}, [
        "Please review the pull request and check all tests",
      ]);
      handler.handleLLMEnd({
        generations: [[{ text: "The review is complete and all tests pass" }]],
      });

      const report = handler.getReport();
      expect(report.totalEvents).toBe(2);
      expect(report.totalNLTokens).toBeGreaterThan(0);
      expect(report.totalAxonTokens).toBeGreaterThan(0);
      expect(report.totalSaved).toBeGreaterThan(0); // ASCII mode
    });

    it("breaks down stats by event type", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMStart({}, ["Prompt text here"]);
      handler.handleLLMEnd({ generations: [[{ text: "Response text here" }]] });
      handler.handleToolStart({}, "Tool input text");

      const report = handler.getReport();
      expect(report.byType).toHaveProperty("llm_start");
      expect(report.byType).toHaveProperty("llm_end");
      expect(report.byType).toHaveProperty("tool_start");
      expect(report.byType.llm_start.count).toBe(1);
    });
  });

  describe("reset", () => {
    it("clears all events", () => {
      const handler = new AxonCallbackHandler();
      handler.handleLLMStart({}, ["Test"]);
      expect(handler.getEvents()).toHaveLength(1);

      handler.reset();
      expect(handler.getEvents()).toHaveLength(0);
      expect(handler.getReport().totalEvents).toBe(0);
    });
  });

  describe("verbose mode", () => {
    it("logs to console when verbose", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const handler = new AxonCallbackHandler({ verbose: true });
      handler.handleLLMStart({}, ["Test message"]);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      consoleSpy.mockRestore();
    });
  });
});

// Need to import vi for the spy
import { vi } from "vitest";
