import React, { useState } from "react";
import { CODEBOOK } from "@axon/core";
import type { SymbolCategory } from "@axon/core";

const CATEGORIES: SymbolCategory[] = ["intent", "structure", "logic", "domain"];

const categoryColors: Record<SymbolCategory, string> = {
  intent: "#f97316",
  structure: "#3b82f6",
  logic: "#a855f7",
  domain: "#22c55e",
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "16px" },
  filters: { display: "flex", gap: "8px", alignItems: "center" },
  filterBtn: {
    padding: "6px 14px",
    border: "1px solid #30363d",
    borderRadius: "16px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    transition: "all 0.2s",
    background: "#21262d",
    color: "#c9d1d9",
  },
  searchInput: {
    padding: "8px 12px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    fontFamily: "inherit",
    fontSize: "13px",
    flex: 1,
    maxWidth: "300px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
  },
  card: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  symbol: { fontSize: "32px", lineHeight: 1 },
  name: { fontSize: "13px", fontWeight: 600, color: "#c9d1d9" },
  desc: { fontSize: "12px", color: "#8b949e" },
  badge: {
    fontSize: "10px",
    padding: "2px 8px",
    borderRadius: "10px",
    alignSelf: "flex-start",
    fontWeight: 600,
  },
};

export function Codebook() {
  const [filter, setFilter] = useState<SymbolCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = CODEBOOK.filter((s) => {
    if (filter !== "all" && s.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.symbol.includes(q)
      );
    }
    return true;
  });

  return (
    <div style={styles.container}>
      <div style={styles.filters}>
        <button
          style={{
            ...styles.filterBtn,
            ...(filter === "all"
              ? { background: "#58a6ff", color: "#0d1117", borderColor: "#58a6ff" }
              : {}),
          }}
          onClick={() => setFilter("all")}
        >
          All ({CODEBOOK.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = CODEBOOK.filter((s) => s.category === cat).length;
          return (
            <button
              key={cat}
              style={{
                ...styles.filterBtn,
                ...(filter === cat
                  ? {
                      background: categoryColors[cat],
                      color: "#0d1117",
                      borderColor: categoryColors[cat],
                    }
                  : {}),
              }}
              onClick={() => setFilter(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
        <input
          style={styles.searchInput}
          placeholder="Search symbols..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={styles.grid}>
        {filtered.map((s) => (
          <div key={s.symbol} style={styles.card}>
            <span style={styles.symbol}>{s.symbol}</span>
            <span style={styles.name}>{s.name}</span>
            <span style={styles.desc}>{s.desc}</span>
            <span
              style={{
                ...styles.badge,
                background: `${categoryColors[s.category]}20`,
                color: categoryColors[s.category],
              }}
            >
              {s.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
