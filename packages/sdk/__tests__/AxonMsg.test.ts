import { describe, it, expect } from "vitest";
import { AxonMsg } from "../src/AxonMsg.js";

describe("AxonMsg builder", () => {
  it("builds a request message", () => {
    const msg = AxonMsg.request().to("orch").payload("test").build();
    expect(msg).toBe("!@orch ⟦test⟧");
  });

  it("builds a request with payload and context", () => {
    const msg = AxonMsg.request()
      .to("orch")
      .payload("rev PR#42 | ?tst.∀pass → ∑rpt")
      .build();
    expect(msg).toBe("!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧");
  });

  it("builds a query message", () => {
    const msg = AxonMsg.query().to("db").payload("status").build();
    expect(msg).toBe("?@db ⟦status⟧");
  });

  it("builds a complete message", () => {
    const msg = AxonMsg.complete().payload("svc#12:run ∧ health:pass ∧ ⊗:∅").build();
    expect(msg).toBe("∎ ⟦svc#12:run ∧ health:pass ∧ ⊗:∅⟧");
  });

  it("builds a delegate message", () => {
    const msg = AxonMsg.delegate()
      .to("code-rev")
      .payload("diff.sec ∧ std.check → assess.struct")
      .build();
    expect(msg).toBe("→@code-rev ⟦diff.sec ∧ std.check → assess.struct⟧");
  });

  it("builds an error message with context", () => {
    const msg = AxonMsg.error()
      .payload("pay.svc:timeout")
      .context("30s")
      .build();
    expect(msg).toBe("⊗ ⟦pay.svc:timeout⟧ ⟨30s⟩");
  });

  it("builds a confirm message (no payload)", () => {
    const msg = AxonMsg.confirm().build();
    expect(msg).toBe("✓");
  });

  it("builds an urgent message", () => {
    const msg = AxonMsg.urgent().payload("db.conn:fail").build();
    expect(msg).toBe("⚡ ⟦db.conn:fail⟧");
  });

  it("builds with .urgent() modifier", () => {
    const msg = AxonMsg.request().to("orch").payload("test").urgent().build();
    expect(msg).toBe("⚡@orch ⟦test⟧");
  });

  it("builds all performative types", () => {
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

describe("AxonMsg.parse", () => {
  it("parses a request with agent and payload", () => {
    const parsed = AxonMsg.parse("!@orch ⟦rev PR#42⟧");
    expect(parsed.performative).toBe("REQUEST");
    expect(parsed.agent).toBe("orch");
    expect(parsed.payload).toBe("rev PR#42");
  });

  it("roundtrips build → parse", () => {
    const built = AxonMsg.request().to("orch").payload("test").build();
    const parsed = AxonMsg.parse(built);
    expect(parsed.performative).toBe("REQUEST");
    expect(parsed.agent).toBe("orch");
    expect(parsed.payload).toBe("test");
  });
});
