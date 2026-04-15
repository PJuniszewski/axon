import React, { useState } from "react";
import { encode } from "@axon/codec";
import { BENCHMARK_SUITE } from "../data/presets";
import type { CompressionResult } from "@axon/core";

interface BenchmarkResult {
  id: string;
  category: string;
  natural: string;
  encoded: string;
  nlTokens: number;
  axonTokens: number;
  reductionPct: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "16px" },
  controls: { display: "flex", gap: "12px", alignItems: "center" },
  runBtn: {
    padding: "8px 20px",
    background: "#238636",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
  },
  exportBtn: {
    padding: "8px 20px",
    background: "#21262d",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "12px",
  },
  th: {
    padding: "10px 12px",
    background: "#161b22",
    border: "1px solid #30363d",
    color: "#8b949e",
    textAlign: "left" as const,
    fontWeight: 600,
  },
  td: {
    padding: "8px 12px",
    border: "1px solid #21262d",
    verticalAlign: "top" as const,
  },
  summary: {
    display: "flex",
    gap: "32px",
    padding: "16px 24px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
  },
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  statValue: { fontSize: "24px", fontWeight: 700 },
  statLabel: { fontSize: "11px", color: "#8b949e" },
};

function reductionColor(pct: number): string {
  if (pct >= 60) return "#7ee787";
  if (pct >= 50) return "#58a6ff";
  if (pct >= 40) return "#d29922";
  return "#f85149";
}

export function Benchmark() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);

  function runBenchmark() {
    const r = BENCHMARK_SUITE.map((c) => {
      const result = encode(c.natural);
      return {
        id: c.id,
        category: c.category,
        natural: c.natural,
        encoded: result.encoded,
        nlTokens: result.nlTokens,
        axonTokens: result.axonTokens,
        reductionPct: result.reductionPct,
      };
    });
    setResults(r);
  }

  function exportCSV() {
    const header = "ID,Category,NL Tokens,AXON Tokens,Reduction %,Natural,Encoded\n";
    const rows = results
      .map(
        (r) =>
          `${r.id},${r.category},${r.nlTokens},${r.axonTokens},${r.reductionPct},"${r.natural.replace(/"/g, '""')}","${r.encoded.replace(/"/g, '""')}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "axon-benchmark.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const avg =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.reductionPct, 0) / results.length)
      : 0;
  const best = results.length > 0 ? Math.max(...results.map((r) => r.reductionPct)) : 0;
  const worst = results.length > 0 ? Math.min(...results.map((r) => r.reductionPct)) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <button style={styles.runBtn} onClick={runBenchmark}>
          Run Benchmark ({BENCHMARK_SUITE.length} cases)
        </button>
        {results.length > 0 && (
          <button style={styles.exportBtn} onClick={exportCSV}>
            Export CSV
          </button>
        )}
      </div>

      {results.length > 0 && (
        <>
          <div style={styles.summary}>
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: reductionColor(avg) }}>
                {avg}%
              </span>
              <span style={styles.statLabel}>Average Reduction</span>
            </div>
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: "#7ee787" }}>{best}%</span>
              <span style={styles.statLabel}>Best Case</span>
            </div>
            <div style={styles.stat}>
              <span style={{ ...styles.statValue, color: reductionColor(worst) }}>
                {worst}%
              </span>
              <span style={styles.statLabel}>Worst Case</span>
            </div>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>NL Tokens</th>
                <th style={styles.th}>AXON Tokens</th>
                <th style={styles.th}>Reduction</th>
                <th style={styles.th}>Encoded</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td style={styles.td}>{r.id}</td>
                  <td style={styles.td}>{r.category}</td>
                  <td style={styles.td}>{r.nlTokens}</td>
                  <td style={styles.td}>{r.axonTokens}</td>
                  <td
                    style={{
                      ...styles.td,
                      color: reductionColor(r.reductionPct),
                      fontWeight: 600,
                    }}
                  >
                    {r.reductionPct}%
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      color: "#7ee787",
                      maxWidth: "400px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {r.encoded}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
