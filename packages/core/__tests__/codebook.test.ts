import { describe, it, expect } from "vitest";
import {
  CODEBOOK,
  SYMBOL_MAP,
  NAME_MAP,
  INTENT_SYMBOL_TO_PERFORMATIVE,
  PERFORMATIVE_TO_SYMBOL,
} from "../src/codebook.js";

describe("CODEBOOK", () => {
  it("has at least 30 symbols", () => {
    expect(CODEBOOK.length).toBeGreaterThanOrEqual(30);
  });

  it("has no duplicate symbols", () => {
    const symbols = CODEBOOK.map((s) => s.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("has no duplicate names", () => {
    const names = CODEBOOK.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("covers all four categories", () => {
    const categories = new Set(CODEBOOK.map((s) => s.category));
    expect(categories).toContain("intent");
    expect(categories).toContain("structure");
    expect(categories).toContain("logic");
    expect(categories).toContain("domain");
  });

  it("has 11 intent symbols", () => {
    const intents = CODEBOOK.filter((s) => s.category === "intent");
    expect(intents.length).toBe(11);
  });

  it("every entry has required fields", () => {
    for (const s of CODEBOOK) {
      expect(s.symbol).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.desc).toBeTruthy();
      expect(s.category).toBeTruthy();
    }
  });
});

describe("SYMBOL_MAP", () => {
  it("has same size as CODEBOOK", () => {
    expect(SYMBOL_MAP.size).toBe(CODEBOOK.length);
  });

  it("looks up symbols correctly", () => {
    expect(SYMBOL_MAP.get("!")?.name).toBe("REQUEST");
    expect(SYMBOL_MAP.get("?")?.name).toBe("QUERY");
    expect(SYMBOL_MAP.get("≡")?.name).toBe("INFORM");
    expect(SYMBOL_MAP.get("→")?.name).toBe("DELEGATE");
    expect(SYMBOL_MAP.get("⊗")?.name).toBe("ERROR");
    expect(SYMBOL_MAP.get("∎")?.name).toBe("COMPLETE");
    expect(SYMBOL_MAP.get("∑")?.name).toBe("AGGREGATE");
  });
});

describe("NAME_MAP", () => {
  it("has same size as CODEBOOK", () => {
    expect(NAME_MAP.size).toBe(CODEBOOK.length);
  });

  it("looks up names correctly", () => {
    expect(NAME_MAP.get("REQUEST")?.symbol).toBe("!");
    expect(NAME_MAP.get("QUERY")?.symbol).toBe("?");
    expect(NAME_MAP.get("ERROR")?.symbol).toBe("⊗");
  });
});

describe("INTENT maps", () => {
  it("INTENT_SYMBOL_TO_PERFORMATIVE has 11 entries", () => {
    expect(INTENT_SYMBOL_TO_PERFORMATIVE.size).toBe(11);
  });

  it("PERFORMATIVE_TO_SYMBOL is the inverse", () => {
    for (const [symbol, perf] of INTENT_SYMBOL_TO_PERFORMATIVE) {
      expect(PERFORMATIVE_TO_SYMBOL.get(perf)).toBe(symbol);
    }
  });
});
