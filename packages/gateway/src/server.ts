import Fastify from "fastify";
import cors from "@fastify/cors";
import { AnalyticsTracker } from "./analytics.js";
import { handleEncode, handleDecode, handleProxy } from "./proxy.js";

export async function buildServer(options?: { port?: number }) {
  const app = Fastify({ logger: true });
  const analytics = new AnalyticsTracker();

  await app.register(cors, { origin: true });

  // Health check
  app.get("/health", async () => {
    return { status: "ok", uptime: process.uptime() };
  });

  // Encode NL → AXON
  app.post<{ Body: { message: string } }>("/encode", async (req) => {
    return handleEncode(req.body, analytics);
  });

  // Decode AXON → NL
  app.post<{ Body: { axon: string } }>("/decode", async (req) => {
    return handleDecode(req.body, analytics);
  });

  // Full proxy: encode → simulate forward → decode
  app.post<{ Body: { message: string; target?: string } }>("/proxy", async (req) => {
    return handleProxy(req.body, analytics);
  });

  // Analytics
  app.get("/analytics", async () => {
    return analytics.getTotalSavings();
  });

  // SSE stream of real-time compression events
  app.get("/analytics/live", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send initial stats
    reply.raw.write(`data: ${JSON.stringify(analytics.getTotalSavings())}\n\n`);

    const unsubscribe = analytics.subscribe((stats) => {
      reply.raw.write(`data: ${JSON.stringify(stats)}\n\n`);
    });

    req.raw.on("close", () => {
      unsubscribe();
    });
  });

  return app;
}

// Start server when run directly
const isMain = process.argv[1]?.endsWith("index.ts") ||
               process.argv[1]?.endsWith("index.js") ||
               process.argv[1]?.endsWith("server.ts") ||
               process.argv[1]?.endsWith("server.js");

if (isMain) {
  const port = Number(process.env.AXON_PORT ?? 9090);
  const server = await buildServer({ port });
  await server.listen({ port, host: "0.0.0.0" });
}
