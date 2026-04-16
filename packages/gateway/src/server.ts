import Fastify from "fastify";
import cors from "@fastify/cors";
import { AnalyticsTracker } from "./analytics.js";
import { handleEncode, handleDecode, handleProxy } from "./proxy.js";
import { AgentRegistry } from "./injector.js";
import { validate } from "./validator.js";
import { routeAxonMessage } from "./router.js";
import { injectCodecFit } from "@axon/codec";
import { parseAxon } from "@axon/core";

export async function buildServer(options?: { port?: number }) {
  const app = Fastify({ logger: true });
  const analytics = new AnalyticsTracker();
  const registry = new AgentRegistry();

  await app.register(cors, { origin: true });

  // ── Health ──
  app.get("/health", async () => {
    return { status: "ok", uptime: process.uptime() };
  });

  // ── Native mode routes ──

  app.post<{ Body: { systemPrompt: string } }>("/inject", async (req) => {
    return { injected: injectCodecFit(req.body.systemPrompt) };
  });

  app.post<{ Body: { message: string } }>("/validate", async (req) => {
    return validate(req.body.message);
  });

  app.post<{ Body: { message: string } }>("/parse", async (req) => {
    try {
      const parsed = parseAxon(req.body.message);
      return { success: true, parsed };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  app.post<{ Body: { message: string } }>("/route", async (req) => {
    const result = await routeAxonMessage(req.body.message, registry);
    if (result.axonMsg?.agent) {
      analytics.recordCompliance(result.axonMsg.agent, true);
    }
    if (result.nlFallback) {
      analytics.recordNLFallback(result.targetAgent ?? "unknown");
    }
    return result;
  });

  app.post<{ Body: { id: string; url: string; systemPrompt?: string } }>(
    "/agents/register",
    async (req) => {
      return registry.register(req.body.id, req.body.url, req.body.systemPrompt);
    },
  );

  app.get("/agents", async () => {
    return registry.getAll();
  });

  // ── Legacy routes (kept for backward compat) ──

  app.post<{ Body: { message: string } }>("/encode", async (req) => {
    return handleEncode(req.body, analytics);
  });

  app.post<{ Body: { axon: string } }>("/decode", async (req) => {
    return handleDecode(req.body, analytics);
  });

  app.post<{ Body: { message: string; target?: string } }>("/proxy", async (req) => {
    return handleProxy(req.body, analytics);
  });

  // ── Analytics ──

  app.get("/analytics", async () => {
    return analytics.getExtendedStats();
  });

  app.get("/analytics/live", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    reply.raw.write(`data: ${JSON.stringify(analytics.getExtendedStats())}\n\n`);
    const unsubscribe = analytics.subscribe((stats) => {
      reply.raw.write(`data: ${JSON.stringify(stats)}\n\n`);
    });
    req.raw.on("close", () => { unsubscribe(); });
  });

  return app;
}
