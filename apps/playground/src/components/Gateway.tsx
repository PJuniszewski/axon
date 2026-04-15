import React, { useState } from "react";
import { encode } from "@axon/codec";

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", flexDirection: "column", gap: "24px" },
  flow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "32px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
  },
  node: {
    padding: "16px 24px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "8px",
    textAlign: "center" as const,
    minWidth: "120px",
  },
  nodeLabel: { fontSize: "11px", color: "#8b949e", display: "block" },
  nodeValue: { fontSize: "14px", color: "#c9d1d9", fontWeight: 600 },
  arrow: { fontSize: "24px", color: "#58a6ff" },
  gate: {
    padding: "16px 24px",
    background: "#1a2332",
    border: "2px solid #58a6ff",
    borderRadius: "8px",
    textAlign: "center" as const,
    minWidth: "120px",
  },
  demoArea: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
  },
  panel: {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
    padding: "16px",
  },
  label: { fontSize: "12px", color: "#8b949e", marginBottom: "8px", display: "block" },
  textarea: {
    width: "100%",
    minHeight: "80px",
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
    minHeight: "80px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "4px",
    fontFamily: "inherit",
    fontSize: "13px",
    padding: "12px",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
  },
  sendBtn: {
    padding: "8px 20px",
    background: "#238636",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "13px",
    marginTop: "8px",
  },
  stats: {
    display: "flex",
    gap: "24px",
    justifyContent: "center",
    padding: "16px",
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: "8px",
  },
  stat: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  statValue: { fontSize: "20px", fontWeight: 700, color: "#58a6ff" },
  statLabel: { fontSize: "11px", color: "#8b949e" },
};

export function Gateway() {
  const [input, setInput] = useState(
    "Please review the pull request and check if all tests are passing",
  );
  const [encoded, setEncoded] = useState("");
  const [decoded, setDecoded] = useState("");
  const [tokensSaved, setTokensSaved] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);

  function handleSend() {
    const result = encode(input);
    setEncoded(result.encoded);
    // Simulated decode (in real flow would go through gateway)
    setDecoded(`[Decoded] ${result.original}`);
    setTokensSaved((prev) => prev + (result.nlTokens - result.axonTokens));
    setTotalMessages((prev) => prev + 1);
  }

  return (
    <div style={styles.container}>
      <div style={styles.flow}>
        <div style={styles.node}>
          <span style={styles.nodeLabel}>Agent A</span>
          <span style={styles.nodeValue}>NL Message</span>
        </div>
        <span style={styles.arrow}>&rarr;</span>
        <div style={{ ...styles.node, color: "#f85149" }}>
          <span style={styles.nodeLabel}>Wire Format</span>
          <span style={styles.nodeValue}>[NL]</span>
        </div>
        <span style={styles.arrow}>&rarr;</span>
        <div style={styles.gate}>
          <span style={{ ...styles.nodeLabel, color: "#58a6ff" }}>AxonGate</span>
          <span style={{ ...styles.nodeValue, color: "#58a6ff" }}>Encode/Decode</span>
        </div>
        <span style={styles.arrow}>&rarr;</span>
        <div style={{ ...styles.node, color: "#7ee787" }}>
          <span style={styles.nodeLabel}>Wire Format</span>
          <span style={styles.nodeValue}>[AXON]</span>
        </div>
        <span style={styles.arrow}>&rarr;</span>
        <div style={styles.node}>
          <span style={styles.nodeLabel}>Agent B</span>
          <span style={styles.nodeValue}>NL Message</span>
        </div>
      </div>

      <div style={styles.demoArea}>
        <div style={styles.panel}>
          <span style={styles.label}>Agent A (NL Input)</span>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button style={styles.sendBtn} onClick={handleSend}>
            Send via AxonGate
          </button>
        </div>

        <div style={styles.panel}>
          <span style={styles.label}>Wire (AXON Encoded)</span>
          <div style={{ ...styles.output, color: "#7ee787" }}>{encoded}</div>
        </div>

        <div style={styles.panel}>
          <span style={styles.label}>Agent B (Decoded)</span>
          <div style={{ ...styles.output, color: "#c9d1d9" }}>{decoded}</div>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{totalMessages}</span>
          <span style={styles.statLabel}>Messages Proxied</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statValue, color: "#7ee787" }}>{tokensSaved}</span>
          <span style={styles.statLabel}>Tokens Saved</span>
        </div>
      </div>
    </div>
  );
}
