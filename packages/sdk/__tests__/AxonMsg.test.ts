import { describe, it, expect } from "vitest";
import { AxonMsg } from "../src/AxonMsg.js";

describe("AxonMsg builder", () => {
  describe("basic building", () => {
    it("builds a request message", () => {
      expect(AxonMsg.request().to("orch").payload("test").build()).toBe("!@orch ⟦test⟧");
    });

    it("builds request with payload and context", () => {
      expect(
        AxonMsg.request().to("orch").payload("rev PR#42 | ?tst.∀pass → ∑rpt").build()
      ).toBe("!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧");
    });

    it("builds a query message", () => {
      expect(AxonMsg.query().to("db").payload("status").build()).toBe("?@db ⟦status⟧");
    });

    it("builds a complete message", () => {
      expect(
        AxonMsg.complete().payload("svc#12:run ∧ health:pass ∧ ⊗:∅").build()
      ).toBe("∎ ⟦svc#12:run ∧ health:pass ∧ ⊗:∅⟧");
    });

    it("builds a delegate message", () => {
      expect(
        AxonMsg.delegate().to("code-rev").payload("diff.sec ∧ std.check → assess.struct").build()
      ).toBe("→@code-rev ⟦diff.sec ∧ std.check → assess.struct⟧");
    });

    it("builds an error message with context", () => {
      expect(
        AxonMsg.error().payload("pay.svc:timeout").context("30s").build()
      ).toBe("⊗ ⟦pay.svc:timeout⟧ ⟨30s⟩");
    });

    it("builds a confirm message (no payload)", () => {
      expect(AxonMsg.confirm().build()).toBe("✓");
    });

    it("builds an urgent message", () => {
      expect(AxonMsg.urgent().payload("db.conn:fail").build()).toBe("⚡ ⟦db.conn:fail⟧");
    });
  });

  describe("all performative types", () => {
    it("builds all 11 bare intents with correct symbols", () => {
      expect(AxonMsg.request().build()).toBe("!");
      expect(AxonMsg.query().build()).toBe("?");
      expect(AxonMsg.inform().build()).toBe("≡");
      expect(AxonMsg.delegate().build()).toBe("→");
      expect(AxonMsg.merge().build()).toBe("⊕");
      expect(AxonMsg.confirm().build()).toBe("✓");
      expect(AxonMsg.reject().build()).toBe("✗");
      expect(AxonMsg.error().build()).toBe("⊗");
      expect(AxonMsg.complete().build()).toBe("∎");
      expect(AxonMsg.retry().build()).toBe("⟳");
      expect(AxonMsg.urgent().build()).toBe("⚡");
    });
  });

  describe(".urgent() modifier", () => {
    it("overrides performative to URGENT", () => {
      expect(AxonMsg.request().to("orch").payload("test").urgent().build()).toBe("⚡@orch ⟦test⟧");
    });

    it("works on any performative", () => {
      expect(AxonMsg.query().urgent().build()).toBe("⚡");
      expect(AxonMsg.error().urgent().build()).toBe("⚡");
    });
  });

  describe("chaining order independence", () => {
    it("to before payload", () => {
      expect(AxonMsg.request().to("a").payload("b").build()).toBe("!@a ⟦b⟧");
    });

    it("payload before to", () => {
      expect(AxonMsg.request().payload("b").to("a").build()).toBe("!@a ⟦b⟧");
    });

    it("context can come in any order", () => {
      expect(
        AxonMsg.request().context("c").payload("b").to("a").build()
      ).toBe("!@a ⟦b⟧ ⟨c⟩");
    });
  });

  describe("builder mutation — calling methods multiple times", () => {
    it("last .to() wins", () => {
      const msg = AxonMsg.request().to("first").to("second").payload("test").build();
      expect(msg).toBe("!@second ⟦test⟧");
    });

    it("last .payload() wins", () => {
      const msg = AxonMsg.request().payload("first").payload("second").build();
      expect(msg).toBe("! ⟦second⟧");
    });

    it("last .context() wins", () => {
      const msg = AxonMsg.request().context("a").context("b").payload("x").build();
      expect(msg).toBe("! ⟦x⟧ ⟨b⟩");
    });
  });

  describe("edge case payloads", () => {
    it("handles empty string payload (treated as no payload)", () => {
      const msg = AxonMsg.request().payload("").build();
      // Empty string payload is treated as present but empty
      expect(msg).toBe("!");
    });

    it("handles payload with AXON symbols inside", () => {
      const msg = AxonMsg.request().payload("⟦nested⟧ data").build();
      expect(msg).toBe("! ⟦⟦nested⟧ data⟧");
    });

    it("handles very long payload", () => {
      const longPayload = "x".repeat(5000);
      const msg = AxonMsg.request().payload(longPayload).build();
      expect(msg).toContain(longPayload);
    });

    it("handles payload with newlines", () => {
      const msg = AxonMsg.request().payload("line1\nline2").build();
      expect(msg).toBe("! ⟦line1\nline2⟧");
    });
  });

  describe("edge case agents", () => {
    it("handles agent with hyphens", () => {
      expect(AxonMsg.request().to("my-agent").build()).toBe("!@my-agent");
    });

    it("handles agent with numbers", () => {
      expect(AxonMsg.request().to("agent42").build()).toBe("!@agent42");
    });

    it("handles agent with underscores", () => {
      expect(AxonMsg.request().to("code_reviewer").build()).toBe("!@code_reviewer");
    });
  });
});

describe("AxonMsg.parse", () => {
  it("parses a request with agent and payload", () => {
    const parsed = AxonMsg.parse("!@orch ⟦rev PR#42⟧");
    expect(parsed.performative).toBe("REQUEST");
    expect(parsed.agent).toBe("orch");
    expect(parsed.payload).toBe("rev PR#42");
  });

  it("parses all 11 intents", () => {
    const cases: Array<[string, string]> = [
      ["!", "REQUEST"], ["?", "QUERY"], ["≡", "INFORM"],
      ["→", "DELEGATE"], ["⊕", "MERGE"], ["✓", "CONFIRM"],
      ["✗", "REJECT"], ["⊗", "ERROR"], ["∎", "COMPLETE"],
      ["⟳", "RETRY"], ["⚡", "URGENT"],
    ];
    for (const [symbol, perf] of cases) {
      expect(AxonMsg.parse(symbol).performative).toBe(perf);
    }
  });

  it("throws on invalid AXON", () => {
    expect(() => AxonMsg.parse("hello world")).toThrow();
  });

  it("throws on empty string", () => {
    expect(() => AxonMsg.parse("")).toThrow();
  });

  it("roundtrips build → parse for all performatives", () => {
    const builders = [
      AxonMsg.request, AxonMsg.query, AxonMsg.inform, AxonMsg.delegate,
      AxonMsg.merge, AxonMsg.confirm, AxonMsg.reject, AxonMsg.error,
      AxonMsg.complete, AxonMsg.retry, AxonMsg.urgent,
    ];
    for (const builder of builders) {
      const built = builder().to("test").payload("data").build();
      const parsed = AxonMsg.parse(built);
      expect(parsed.agent).toBe("test");
      expect(parsed.payload).toBe("data");
    }
  });

  it("roundtrips with context", () => {
    const built = AxonMsg.error().payload("timeout").context("30s").build();
    const parsed = AxonMsg.parse(built);
    expect(parsed.performative).toBe("ERROR");
    expect(parsed.payload).toBe("timeout");
    expect(parsed.context).toBe("30s");
  });
});
