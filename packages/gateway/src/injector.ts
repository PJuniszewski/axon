import { injectCodecFit } from "@axon/codec";

export interface AgentRegistration {
  id: string;
  url: string;
  systemPrompt?: string;
  codecfitInjected: boolean;
  registeredAt: number;
}

export class AgentRegistry {
  private agents = new Map<string, AgentRegistration>();

  register(id: string, url: string, systemPrompt?: string): AgentRegistration {
    const agent: AgentRegistration = {
      id,
      url,
      systemPrompt,
      codecfitInjected: true,
      registeredAt: Date.now(),
    };
    this.agents.set(id, agent);
    return agent;
  }

  get(id: string): AgentRegistration | undefined {
    return this.agents.get(id);
  }

  getAll(): AgentRegistration[] {
    return [...this.agents.values()];
  }

  getInjectedSystemPrompt(agentId: string): string | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    return injectCodecFit(agent.systemPrompt ?? "");
  }

  has(id: string): boolean {
    return this.agents.has(id);
  }

  resolve(idOrAlias: string): AgentRegistration | undefined {
    // Direct match
    if (this.agents.has(idOrAlias)) return this.agents.get(idOrAlias);
    // Alias match (e.g., "orch" → "orchestrator")
    for (const [id, agent] of this.agents) {
      if (id.startsWith(idOrAlias) || idOrAlias.startsWith(id)) return agent;
    }
    return undefined;
  }
}
