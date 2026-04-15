import { describe, it, expect } from "vitest";
import { parseAxon, formatAxon } from "../src/grammar.js";

describe("parseAxon", () => {
  it("parses PR Review preset", () => {
    const msg = parseAxon("!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧");
    expect(msg.performative).toBe("REQUEST");
    expect(msg.agent).toBe("orch");
    expect(msg.payload).toBe("rev PR#42 | ?tst.∀pass → ∑rpt");
    expect(msg.context).toBeUndefined();
  });

  it("parses Data Pipeline preset", () => {
    const msg = parseAxon("!⟦db.fetch ⊂{status:pending ∧ age≤30} | valid.pipe → ⊗.rpt⟧");
    expect(msg.performative).toBe("REQUEST");
    expect(msg.agent).toBeUndefined();
    expect(msg.payload).toBe("db.fetch ⊂{status:pending ∧ age≤30} | valid.pipe → ⊗.rpt");
  });

  it("parses Task Complete preset", () => {
    const msg = parseAxon("∎ depl ⟦svc#12:run ∧ health:pass ∧ ⊗:∅⟧");
    expect(msg.performative).toBe("COMPLETE");
    expect(msg.payload).toBe("svc#12:run ∧ health:pass ∧ ⊗:∅");
  });

  it("parses Delegation preset", () => {
    const msg = parseAxon("→@code-rev ⟦diff.sec ∧ std.check → assess.struct⟧");
    expect(msg.performative).toBe("DELEGATE");
    expect(msg.agent).toBe("code-rev");
    expect(msg.payload).toBe("diff.sec ∧ std.check → assess.struct");
  });

  it("parses Error Recovery preset", () => {
    const msg = parseAxon("⊗ pay.svc:timeout⟨30s⟩ → ⟳ backoff:exp");
    expect(msg.performative).toBe("ERROR");
    expect(msg.context).toBe("30s");
  });

  it("parses Multi-Agent Fan-Out preset", () => {
    const msg = parseAxon("!@∀workers ⊞⟦scrape.top10⊂keywords | extract.struct⟧ → @orch ∑rpt");
    expect(msg.performative).toBe("REQUEST");
    expect(msg.agent).toBe("∀workers");
    expect(msg.payload).toBe("scrape.top10⊂keywords | extract.struct");
  });

  it("throws on empty message", () => {
    expect(() => parseAxon("")).toThrow("Cannot parse empty AXON message");
  });

  it("throws on missing intent symbol", () => {
    expect(() => parseAxon("hello world")).toThrow("No valid intent symbol");
  });

  it("parses message with context only", () => {
    const msg = parseAxon("? ⟨session:abc123⟩");
    expect(msg.performative).toBe("QUERY");
    expect(msg.context).toBe("session:abc123");
  });

  it("parses minimal message (intent only)", () => {
    const msg = parseAxon("✓");
    expect(msg.performative).toBe("CONFIRM");
    expect(msg.agent).toBeUndefined();
    expect(msg.payload).toBeUndefined();
    expect(msg.context).toBeUndefined();
  });
});

describe("formatAxon", () => {
  it("formats a full message", () => {
    const result = formatAxon({
      performative: "REQUEST",
      agent: "orch",
      payload: "rev PR#42",
      raw: "",
    });
    expect(result).toBe("!@orch ⟦rev PR#42⟧");
  });

  it("formats without agent", () => {
    const result = formatAxon({
      performative: "COMPLETE",
      payload: "done",
      raw: "",
    });
    expect(result).toBe("∎ ⟦done⟧");
  });

  it("formats with context", () => {
    const result = formatAxon({
      performative: "ERROR",
      payload: "timeout",
      context: "30s",
      raw: "",
    });
    expect(result).toBe("⊗ ⟦timeout⟧ ⟨30s⟩");
  });

  it("formats intent only", () => {
    const result = formatAxon({
      performative: "CONFIRM",
      raw: "",
    });
    expect(result).toBe("✓");
  });

  it("throws on unknown performative", () => {
    expect(() =>
      formatAxon({ performative: "UNKNOWN" as any, raw: "" })
    ).toThrow("Unknown performative type");
  });
});

describe("roundtrip", () => {
  const cases = [
    "!@orch ⟦rev PR#42⟧",
    "?@db ⟦status⟧",
    "✓ ⟦accepted⟧",
    "⊗ ⟦timeout⟧ ⟨30s⟩",
    "→@worker ⟦task.run⟧",
  ];

  for (const original of cases) {
    it(`roundtrips: ${original}`, () => {
      const parsed = parseAxon(original);
      const formatted = formatAxon(parsed);
      expect(formatted).toBe(original);
    });
  }
});
