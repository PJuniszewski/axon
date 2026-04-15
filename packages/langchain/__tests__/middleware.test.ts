import { describe, it, expect, vi } from "vitest";
import { AxonMiddleware } from "../src/middleware.js";

describe("AxonMiddleware", () => {
  describe("compress", () => {
    it("compresses a message and returns CompressionResult", () => {
      const mw = new AxonMiddleware();
      const result = mw.compress("Please review the pull request and check all tests");
      expect(result.encoded).toBeTruthy();
      expect(result.original).toBe("Please review the pull request and check all tests");
      expect(result.nlTokens).toBeGreaterThan(0);
      expect(result.axonTokens).toBeGreaterThan(0);
    });

    it("defaults to ASCII mode", () => {
      const mw = new AxonMiddleware();
      const result = mw.compress("Please check the database status");
      // ASCII mode uses [[ ]] instead of ⟦ ⟧
      expect(result.encoded).toContain("[[");
      expect(result.encoded).toContain("]]");
      expect(result.encoded).not.toContain("⟦");
    });

    it("respects unicode mode when configured", () => {
      const mw = new AxonMiddleware({ ascii: false });
      const result = mw.compress("Please check the database status");
      expect(result.encoded).toContain("⟦");
    });

    it("calls onCompress callback", () => {
      const onCompress = vi.fn();
      const mw = new AxonMiddleware({ onCompress });
      mw.compress("Test message");
      expect(onCompress).toHaveBeenCalledTimes(1);
      expect(onCompress).toHaveBeenCalledWith(
        expect.objectContaining({ original: "Test message" }),
      );
    });
  });

  describe("decompress", () => {
    it("decompresses AXON to NL (fallback mode)", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const mw = new AxonMiddleware();
        const result = await mw.decompress("!@orch [[test]]");
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("wrap / unwrap", () => {
    it("wrap returns compressed string", () => {
      const mw = new AxonMiddleware();
      const encoded = mw.wrap("Deploy the service now");
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
      expect(encoded.length).toBeLessThan("Deploy the service now".length);
    });

    it("unwrap returns NL string", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const mw = new AxonMiddleware();
        const result = await mw.unwrap("! [[test]]");
        expect(typeof result).toBe("string");
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("pipe", () => {
    it("runs full compress → transport → decompress pipeline", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const mw = new AxonMiddleware();
        const result = await mw.pipe(
          "Check database status",
          (encoded) => encoded, // echo transport
        );
        expect(result.compressed.encoded).toBeTruthy();
        expect(result.response).toBe(result.compressed.encoded);
        expect(result.decoded).toBeTruthy();
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });

    it("works with async transport", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const mw = new AxonMiddleware();
        const result = await mw.pipe(
          "Deploy now",
          async (encoded) => {
            await new Promise((r) => setTimeout(r, 10));
            return encoded;
          },
        );
        expect(result.decoded).toBeTruthy();
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("stats", () => {
    it("tracks running statistics", () => {
      const mw = new AxonMiddleware();
      // Use longer messages where ASCII mode genuinely saves tokens
      mw.compress("Please review the pull request number 42 and check if all tests are passing, then report back with a summary");
      mw.compress("Could you please fetch the records from the database where the status is pending and validate the pipeline");

      const stats = mw.getStats();
      expect(stats.totalMessages).toBe(2);
      expect(stats.totalNLTokens).toBeGreaterThan(0);
      expect(stats.totalAxonTokens).toBeGreaterThan(0);
      expect(stats.totalSaved).toBeGreaterThan(0);
      expect(stats.avgReduction).toBeGreaterThan(0);
    });

    it("resets statistics", () => {
      const mw = new AxonMiddleware();
      mw.compress("Test message");
      expect(mw.getStats().totalMessages).toBe(1);

      mw.resetStats();
      expect(mw.getStats().totalMessages).toBe(0);
      expect(mw.getStats().totalNLTokens).toBe(0);
    });

    it("empty stats when no messages processed", () => {
      const mw = new AxonMiddleware();
      const stats = mw.getStats();
      expect(stats.totalMessages).toBe(0);
      expect(stats.avgReduction).toBe(0);
    });
  });
});
