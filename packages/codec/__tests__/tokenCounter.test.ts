import { describe, it, expect } from "vitest";
import { estimateNLTokens, estimateAxonTokens, estimateTokens } from "../src/tokenCounter.js";

describe("estimateNLTokens", () => {
  it("estimates single word", () => {
    expect(estimateNLTokens("hello")).toBe(2); // 1 * 1.3 = 1.3 → ceil = 2
  });

  it("estimates typical sentence", () => {
    const text = "Please review the pull request and run all tests";
    // 9 words * 1.35 = 12.15 → 13
    expect(estimateNLTokens(text)).toBe(13);
  });

  it("returns 0 for empty", () => {
    expect(estimateNLTokens("")).toBe(0);
  });
});

describe("estimateAxonTokens", () => {
  it("estimates AXON message", () => {
    const axon = "!@orch ⟦rev PR#42⟧";
    // length / 3.5
    expect(estimateAxonTokens(axon)).toBeGreaterThan(0);
  });

  it("estimates short AXON", () => {
    expect(estimateAxonTokens("!")).toBe(1);
  });
});

describe("estimateTokens", () => {
  it("dispatches to NL estimator", () => {
    expect(estimateTokens("hello world", "nl")).toBe(estimateNLTokens("hello world"));
  });

  it("dispatches to AXON estimator", () => {
    expect(estimateTokens("!@orch", "axon")).toBe(estimateAxonTokens("!@orch"));
  });
});
