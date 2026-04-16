import { describe, it, expect } from "vitest";
import { CODEC_PROMPT, CODECFIT_INJECT, CODECFIT_TOKEN_BUDGET, injectCodecFit, stripCodecFit } from "../src/codecfit.js";
import { decode } from "../src/decoder.js";
import { estimateNLTokens, countTokens } from "../src/tokenCounter.js";

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

describe("CODECFIT_INJECT (native mode prompt)", () => {
  it("is under token budget", () => {
    const tokens = countTokens(CODECFIT_INJECT);
    expect(tokens).toBeLessThanOrEqual(CODECFIT_TOKEN_BUDGET);
  });

  it("contains ASCII intent symbols", () => {
    expect(CODECFIT_INJECT).toContain("ERR");
    expect(CODECFIT_INJECT).toContain("DONE");
    expect(CODECFIT_INJECT).toContain("RPT");
    expect(CODECFIT_INJECT).toContain("!!");
  });

  it("contains format description", () => {
    expect(CODECFIT_INJECT).toContain("FORMAT:");
    expect(CODECFIT_INJECT).toContain("INTENT");
  });

  it("contains examples", () => {
    expect(CODECFIT_INJECT).toContain("@orch");
    expect(CODECFIT_INJECT).toContain("PR#42");
  });
});

describe("injectCodecFit / stripCodecFit", () => {
  it("injects CodecFit before existing prompt", () => {
    const injected = injectCodecFit("You are a code reviewer.");
    expect(injected).toContain("PROTOCOL:AXON");
    expect(injected).toContain("---");
    expect(injected).toContain("You are a code reviewer.");
    expect(injected.indexOf("PROTOCOL:AXON")).toBeLessThan(injected.indexOf("You are a code reviewer."));
  });

  it("stripCodecFit recovers original prompt", () => {
    const original = "You are a helpful assistant.";
    const injected = injectCodecFit(original);
    const stripped = stripCodecFit(injected);
    expect(stripped).toBe(original);
  });

  it("stripCodecFit returns unchanged if no CodecFit", () => {
    expect(stripCodecFit("Just a normal prompt")).toBe("Just a normal prompt");
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
