import { describe, it, expect } from "vitest";
import { createAxonBridge } from "../src/crewai.js";

describe("createAxonBridge", () => {
  describe("beforeDelegate", () => {
    it("compresses a task description", () => {
      const bridge = createAxonBridge();
      const result = bridge.beforeDelegate(
        "Please review the pull request and check all tests are passing",
      );
      expect(result.encoded).toBeTruthy();
      expect(result.original).toBe(
        "Please review the pull request and check all tests are passing",
      );
      expect(result.savedTokens).toBeGreaterThan(0);
    });

    it("returns shorter encoded than original", () => {
      const bridge = createAxonBridge();
      const result = bridge.beforeDelegate(
        "Deploy the database migration to production environment",
      );
      expect(result.encoded.length).toBeLessThan(result.original.length);
    });
  });

  describe("afterDelegate", () => {
    it("decompresses agent response", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const bridge = createAxonBridge();
        const result = await bridge.afterDelegate("! [[test done]]");
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("stats", () => {
    it("tracks compression across multiple delegations", () => {
      const bridge = createAxonBridge();
      // Use longer messages where AXON genuinely saves tokens
      bridge.beforeDelegate("Please review the pull request number 42 and check if all tests are passing, then report back with a summary");
      bridge.beforeDelegate("Could you please fetch all records from the database where the status is pending and the age is less than 30 days");
      bridge.beforeDelegate("Deploy the service to the production environment and verify the health check is passing with no errors");

      const stats = bridge.stats();
      expect(stats.totalMessages).toBe(3);
      expect(stats.totalNLTokens).toBeGreaterThan(0);
      expect(stats.totalSaved).toBeGreaterThan(0);
    });

    it("resets statistics", () => {
      const bridge = createAxonBridge();
      bridge.beforeDelegate("Test message");
      bridge.reset();

      const stats = bridge.stats();
      expect(stats.totalMessages).toBe(0);
    });
  });

  describe("full delegation flow", () => {
    it("compress → send → decompress roundtrip", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const bridge = createAxonBridge();

        // Agent A compresses task
        const task = bridge.beforeDelegate(
          "Please analyze the customer feedback data and generate a summary report",
        );

        // Simulate sending compressed task to Agent B
        const agentBReceived = task.encoded;
        expect(agentBReceived.length).toBeLessThan(
          "Please analyze the customer feedback data and generate a summary report".length,
        );

        // Agent B responds (in this test, echo back)
        const agentBResponse = agentBReceived;

        // Agent A decompresses response
        const restored = await bridge.afterDelegate(agentBResponse);
        expect(restored).toBeTruthy();

        // Check stats
        const stats = bridge.stats();
        expect(stats.totalMessages).toBe(1);
        expect(stats.totalSaved).toBeGreaterThan(0);
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });
});
