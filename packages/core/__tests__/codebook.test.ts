import { describe, it, expect } from "vitest";
import {
  CODEBOOK,
  SYMBOL_MAP,
  NAME_MAP,
  INTENT_SYMBOL_TO_PERFORMATIVE,
  PERFORMATIVE_TO_SYMBOL,
} from "../src/codebook.js";
import type { SymbolCategory } from "../src/types.js";

describe("CODEBOOK", () => {
  it("has exactly 31 symbols", () => {
    expect(CODEBOOK.length).toBe(31);
  });

  it("has no duplicate symbols", () => {
    const symbols = CODEBOOK.map((s) => s.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("has no duplicate names", () => {
    const names = CODEBOOK.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("covers all four categories with correct counts", () => {
    const byCat = (c: SymbolCategory) => CODEBOOK.filter((s) => s.category === c);
    expect(byCat("intent").length).toBe(11);
    expect(byCat("structure").length).toBe(8);
    expect(byCat("logic").length).toBe(7);
    expect(byCat("domain").length).toBe(5);
  });

  it("only contains valid categories", () => {
    const valid: SymbolCategory[] = ["intent", "structure", "logic", "domain"];
    for (const s of CODEBOOK) {
      expect(valid).toContain(s.category);
    }
  });

  it("every entry has non-empty required fields", () => {
    for (const s of CODEBOOK) {
      expect(typeof s.symbol).toBe("string");
      expect(s.symbol.length).toBeGreaterThan(0);
      expect(typeof s.name).toBe("string");
      expect(s.name.length).toBeGreaterThan(0);
      expect(typeof s.desc).toBe("string");
      expect(s.desc.length).toBeGreaterThan(0);
    }
  });

  it("all names are UPPER_SNAKE_CASE", () => {
    for (const s of CODEBOOK) {
      expect(s.name).toMatch(/^[A-Z][A-Z_]*$/);
    }
  });

  it("tokenHint is 1 for all entries that define it", () => {
    for (const s of CODEBOOK) {
      if (s.tokenHint !== undefined) {
        expect(s.tokenHint).toBe(1);
      }
    }
  });

  it("intent symbols are all single characters (or single codepoints)", () => {
    const intents = CODEBOOK.filter((s) => s.category === "intent");
    for (const s of intents) {
      expect([...s.symbol].length).toBe(1);
    }
  });

  it("contains the exact 11 intent names from the spec", () => {
    const intentNames = CODEBOOK
      .filter((s) => s.category === "intent")
      .map((s) => s.name)
      .sort();
    expect(intentNames).toEqual([
      "COMPLETE", "CONFIRM", "DELEGATE", "ERROR", "INFORM",
      "MERGE", "QUERY", "REJECT", "REQUEST", "RETRY", "URGENT",
    ]);
  });
});

describe("SYMBOL_MAP", () => {
  it("has same size as CODEBOOK", () => {
    expect(SYMBOL_MAP.size).toBe(CODEBOOK.length);
  });

  it("looks up every codebook entry correctly", () => {
    for (const entry of CODEBOOK) {
      const found = SYMBOL_MAP.get(entry.symbol);
      expect(found).toBeDefined();
      expect(found!.name).toBe(entry.name);
      expect(found!.desc).toBe(entry.desc);
      expect(found!.category).toBe(entry.category);
    }
  });

  it("returns undefined for non-existent symbols", () => {
    expect(SYMBOL_MAP.get("$")).toBeUndefined();
    expect(SYMBOL_MAP.get("")).toBeUndefined();
    expect(SYMBOL_MAP.get("NONEXISTENT")).toBeUndefined();
    expect(SYMBOL_MAP.get("abc")).toBeUndefined();
  });
});

describe("NAME_MAP", () => {
  it("has same size as CODEBOOK", () => {
    expect(NAME_MAP.size).toBe(CODEBOOK.length);
  });

  it("looks up every codebook entry by name correctly", () => {
    for (const entry of CODEBOOK) {
      const found = NAME_MAP.get(entry.name);
      expect(found).toBeDefined();
      expect(found!.symbol).toBe(entry.symbol);
    }
  });

  it("returns undefined for non-existent names", () => {
    expect(NAME_MAP.get("FOOBAR")).toBeUndefined();
    expect(NAME_MAP.get("")).toBeUndefined();
    expect(NAME_MAP.get("request")).toBeUndefined(); // case-sensitive
  });
});

describe("INTENT maps", () => {
  it("INTENT_SYMBOL_TO_PERFORMATIVE has exactly 11 entries", () => {
    expect(INTENT_SYMBOL_TO_PERFORMATIVE.size).toBe(11);
  });

  it("PERFORMATIVE_TO_SYMBOL has exactly 11 entries", () => {
    expect(PERFORMATIVE_TO_SYMBOL.size).toBe(11);
  });

  it("maps are exact inverses of each other", () => {
    for (const [symbol, perf] of INTENT_SYMBOL_TO_PERFORMATIVE) {
      expect(PERFORMATIVE_TO_SYMBOL.get(perf)).toBe(symbol);
    }
    for (const [perf, symbol] of PERFORMATIVE_TO_SYMBOL) {
      expect(INTENT_SYMBOL_TO_PERFORMATIVE.get(symbol)).toBe(perf);
    }
  });

  it("only contains intent-category symbols", () => {
    for (const [symbol] of INTENT_SYMBOL_TO_PERFORMATIVE) {
      const entry = SYMBOL_MAP.get(symbol);
      expect(entry).toBeDefined();
      expect(entry!.category).toBe("intent");
    }
  });

  it("non-intent symbols are not in INTENT_SYMBOL_TO_PERFORMATIVE", () => {
    const nonIntent = CODEBOOK.filter((s) => s.category !== "intent");
    for (const s of nonIntent) {
      expect(INTENT_SYMBOL_TO_PERFORMATIVE.has(s.symbol)).toBe(false);
    }
  });
});

describe("cross-map consistency", () => {
  it("SYMBOL_MAP and NAME_MAP reference identical objects", () => {
    for (const entry of CODEBOOK) {
      const bySymbol = SYMBOL_MAP.get(entry.symbol);
      const byName = NAME_MAP.get(entry.name);
      expect(bySymbol).toBe(byName);
    }
  });
});
