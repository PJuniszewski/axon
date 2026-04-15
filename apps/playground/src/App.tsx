import React, { useState } from "react";
import { Encoder } from "./components/Encoder";
import { Codebook } from "./components/Codebook";
import { Gateway } from "./components/Gateway";
import { Benchmark } from "./components/Benchmark";

const tabs = ["Encoder", "Codebook", "Gateway", "Benchmark"] as const;
type Tab = (typeof tabs)[number];

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "#c9d1d9",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontSize: "14px",
  },
  header: {
    padding: "20px 32px",
    borderBottom: "1px solid #21262d",
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#58a6ff",
    margin: 0,
  },
  subtitle: {
    fontSize: "12px",
    color: "#8b949e",
    margin: 0,
  },
  tabBar: {
    display: "flex",
    gap: "0",
    borderBottom: "1px solid #21262d",
  },
  tab: {
    padding: "12px 24px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#8b949e",
    fontFamily: "inherit",
    fontSize: "14px",
    transition: "color 0.2s, border-color 0.2s",
  },
  tabActive: {
    color: "#58a6ff",
    borderBottomColor: "#58a6ff",
  },
  content: {
    padding: "24px 32px",
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Encoder");

  return (
    <div style={styles.app}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>AXON Protocol</h1>
          <p style={styles.subtitle}>
            Agent eXchange Object Notation — token-efficient multi-agent
            communication
          </p>
        </div>
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === "Encoder" && <Encoder />}
        {activeTab === "Codebook" && <Codebook />}
        {activeTab === "Gateway" && <Gateway />}
        {activeTab === "Benchmark" && <Benchmark />}
      </div>
    </div>
  );
}
