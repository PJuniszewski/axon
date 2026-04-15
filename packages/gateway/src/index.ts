export { buildServer } from "./server.js";
export { AnalyticsTracker } from "./analytics.js";

// Start server when run as entry point
import { buildServer } from "./server.js";

const port = Number(process.env.AXON_PORT ?? 9090);
const server = await buildServer({ port });
await server.listen({ port, host: "0.0.0.0" });
