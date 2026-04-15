import { describe, it, expect } from "vitest";
import { estimateNLTokens, estimateAxonTokens, estimateTokens } from "../src/tokenCounter.js";

describe("estimateNLTokens", () => {
  it("estimates single word", () => {
    expect(estimateNLTokens("hello")).toBe(2); // ceil(1 * 1.35) = 2
  });

  it("estimates typical sentence", () => {
    const text = "Please review the pull request and run all tests";
    // 9 words * 1.35 = 12.15 → 13
    expect(estimateNLTokens(text)).toBe(13);
  });

  it("returns 0 for empty", () => {
    expect(estimateNLTokens("")).toBe(0);
  });

  it("returns 0 for whitespace only", () => {
    expect(estimateNLTokens("   ")).toBe(0);
  });

  it("handles single character word", () => {
    expect(estimateNLTokens("I")).toBe(2); // ceil(1 * 1.35) = 2
  });

  it("handles very long sentence (50 words)", () => {
    const words = Array(50).fill("word").join(" ");
    expect(estimateNLTokens(words)).toBe(Math.ceil(50 * 1.35));
  });

  it("handles multiple spaces between words", () => {
    // "a   b   c" should still count as 3 words
    expect(estimateNLTokens("a   b   c")).toBe(Math.ceil(3 * 1.35));
  });

  it("counts hyphenated words as one word", () => {
    expect(estimateNLTokens("well-known")).toBe(2); // 1 word * 1.35 → 2
  });

  it("increases monotonically with word count", () => {
    const one = estimateNLTokens("hello");
    const two = estimateNLTokens("hello world");
    const three = estimateNLTokens("hello world test");
    expect(two).toBeGreaterThan(one);
    expect(three).toBeGreaterThan(two);
  });
});

describe("estimateAxonTokens", () => {
  it("estimates AXON message", () => {
    const axon = "!@orch ⟦rev PR#42⟧";
    expect(estimateAxonTokens(axon)).toBeGreaterThan(0);
  });

  it("estimates short AXON (single char)", () => {
    expect(estimateAxonTokens("!")).toBe(1);
  });

  it("estimates empty string as 0", () => {
    expect(estimateAxonTokens("")).toBe(0);
  });

  it("scales with message length", () => {
    const short = estimateAxonTokens("!⟦a⟧");
    const long = estimateAxonTokens("!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧");
    expect(long).toBeGreaterThan(short);
  });

  it("counts approximately chars/4", () => {
    const msg = "!@orch ⟦test⟧"; // length varies due to unicode
    const expected = Math.ceil(msg.length / 4);
    expect(estimateAxonTokens(msg)).toBe(expected);
  });

  it("always less than NL estimate for same semantic content", () => {
    // AXON encoded is shorter than the NL original
    const nlTokens = estimateNLTokens("Please review the pull request");
    const axonTokens = estimateAxonTokens("!⟦rev PR⟧");
    expect(axonTokens).toBeLessThan(nlTokens);
  });
});

describe("estimateTokens dispatcher", () => {
  it("dispatches to NL estimator", () => {
    const text = "hello world";
    expect(estimateTokens(text, "nl")).toBe(estimateNLTokens(text));
  });

  it("dispatches to AXON estimator", () => {
    const text = "!@orch";
    expect(estimateTokens(text, "axon")).toBe(estimateAxonTokens(text));
  });

  it("gives different results for same text in different modes", () => {
    const text = "hello world test";
    const nlEst = estimateTokens(text, "nl");
    const axonEst = estimateTokens(text, "axon");
    expect(nlEst).not.toBe(axonEst);
  });
});
