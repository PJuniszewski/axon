import { describe, it, expect } from "vitest";
import { AgentRegistry } from "../src/injector.js";

describe("AgentRegistry", () => {
  it("registers an agent", () => {
    const reg = new AgentRegistry();
    const agent = reg.register("code-review", "http://localhost:8081", "You are a code reviewer.");
    expect(agent.id).toBe("code-review");
    expect(agent.url).toBe("http://localhost:8081");
    expect(agent.codecfitInjected).toBe(true);
    expect(agent.registeredAt).toBeGreaterThan(0);
  });

  it("retrieves a registered agent", () => {
    const reg = new AgentRegistry();
    reg.register("orch", "http://localhost:8080");
    expect(reg.get("orch")).toBeDefined();
    expect(reg.get("orch")!.id).toBe("orch");
  });

  it("returns undefined for unknown agent", () => {
    const reg = new AgentRegistry();
    expect(reg.get("nonexistent")).toBeUndefined();
  });

  it("lists all agents", () => {
    const reg = new AgentRegistry();
    reg.register("a1", "http://a1");
    reg.register("a2", "http://a2");
    expect(reg.getAll()).toHaveLength(2);
  });

  it("returns injected system prompt", () => {
    const reg = new AgentRegistry();
    reg.register("bot", "http://bot", "You are a helpful bot.");
    const prompt = reg.getInjectedSystemPrompt("bot");
    expect(prompt).toContain("PROTOCOL:AXON");
    expect(prompt).toContain("---");
    expect(prompt).toContain("You are a helpful bot.");
  });

  it("returns null for unknown agent prompt", () => {
    const reg = new AgentRegistry();
    expect(reg.getInjectedSystemPrompt("nonexistent")).toBeNull();
  });

  it("resolves by prefix alias", () => {
    const reg = new AgentRegistry();
    reg.register("orchestrator", "http://orch");
    expect(reg.resolve("orch")).toBeDefined();
    expect(reg.resolve("orch")!.id).toBe("orchestrator");
  });

  it("has() checks existence", () => {
    const reg = new AgentRegistry();
    reg.register("x", "http://x");
    expect(reg.has("x")).toBe(true);
    expect(reg.has("y")).toBe(false);
  });
});
