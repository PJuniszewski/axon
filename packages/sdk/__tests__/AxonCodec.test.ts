import { describe, it, expect } from "vitest";
import { AxonCodec } from "../src/AxonCodec.js";

describe("AxonCodec", () => {
  describe("constructor", () => {
    it("creates with default config (rule mode)", () => {
      const codec = new AxonCodec();
      // Should work without any config
      expect(codec).toBeTruthy();
    });

    it("creates with explicit rule mode", () => {
      const codec = new AxonCodec({ mode: "rule" });
      expect(codec).toBeTruthy();
    });

    it("creates with hybrid mode", () => {
      const codec = new AxonCodec({ mode: "hybrid" });
      expect(codec).toBeTruthy();
    });

    it("creates with api key", () => {
      const codec = new AxonCodec({ apiKey: "test-key" });
      expect(codec).toBeTruthy();
    });

    it("creates with empty config", () => {
      const codec = new AxonCodec({});
      expect(codec).toBeTruthy();
    });
  });

  describe("encode (rule mode)", () => {
    const codec = new AxonCodec();

    it("returns valid CompressionResult", async () => {
      const result = await codec.encode("Please review the pull request");
      expect(result).toHaveProperty("original");
      expect(result).toHaveProperty("encoded");
      expect(result).toHaveProperty("nlTokens");
      expect(result).toHaveProperty("axonTokens");
      expect(result).toHaveProperty("reductionPct");
      expect(result).toHaveProperty("symbols");
    });

    it("preserves original text", async () => {
      const msg = "Check the database status";
      const result = await codec.encode(msg);
      expect(result.original).toBe(msg);
    });

    it("produces non-empty encoded output", async () => {
      const result = await codec.encode("Deploy the service");
      expect(result.encoded).toBeTruthy();
      expect(result.encoded.length).toBeGreaterThan(0);
    });

    it("produces shorter character output than input", async () => {
      const result = await codec.encode("Please review the pull request and check tests");
      expect(result.encoded.length).toBeLessThan(result.original.length);
    });

    it("handles empty string", async () => {
      const result = await codec.encode("");
      expect(result.encoded).toBe("");
      expect(result.reductionPct).toBe(0);
    });
  });

  describe("encode (hybrid mode)", () => {
    it("falls back to rule-based in hybrid mode", async () => {
      const codec = new AxonCodec({ mode: "hybrid" });
      const result = await codec.encode("Please review the code changes in the pull request");
      expect(result.encoded).toBeTruthy();
      expect(result.encoded.length).toBeLessThan("Please review the code changes in the pull request".length);
    });
  });

  describe("analyze", () => {
    const codec = new AxonCodec();

    it("returns compression stats", () => {
      const result = codec.analyze("Deploy the new version to production");
      expect(result.original).toBe("Deploy the new version to production");
      expect(result.encoded).toBeTruthy();
      expect(result.nlTokens).toBeGreaterThan(0);
      expect(result.axonTokens).toBeGreaterThan(0);
    });

    it("returns same result as encode (synchronous)", () => {
      const msg = "Check the service health";
      const analyzed = codec.analyze(msg);
      expect(analyzed.original).toBe(msg);
      expect(analyzed.encoded).toBeTruthy();
      expect(analyzed.nlTokens).toBeGreaterThan(0);
    });

    it("handles empty string", () => {
      const result = codec.analyze("");
      expect(result.encoded).toBe("");
      expect(result.reductionPct).toBe(0);
    });

    it("detects symbols in output", () => {
      const result = codec.analyze("An error occurred in the database with timeout");
      expect(result.symbols.length).toBeGreaterThan(0);
      // Should contain ERROR symbol
      expect(result.symbols.some((s) => s.name === "ERROR")).toBe(true);
    });
  });

  describe("encodeBatch", () => {
    const codec = new AxonCodec();

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

    it("handles empty array", async () => {
      const results = await codec.encodeBatch([]);
      expect(results).toHaveLength(0);
    });

    it("handles single item", async () => {
      const results = await codec.encodeBatch(["Test"]);
      expect(results).toHaveLength(1);
    });

    it("preserves order", async () => {
      const msgs = ["Alpha first", "Beta second", "Gamma third"];
      const results = await codec.encodeBatch(msgs);
      expect(results[0].original).toBe("Alpha first");
      expect(results[1].original).toBe("Beta second");
      expect(results[2].original).toBe("Gamma third");
    });
  });

  describe("decode (fallback mode)", () => {
    it("decodes AXON without API key using symbol expansion", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const codec = new AxonCodec();
        const result = await codec.decode("!@orch ⟦test⟧");
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });

    it("returns non-empty string for any valid AXON", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const codec = new AxonCodec();
        const cases = ["!", "?@db ⟦status⟧", "⊗ ⟦timeout⟧ ⟨30s⟩"];
        for (const axon of cases) {
          const result = await codec.decode(axon);
          expect(result.length).toBeGreaterThan(0);
        }
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("native mode", () => {
    it("creates with native mode", () => {
      const codec = new AxonCodec({ mode: "native" });
      expect(codec).toBeTruthy();
    });

    it("encode in native mode uses rule-based fallback", async () => {
      const codec = new AxonCodec({ mode: "native" });
      const result = await codec.encode("Please review the pull request and check tests");
      expect(result.encoded).toBeTruthy();
    });
  });

  describe("injectCodecFit", () => {
    const codec = new AxonCodec();

    it("injects CodecFit into system prompt", () => {
      const result = codec.injectCodecFit("You are a helpful bot.");
      expect(result).toContain("PROTOCOL:AXON");
      expect(result).toContain("You are a helpful bot.");
    });
  });

  describe("parseAgentOutput", () => {
    const codec = new AxonCodec();

    it("parses valid AXON", () => {
      const r = codec.parseAgentOutput("! @orch [[test]]");
      expect(r.valid).toBe(true);
      expect(r.parsed?.performative).toBe("REQUEST");
    });

    it("detects NL fallback", () => {
      const r = codec.parseAgentOutput("This is not AXON");
      expect(r.valid).toBe(false);
      expect(r.fallbackToNL).toBe(true);
    });

    it("handles empty string", () => {
      const r = codec.parseAgentOutput("");
      expect(r.valid).toBe(false);
    });
  });

  describe("measureBoundarySavings", () => {
    const codec = new AxonCodec();

    it("measures token savings", () => {
      const r = codec.measureBoundarySavings(
        "! @orch [[rev PR#42]]",
        "Please review pull request number 42 for the orchestrator",
      );
      expect(r.axonTokens).toBeGreaterThan(0);
      expect(r.nlTokens).toBeGreaterThan(0);
      expect(r.savedTokens).toBeGreaterThan(0);
      expect(r.reductionPct).toBeGreaterThan(0);
    });
  });
});
