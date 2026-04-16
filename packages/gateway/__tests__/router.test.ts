import { describe, it, expect } from "vitest";
import { routeAxonMessage } from "../src/router.js";
import { AgentRegistry } from "../src/injector.js";

describe("routeAxonMessage", () => {
  it("routes to registered agent", async () => {
    const reg = new AgentRegistry();
    reg.register("orch", "http://localhost:8080");

    const result = await routeAxonMessage("! @orch [[test]]", reg);
    expect(result.targetAgent).toBe("orch");
    expect(result.forwarded).toBe(true);
    expect(result.axonMsg?.performative).toBe("REQUEST");
  });

  it("resolves agent by alias", async () => {
    const reg = new AgentRegistry();
    reg.register("orchestrator", "http://localhost:8080");

    const result = await routeAxonMessage("! @orch [[test]]", reg);
    expect(result.targetAgent).toBe("orchestrator");
    expect(result.forwarded).toBe(true);
  });

  it("returns error for unregistered agent", async () => {
    const reg = new AgentRegistry();

    const result = await routeAxonMessage("! @unknown [[test]]", reg);
    expect(result.forwarded).toBe(false);
    expect(result.error).toContain("not registered");
  });

  it("handles broadcast (no @agent)", async () => {
    const reg = new AgentRegistry();
    reg.register("a1", "http://a1");

    const result = await routeAxonMessage("! [[broadcast msg]]", reg);
    expect(result.targetAgent).toBe("*");
    expect(result.forwarded).toBe(true);
  });

  it("returns error for invalid AXON", async () => {
    const reg = new AgentRegistry();

    const result = await routeAxonMessage("xyz not axon", reg);
    expect(result.forwarded).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles NL fallback gracefully", async () => {
    const reg = new AgentRegistry();
    reg.register("orch", "http://localhost:8080");

    // NL input should get encoded then routed
    const result = await routeAxonMessage(
      "Please review the pull request and check all tests for the orchestrator agent",
      reg,
    );
    // After NL fallback encoding, it should attempt to route
    expect(result).toBeDefined();
  });
});
