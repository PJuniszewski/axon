import { describe, it, expect, vi } from "vitest";
import { AnalyticsTracker } from "../src/analytics.js";

describe("AnalyticsTracker", () => {
  describe("empty state", () => {
    it("returns zero stats when empty", () => {
      const tracker = new AnalyticsTracker();
      const stats = tracker.getTotalSavings();
      expect(stats.totalMessages).toBe(0);
      expect(stats.totalNLTokens).toBe(0);
      expect(stats.totalAxonTokens).toBe(0);
      expect(stats.avgReduction).toBe(0);
    });

    it("returns empty array for recent events", () => {
      const tracker = new AnalyticsTracker();
      expect(tracker.getRecentEvents(10)).toEqual([]);
    });
  });

  describe("recording", () => {
    it("tracks a single encode event", () => {
      const tracker = new AnalyticsTracker();
      tracker.record({
        originalTokens: 20,
        axonTokens: 8,
        reductionPct: 60,
        direction: "encode",
      });

      const stats = tracker.getTotalSavings();
      expect(stats.totalMessages).toBe(1);
      expect(stats.totalNLTokens).toBe(20);
      expect(stats.totalAxonTokens).toBe(8);
      expect(stats.avgReduction).toBe(60);
    });

    it("accumulates multiple events", () => {
      const tracker = new AnalyticsTracker();
      tracker.record({ originalTokens: 20, axonTokens: 8, reductionPct: 60, direction: "encode" });
      tracker.record({ originalTokens: 30, axonTokens: 12, reductionPct: 60, direction: "encode" });
      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });

      const stats = tracker.getTotalSavings();
      expect(stats.totalMessages).toBe(3);
      expect(stats.totalNLTokens).toBe(60);
      expect(stats.totalAxonTokens).toBe(25);
      expect(stats.avgReduction).toBe(57); // (60+60+50)/3 = 56.67 → 57 rounded
    });

    it("assigns timestamp automatically", () => {
      const tracker = new AnalyticsTracker();
      const before = Date.now();
      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });
      const after = Date.now();

      const events = tracker.getRecentEvents(1);
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("getRecentEvents", () => {
    it("returns last N events", () => {
      const tracker = new AnalyticsTracker();
      for (let i = 0; i < 5; i++) {
        tracker.record({ originalTokens: 10 + i, axonTokens: 5, reductionPct: 50, direction: "encode" });
      }

      const last3 = tracker.getRecentEvents(3);
      expect(last3).toHaveLength(3);
      expect(last3[0].originalTokens).toBe(12);
      expect(last3[2].originalTokens).toBe(14);
    });

    it("returns all events if N > total", () => {
      const tracker = new AnalyticsTracker();
      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });

      const events = tracker.getRecentEvents(100);
      expect(events).toHaveLength(1);
    });

    it("returns all for N=0 (slice(-0) returns full array)", () => {
      const tracker = new AnalyticsTracker();
      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });

      // slice(-0) === slice(0) which returns the full array — this is JavaScript behavior
      expect(tracker.getRecentEvents(0)).toHaveLength(1);
    });
  });

  describe("subscribe", () => {
    it("notifies listeners on record", () => {
      const tracker = new AnalyticsTracker();
      const listener = vi.fn();
      tracker.subscribe(listener);

      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        totalMessages: 1,
        totalNLTokens: 10,
      }));
    });

    it("notifies multiple listeners", () => {
      const tracker = new AnalyticsTracker();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      tracker.subscribe(listener1);
      tracker.subscribe(listener2);

      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("unsubscribe stops notifications", () => {
      const tracker = new AnalyticsTracker();
      const listener = vi.fn();
      const unsub = tracker.subscribe(listener);

      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();

      tracker.record({ originalTokens: 20, axonTokens: 10, reductionPct: 50, direction: "encode" });
      expect(listener).toHaveBeenCalledTimes(1); // still 1, not called again
    });

    it("returns an unsubscribe function", () => {
      const tracker = new AnalyticsTracker();
      const unsub = tracker.subscribe(() => {});
      expect(typeof unsub).toBe("function");
    });
  });

  describe("direction tracking", () => {
    it("records encode direction", () => {
      const tracker = new AnalyticsTracker();
      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "encode" });
      const events = tracker.getRecentEvents(1);
      expect(events[0].direction).toBe("encode");
    });

    it("records decode direction", () => {
      const tracker = new AnalyticsTracker();
      tracker.record({ originalTokens: 10, axonTokens: 5, reductionPct: 50, direction: "decode" });
      const events = tracker.getRecentEvents(1);
      expect(events[0].direction).toBe("decode");
    });
  });
});
