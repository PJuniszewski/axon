import React, { useState } from "react";
import { encode } from "@axon/codec";
import type { CompressionResult } from "@axon/core";
import { PRESETS } from "../data/presets";

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "20px" },
  presets: { display: "flex", gap: "8px", flexWrap: "wrap" },
  presetBtn: {
    padding: "6px 12px",
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    transition: "background 0.2s",
  },
  panels: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  panel: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "16px",
  },
  label: { fontSize: "12px", color: "#8b949e", marginBottom: "8px", display: "block" },
  textarea: {
    width: "100%",
    minHeight: "120px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "4px",
    color: "#c9d1d9",
    fontFamily: "inherit",
    fontSize: "13px",
    padding: "12px",
    resize: "vertical",
    boxSizing: "border-box" as const,
  },
  output: {
    width: "100%",
    minHeight: "120px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "4px",
    color: "#7ee787",
    fontFamily: "inherit",
    fontSize: "13px",
    padding: "12px",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  },
  statsBar: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
    padding: "12px 16px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
  },
  stat: { display: "flex", flexDirection: "column" as const, alignItems: "center" },
  statValue: { fontSize: "24px", fontWeight: 700, color: "#58a6ff" },
  statLabel: { fontSize: "11px", color: "#8b949e" },
  tokenBar: { flex: 1, display: "flex", flexDirection: "column" as const, gap: "4px" },
  bar: {
    height: "8px",
    borderRadius: "4px",
    transition: "width 0.5s ease",
  },
  symbolList: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    padding: "8px 0",
  },
  symbolTag: {
    padding: "2px 8px",
    background: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#fbbf24",
  },
};

export function Encoder() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CompressionResult | null>(null);

  function handleEncode(text: string) {
    setInput(text);
    if (text.trim()) {
      setResult(encode(text));
    } else {
      setResult(null);
    }
  }

  return (
    <div style={styles.container}>
      <div>
        <span style={styles.label}>Presets</span>
        <div style={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              style={styles.presetBtn}
              onClick={() => handleEncode(p.natural)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.panels}>
        <div style={styles.panel}>
          <span style={styles.label}>Natural Language Input</span>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => handleEncode(e.target.value)}
            placeholder="Type or select a preset..."
          />
        </div>
        <div style={styles.panel}>
          <span style={styles.label}>AXON Encoded Output</span>
          <div style={styles.output}>{result?.encoded ?? ""}</div>
        </div>
      </div>

      {result && (
        <>
          <div style={styles.statsBar}>
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: "#f85149" }}>
                {result.nlTokens}
              </span>
              <span style={styles.statLabel}>NL Tokens</span>
            </div>

            <div style={styles.tokenBar}>
              <div
                style={{
                  ...styles.bar,
                  width: "100%",
                  background: "#f85149",
                }}
              />
              <div
                style={{
                  ...styles.bar,
                  width: `${100 - result.reductionPct}%`,
                  background: "#7ee787",
                }}
              />
            </div>

            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: "#7ee787" }}>
                {result.axonTokens}
              </span>
              <span style={styles.statLabel}>AXON Tokens</span>
            </div>

            <div style={styles.stat}>
              <span style={styles.statValue}>{result.reductionPct}%</span>
              <span style={styles.statLabel}>Reduction</span>
            </div>
          </div>

          {result.symbols.length > 0 && (
            <div>
              <span style={styles.label}>Symbols Used</span>
              <div style={styles.symbolList}>
                {result.symbols.map((s) => (
                  <span key={s.name} style={styles.symbolTag}>
                    {s.symbol} {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
