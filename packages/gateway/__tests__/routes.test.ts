import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildServer } from "../src/server.js";
import type { FastifyInstance } from "fastify";

describe("Gateway routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /health", () => {
    it("returns 200 with status ok", async () => {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe("ok");
      expect(body.uptime).toBeGreaterThan(0);
    });
  });

  describe("POST /encode", () => {
    it("encodes a natural language message", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/encode",
        payload: { message: "Please review the pull request number 42" },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.encoded).toBeTruthy();
      expect(body.nlTokens).toBeGreaterThan(0);
      expect(body.axonTokens).toBeGreaterThan(0);
      expect(body.reductionPct).toBeGreaterThan(0);
    });
  });

  describe("POST /decode", () => {
    it("decodes AXON to NL (fallback mode)", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const res = await app.inject({
          method: "POST",
          url: "/decode",
          payload: { axon: "!@orch ⟦rev PR#42⟧" },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.decoded).toBeTruthy();
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("POST /proxy", () => {
    it("encodes and simulates proxy flow", async () => {
      const orig = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      try {
        const res = await app.inject({
          method: "POST",
          url: "/proxy",
          payload: { message: "Check the database status" },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.original).toBe("Check the database status");
        expect(body.encoded).toBeTruthy();
      } finally {
        if (orig) process.env.ANTHROPIC_API_KEY = orig;
      }
    });
  });

  describe("GET /analytics", () => {
    it("returns aggregated stats", async () => {
      // First encode something to generate analytics
      await app.inject({
        method: "POST",
        url: "/encode",
        payload: { message: "Test message for analytics" },
      });

      const res = await app.inject({ method: "GET", url: "/analytics" });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.totalMessages).toBeGreaterThan(0);
      expect(body).toHaveProperty("totalNLTokens");
      expect(body).toHaveProperty("totalAxonTokens");
      expect(body).toHaveProperty("avgReduction");
    });
  });
});
