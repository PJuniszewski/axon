import { parseAxon, formatAxon, PERFORMATIVE_TO_SYMBOL } from "@axon/core";
import type { AxonMsg as AxonMsgType, PerformativeType } from "@axon/core";

class AxonMsgBuilder {
  private performative: PerformativeType;
  private agent?: string;
  private payloadContent?: string;
  private contextContent?: string;

  constructor(performative: PerformativeType) {
    this.performative = performative;
  }

  to(agent: string): this {
    this.agent = agent;
    return this;
  }

  payload(content: string): this {
    this.payloadContent = content;
    return this;
  }

  context(meta: string): this {
    this.contextContent = meta;
    return this;
  }

  urgent(): this {
    this.performative = "URGENT";
    return this;
  }

  build(): string {
    const symbol = PERFORMATIVE_TO_SYMBOL.get(this.performative);
    if (!symbol) {
      throw new Error(`Unknown performative: ${this.performative}`);
    }

    let result = symbol;

    if (this.agent) {
      result += `@${this.agent}`;
    }

    if (this.payloadContent) {
      result += ` ⟦${this.payloadContent}⟧`;
    }

    if (this.contextContent) {
      result += ` ⟨${this.contextContent}⟩`;
    }

    return result;
  }
}

export class AxonMsg {
  static request(): AxonMsgBuilder {
    return new AxonMsgBuilder("REQUEST");
  }

  static query(): AxonMsgBuilder {
    return new AxonMsgBuilder("QUERY");
  }

  static inform(): AxonMsgBuilder {
    return new AxonMsgBuilder("INFORM");
  }

  static delegate(): AxonMsgBuilder {
    return new AxonMsgBuilder("DELEGATE");
  }

  static merge(): AxonMsgBuilder {
    return new AxonMsgBuilder("MERGE");
  }

  static confirm(): AxonMsgBuilder {
    return new AxonMsgBuilder("CONFIRM");
  }

  static reject(): AxonMsgBuilder {
    return new AxonMsgBuilder("REJECT");
  }

  static error(): AxonMsgBuilder {
    return new AxonMsgBuilder("ERROR");
  }

  static complete(): AxonMsgBuilder {
    return new AxonMsgBuilder("COMPLETE");
  }

  static retry(): AxonMsgBuilder {
    return new AxonMsgBuilder("RETRY");
  }

  static urgent(): AxonMsgBuilder {
    return new AxonMsgBuilder("URGENT");
  }

  /**
   * Parse a raw AXON string into an AxonMsg object.
   */
  static parse(raw: string): AxonMsgType {
    return parseAxon(raw);
  }

  static isAxon(text: string): boolean {
    try {
      parseAxon(text.trim());
      return true;
    } catch {
      return false;
    }
  }
}
