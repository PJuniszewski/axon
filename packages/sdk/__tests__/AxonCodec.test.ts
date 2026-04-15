import { describe, it, expect } from "vitest";
import { AxonCodec } from "../src/AxonCodec.js";

describe("AxonCodec", () => {
  const codec = new AxonCodec();

  describe("encode (rule mode)", () => {
    it("encodes NL to AXON without API key", async () => {
      const result = await codec.encode("Please review the pull request");
      expect(result.encoded).toBeTruthy();
      expect(result.reductionPct).toBeGreaterThan(0);
      expect(result.nlTokens).toBeGreaterThan(0);
      expect(result.axonTokens).toBeGreaterThan(0);
    });

    it("returns valid CompressionResult", async () => {
      const result = await codec.encode("Check the database status");
      expect(result).toHaveProperty("original");
      expect(result).toHaveProperty("encoded");
      expect(result).toHaveProperty("nlTokens");
      expect(result).toHaveProperty("axonTokens");
      expect(result).toHaveProperty("reductionPct");
      expect(result).toHaveProperty("symbols");
    });
  });

  describe("analyze", () => {
    it("returns compression stats without modifying input", () => {
      const result = codec.analyze("Deploy the new version to production");
      expect(result.original).toBe("Deploy the new version to production");
      expect(result.encoded).toBeTruthy();
      expect(result.reductionPct).toBeGreaterThan(0);
    });
  });

  describe("encodeBatch", () => {
    it("encodes multiple messages", async () => {
      const results = await codec.encodeBatch([
        "Check the status",
        "Deploy the service",
        "Report the results",
      ]);
      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(result.encoded).toBeTruthy();
      }
    });
  });

  describe("decode (fallback mode)", () => {
    it("decodes AXON without API key using symbol expansion", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const result = await codec.decode("!@orch ⟦test⟧");
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });
});
