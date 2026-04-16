export { buildServer } from "./server.js";
export { AnalyticsTracker } from "./analytics.js";
export { AgentRegistry } from "./injector.js";
export type { AgentRegistration } from "./injector.js";
export { validate, isNaturalLanguage } from "./validator.js";
export type { ValidationResult } from "./validator.js";
export { routeAxonMessage } from "./router.js";
export type { RouteResult } from "./router.js";

// Start server when run as entry point
import { buildServer } from "./server.js";

const port = Number(process.env.AXON_PORT ?? 9090);
const server = await buildServer({ port });
await server.listen({ port, host: "0.0.0.0" });
