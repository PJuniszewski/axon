import { describe, it, expect } from "vitest";
import { estimateNLTokens, estimateAxonTokens, estimateTokens, countTokens } from "../src/tokenCounter.js";

describe("countTokens (cl100k_base)", () => {
  it("returns 0 for empty string", () => {
    expect(countTokens("")).toBe(0);
  });

  it("returns 0 for whitespace only", () => {
    expect(countTokens("   ")).toBe(0);
  });

  it("tokenizes single word", () => {
    expect(countTokens("hello")).toBe(1);
  });

  it("tokenizes typical sentence", () => {
    const text = "Please review the pull request and run all tests";
    const tokens = countTokens(text);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(20);
  });

  it("tokenizes AXON message", () => {
    const tokens = countTokens("!@orch ⟦rev PR#42⟧");
    expect(tokens).toBeGreaterThan(0);
  });

  it("increases monotonically with more text", () => {
    const t1 = countTokens("hello");
    const t2 = countTokens("hello world");
    const t3 = countTokens("hello world test");
    expect(t2).toBeGreaterThanOrEqual(t1);
    expect(t3).toBeGreaterThanOrEqual(t2);
  });

  it("handles unicode symbols", () => {
    const tokens = countTokens("⟦⟧⟨⟩∧∨∀∃∅");
    expect(tokens).toBeGreaterThan(0);
  });

  it("ASCII symbols tokenize as 1 token each", () => {
    expect(countTokens("!")).toBe(1);
    expect(countTokens("?")).toBe(1);
    expect(countTokens("#")).toBe(1);
    expect(countTokens("@")).toBe(1);
    expect(countTokens("|")).toBe(1);
    expect(countTokens(":")).toBe(1);
  });

  it("Unicode delimiters cost 3 tokens each", () => {
    expect(countTokens("⟦")).toBe(3);
    expect(countTokens("⟧")).toBe(3);
    expect(countTokens("⟨")).toBe(3);
    expect(countTokens("⟩")).toBe(3);
  });

  it("ASCII delimiter alternatives cost 1 token each", () => {
    expect(countTokens("[[")).toBe(1);
    expect(countTokens("]]")).toBe(1);
    expect(countTokens("<<")).toBe(1);
    expect(countTokens(">>")).toBe(1);
  });
});

describe("estimateNLTokens", () => {
  it("delegates to countTokens", () => {
    const text = "Please review the pull request";
    expect(estimateNLTokens(text)).toBe(countTokens(text));
  });
});

describe("estimateAxonTokens", () => {
  it("delegates to countTokens", () => {
    const text = "!@orch ⟦test⟧";
    expect(estimateAxonTokens(text)).toBe(countTokens(text));
  });
});

describe("estimateTokens dispatcher", () => {
  it("NL and AXON modes use the same real tokenizer", () => {
    const text = "hello world test";
    expect(estimateTokens(text, "nl")).toBe(estimateTokens(text, "axon"));
  });
});
