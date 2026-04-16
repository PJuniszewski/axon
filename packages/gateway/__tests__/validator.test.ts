import { describe, it, expect } from "vitest";
import { validate, isNaturalLanguage } from "../src/validator.js";

describe("validate", () => {
  it("validates Unicode AXON message", () => {
    const r = validate("! @orch ⟦rev PR#42⟧");
    expect(r.valid).toBe(true);
    expect(r.isAxon).toBe(true);
    expect(r.hasIntent).toBe(true);
    expect(r.parseable).toBe(true);
    expect(r.parsed?.performative).toBe("REQUEST");
  });

  it("validates ASCII AXON message", () => {
    const r = validate("! @orch [[rev PR#42]]");
    expect(r.valid).toBe(true);
    expect(r.parsed?.performative).toBe("REQUEST");
  });

  it("validates bare intent", () => {
    const r = validate("✓");
    expect(r.valid).toBe(true);
    expect(r.hasIntent).toBe(true);
  });

  it("validates ERR ASCII intent", () => {
    const r = validate("ERR pay.svc:T/O");
    expect(r.valid).toBe(true);
    expect(r.parsed?.performative).toBe("ERROR");
  });

  it("rejects natural language", () => {
    const r = validate("Please review the pull request");
    expect(r.valid).toBe(false);
    expect(r.fallbackToNL).toBe(true);
    expect(r.reason).toContain("natural language");
  });

  it("rejects empty message", () => {
    const r = validate("");
    expect(r.valid).toBe(false);
    expect(r.reason).toContain("empty");
  });

  it("rejects random text without intent", () => {
    const r = validate("xyz abc 123");
    expect(r.valid).toBe(false);
    expect(r.hasIntent).toBe(false);
  });

  it("flags NL fallback for polite agent output", () => {
    const r = validate("I would like to inform you that the task is complete");
    expect(r.valid).toBe(false);
    expect(r.fallbackToNL).toBe(true);
  });
});

describe("isNaturalLanguage", () => {
  it("detects NL phrases", () => {
    expect(isNaturalLanguage("Please review the code")).toBe(true);
    expect(isNaturalLanguage("I would like to request")).toBe(true);
    expect(isNaturalLanguage("Could you check the status")).toBe(true);
    expect(isNaturalLanguage("I am reporting the results")).toBe(true);
  });

  it("does not flag AXON as NL", () => {
    expect(isNaturalLanguage("! @orch [[test]]")).toBe(false);
    expect(isNaturalLanguage("ERR timeout")).toBe(false);
    expect(isNaturalLanguage("DONE depl")).toBe(false);
  });

  it("returns false for empty", () => {
    expect(isNaturalLanguage("")).toBe(false);
  });
});
