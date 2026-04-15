import { describe, it, expect } from "vitest";
import { parseAxon, formatAxon } from "../src/grammar.js";
import { PERFORMATIVE_TO_SYMBOL, INTENT_SYMBOL_TO_PERFORMATIVE } from "../src/codebook.js";
import type { PerformativeType } from "../src/types.js";

describe("parseAxon", () => {
  describe("preset messages", () => {
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
  });

  describe("all 11 intent symbols", () => {
    const intents: Array<[string, PerformativeType]> = [
      ["!", "REQUEST"], ["?", "QUERY"], ["≡", "INFORM"],
      ["→", "DELEGATE"], ["⊕", "MERGE"], ["✓", "CONFIRM"],
      ["✗", "REJECT"], ["⊗", "ERROR"], ["∎", "COMPLETE"],
      ["⟳", "RETRY"], ["⚡", "URGENT"],
    ];

    for (const [symbol, perf] of intents) {
      it(`parses ${perf} (${symbol})`, () => {
        const msg = parseAxon(`${symbol} ⟦test⟧`);
        expect(msg.performative).toBe(perf);
        expect(msg.payload).toBe("test");
      });
    }
  });

  describe("error cases", () => {
    it("throws on empty string", () => {
      expect(() => parseAxon("")).toThrow("Cannot parse empty AXON message");
    });

    it("throws on whitespace only", () => {
      expect(() => parseAxon("   ")).toThrow("Cannot parse empty AXON message");
    });

    it("throws on missing intent symbol", () => {
      expect(() => parseAxon("hello world")).toThrow("No valid intent symbol");
    });

    it("throws on plain text", () => {
      expect(() => parseAxon("just some regular text")).toThrow("No valid intent symbol");
    });

    it("throws on number-only input", () => {
      expect(() => parseAxon("42")).toThrow("No valid intent symbol");
    });
  });

  describe("edge cases — agents", () => {
    it("parses agent with hyphens", () => {
      const msg = parseAxon("!@my-agent ⟦test⟧");
      expect(msg.agent).toBe("my-agent");
    });

    it("parses agent with numbers", () => {
      const msg = parseAxon("!@worker123 ⟦test⟧");
      expect(msg.agent).toBe("worker123");
    });

    it("parses agent with unicode (∀workers)", () => {
      const msg = parseAxon("!@∀workers ⟦test⟧");
      expect(msg.agent).toBe("∀workers");
    });

    it("does not parse @ inside payload as agent", () => {
      const msg = parseAxon("! ⟦email@test.com⟧");
      expect(msg.agent).toBeUndefined();
      expect(msg.payload).toBe("email@test.com");
    });

    it("handles agent immediately followed by payload", () => {
      const msg = parseAxon("!@orch⟦test⟧");
      expect(msg.agent).toBe("orch");
      expect(msg.payload).toBe("test");
    });
  });

  describe("edge cases — payloads", () => {
    it("parses empty payload brackets", () => {
      const msg = parseAxon("!⟦⟧");
      expect(msg.performative).toBe("REQUEST");
      expect(msg.payload).toBeUndefined(); // empty string → undefined
    });

    it("parses payload with all symbol types", () => {
      const msg = parseAxon("! ⟦∧ ∨ ∀ ∃ ∅ ≥ ≤ ⊂ ∑ ⊞ ⌛ ⌂ | : #⟧");
      expect(msg.payload).toBe("∧ ∨ ∀ ∃ ∅ ≥ ≤ ⊂ ∑ ⊞ ⌛ ⌂ | : #");
    });

    it("preserves internal whitespace", () => {
      const msg = parseAxon("! ⟦  spaces   inside  ⟧");
      expect(msg.payload).toBe("  spaces   inside  ");
    });

    it("handles very long payload", () => {
      const longPayload = "x".repeat(10000);
      const msg = parseAxon(`! ⟦${longPayload}⟧`);
      expect(msg.payload).toBe(longPayload);
      expect(msg.payload!.length).toBe(10000);
    });
  });

  describe("edge cases — context", () => {
    it("parses context only (no payload)", () => {
      const msg = parseAxon("? ⟨session:abc123⟩");
      expect(msg.performative).toBe("QUERY");
      expect(msg.context).toBe("session:abc123");
    });

    it("parses both payload and context", () => {
      const msg = parseAxon("! ⟦data⟧ ⟨timeout:30s⟩");
      expect(msg.payload).toBe("data");
      expect(msg.context).toBe("timeout:30s");
    });

    it("parses empty context brackets", () => {
      const msg = parseAxon("! ⟨⟩");
      expect(msg.context).toBeUndefined(); // empty string → undefined
    });
  });

  describe("edge cases — minimal messages", () => {
    it("parses intent only", () => {
      const msg = parseAxon("✓");
      expect(msg.performative).toBe("CONFIRM");
      expect(msg.agent).toBeUndefined();
      expect(msg.payload).toBeUndefined();
      expect(msg.context).toBeUndefined();
    });

    it("parses intent + agent only", () => {
      const msg = parseAxon("!@bot");
      expect(msg.performative).toBe("REQUEST");
      expect(msg.agent).toBe("bot");
      expect(msg.payload).toBeUndefined();
    });
  });

  describe("raw field", () => {
    it("preserves the original input", () => {
      const input = "!@orch ⟦test data⟧ ⟨ctx⟩";
      const msg = parseAxon(input);
      expect(msg.raw).toBe(input);
    });

    it("trims whitespace in raw", () => {
      const msg = parseAxon("  !@orch ⟦test⟧  ");
      expect(msg.raw).toBe("!@orch ⟦test⟧");
    });
  });
});

describe("formatAxon", () => {
  it("formats a full message with agent, payload, and context", () => {
    const result = formatAxon({
      performative: "REQUEST",
      agent: "orch",
      payload: "rev PR#42",
      context: "session:abc",
      raw: "",
    });
    expect(result).toBe("!@orch ⟦rev PR#42⟧ ⟨session:abc⟩");
  });

  it("formats without agent", () => {
    const result = formatAxon({
      performative: "COMPLETE",
      payload: "done",
      raw: "",
    });
    expect(result).toBe("∎ ⟦done⟧");
  });

  it("formats without payload", () => {
    const result = formatAxon({
      performative: "CONFIRM",
      agent: "bot",
      raw: "",
    });
    expect(result).toBe("✓@bot");
  });

  it("formats with context only", () => {
    const result = formatAxon({
      performative: "ERROR",
      context: "30s",
      raw: "",
    });
    expect(result).toBe("⊗ ⟨30s⟩");
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

  it("formats all 11 performatives", () => {
    const expected: Record<PerformativeType, string> = {
      REQUEST: "!", QUERY: "?", INFORM: "≡", DELEGATE: "→",
      MERGE: "⊕", CONFIRM: "✓", REJECT: "✗", ERROR: "⊗",
      COMPLETE: "∎", RETRY: "⟳", URGENT: "⚡",
    };
    for (const [perf, symbol] of Object.entries(expected)) {
      const result = formatAxon({ performative: perf as PerformativeType, raw: "" });
      expect(result).toBe(symbol);
    }
  });
});

describe("roundtrip consistency", () => {
  const roundtripCases = [
    "!@orch ⟦rev PR#42⟧",
    "?@db ⟦status⟧",
    "✓ ⟦accepted⟧",
    "⊗ ⟦timeout⟧ ⟨30s⟩",
    "→@worker ⟦task.run⟧",
    "⚡@ops ⟦critical⟧ ⟨now⟩",
    "∎ ⟦done⟧",
    "⟳ ⟦retry⟧",
    "⊕ ⟦merged⟧",
    "✗ ⟦denied⟧",
    "≡ ⟦update⟧",
  ];

  for (const original of roundtripCases) {
    it(`roundtrips: ${original}`, () => {
      const parsed = parseAxon(original);
      const formatted = formatAxon(parsed);
      expect(formatted).toBe(original);
    });
  }

  it("roundtrips all 11 bare intents", () => {
    for (const [perf, symbol] of PERFORMATIVE_TO_SYMBOL) {
      const formatted = formatAxon({ performative: perf, raw: "" });
      const parsed = parseAxon(formatted);
      expect(parsed.performative).toBe(perf);
    }
  });
});
