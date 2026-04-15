import { describe, it, expect, vi } from "vitest";
import { CODEC_PROMPT } from "../src/codecfit.js";
import { decode } from "../src/decoder.js";
import { estimateNLTokens } from "../src/tokenCounter.js";

describe("CODEC_PROMPT", () => {
  it("is under 220 tokens (estimated)", () => {
    const tokenEstimate = estimateNLTokens(CODEC_PROMPT);
    expect(tokenEstimate).toBeLessThan(220);
  });

  it("contains all intent symbols", () => {
    expect(CODEC_PROMPT).toContain("!");
    expect(CODEC_PROMPT).toContain("?");
    expect(CODEC_PROMPT).toContain("≡");
    expect(CODEC_PROMPT).toContain("→");
    expect(CODEC_PROMPT).toContain("✓");
    expect(CODEC_PROMPT).toContain("✗");
    expect(CODEC_PROMPT).toContain("⊗");
    expect(CODEC_PROMPT).toContain("∎");
    expect(CODEC_PROMPT).toContain("⟳");
    expect(CODEC_PROMPT).toContain("⚡");
    expect(CODEC_PROMPT).toContain("⊕");
  });

  it("contains format description", () => {
    expect(CODEC_PROMPT).toContain("FORMAT:");
    expect(CODEC_PROMPT).toContain("[INTENT]");
  });
});

describe("decode (fallback mode, no API key)", () => {
  it("expands symbols without LLM", async () => {
    // Clear env to force fallback
    const orig = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      const result = await decode("!@orch ⟦rev PR#42⟧");
      expect(result).toBeTruthy();
      expect(result).toContain("REQUEST");
    } finally {
      if (orig) process.env.ANTHROPIC_API_KEY = orig;
    }
  });
});
