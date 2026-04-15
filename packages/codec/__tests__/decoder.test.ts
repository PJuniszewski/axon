import { describe, it, expect } from "vitest";
import { CODEC_PROMPT } from "../src/codecfit.js";
import { decode } from "../src/decoder.js";
import { estimateNLTokens } from "../src/tokenCounter.js";

describe("CODEC_PROMPT", () => {
  it("is under 220 tokens (estimated)", () => {
    const tokenEstimate = estimateNLTokens(CODEC_PROMPT);
    expect(tokenEstimate).toBeLessThan(220);
  });

  it("contains all 11 intent symbols", () => {
    const symbols = ["!", "?", "≡", "→", "✓", "✗", "⊗", "∎", "⟳", "⚡", "⊕"];
    for (const s of symbols) {
      expect(CODEC_PROMPT).toContain(s);
    }
  });

  it("contains structural symbols", () => {
    expect(CODEC_PROMPT).toContain("⟦⟧");
    expect(CODEC_PROMPT).toContain("⟨⟩");
    expect(CODEC_PROMPT).toContain("@");
    expect(CODEC_PROMPT).toContain("#");
    expect(CODEC_PROMPT).toContain("|");
  });

  it("contains logic symbols", () => {
    expect(CODEC_PROMPT).toContain("∧");
    expect(CODEC_PROMPT).toContain("∨");
    expect(CODEC_PROMPT).toContain("∀");
    expect(CODEC_PROMPT).toContain("∅");
  });

  it("contains domain symbols", () => {
    expect(CODEC_PROMPT).toContain("∑");
    expect(CODEC_PROMPT).toContain("⊂");
    expect(CODEC_PROMPT).toContain("⊞");
    expect(CODEC_PROMPT).toContain("⌛");
  });

  it("contains format description", () => {
    expect(CODEC_PROMPT).toContain("FORMAT:");
    expect(CODEC_PROMPT).toContain("[INTENT]");
    expect(CODEC_PROMPT).toContain("[@AGENT]");
  });

  it("contains decode and encode instructions", () => {
    expect(CODEC_PROMPT).toContain("decode");
    expect(CODEC_PROMPT).toContain("encode");
  });

  it("is non-empty and reasonable length", () => {
    expect(CODEC_PROMPT.length).toBeGreaterThan(100);
    expect(CODEC_PROMPT.length).toBeLessThan(2000);
  });
});

describe("decode (fallback mode, no API key)", () => {
  const decodeNoKey = async (axon: string) => {
    const orig = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      return await decode(axon);
    } finally {
      if (orig) process.env.ANTHROPIC_API_KEY = orig;
    }
  };

  it("expands REQUEST symbol", async () => {
    const result = await decodeNoKey("!@orch ⟦rev PR#42⟧");
    expect(result).toContain("REQUEST");
  });

  it("expands ERROR symbol", async () => {
    const result = await decodeNoKey("⊗ ⟦timeout⟧");
    expect(result).toContain("ERROR");
  });

  it("expands COMPLETE symbol", async () => {
    const result = await decodeNoKey("∎ ⟦done⟧");
    expect(result).toContain("COMPLETE");
  });

  it("replaces payload brackets with readable brackets", async () => {
    const result = await decodeNoKey("! ⟦test⟧");
    expect(result).toContain("[");
    expect(result).toContain("]");
    expect(result).not.toContain("⟦");
    expect(result).not.toContain("⟧");
  });

  it("replaces context brackets with readable parens", async () => {
    const result = await decodeNoKey("⊗ ⟨30s⟩");
    expect(result).toContain("(");
    expect(result).toContain(")");
  });

  it("preserves structural symbols (@, #, |, :)", async () => {
    const result = await decodeNoKey("!@orch ⟦#42 | data:val⟧");
    expect(result).toContain("@");
    expect(result).toContain("#");
    expect(result).toContain("|");
    expect(result).toContain(":");
  });

  it("handles empty message gracefully", async () => {
    const result = await decodeNoKey("!");
    expect(result).toBeTruthy();
  });

  it("handles multiple symbols in one message", async () => {
    const result = await decodeNoKey("! ⟦∧ ∨ ∀ ∑ ⊂⟧");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(5);
  });

  it("returns a string", async () => {
    const result = await decodeNoKey("? ⟦status⟧");
    expect(typeof result).toBe("string");
  });
});
