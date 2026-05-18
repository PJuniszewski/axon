/**
 * Trace Explorer demo generator.
 *
 * Generates 1000 synthetic multi-agent conversations across 10 agents,
 * encodes each message via the AXON rule-based encoder, and produces
 * a single self-contained HTML file with:
 *   - Inter-agent force-directed graph (D3)
 *   - Intent distribution histogram
 *   - Conversation timeline (filterable)
 *   - Per-message drill-down: AXON twin ↔ NL original
 *
 * Output: apps/demo/dist/trace-explorer.html
 *
 * Run: pnpm tsx apps/demo/generate.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { encode } from "@axon/codec";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AGENTS = [
  "orchestrator",
  "sre-agent",
  "security-agent",
  "code-review",
  "deploy-agent",
  "monitor",
  "db-admin",
  "qa-agent",
  "infra-team",
  "data-pipeline",
] as const;
type Agent = (typeof AGENTS)[number];

// ── Scenario templates ────────────────────────────────────────────────
// Each scenario yields a sequence of {from, to, nl} messages.
// Placeholders {svc}, {n}, {id} etc. are filled in randomly per run.

interface MessageTemplate {
  from: Agent;
  to: Agent | "broadcast";
  nl: string;
}

interface Scenario {
  name: string;
  category: string;
  produce: (vars: Vars) => MessageTemplate[];
}

interface Vars {
  svc: string;
  prNum: number;
  ticketId: string;
  region: string;
  version: string;
  pct: number;
  count: number;
  errCount: number;
  duration: number;
  threshold: number;
  user: string;
  envName: string;
  jobId: string;
  table: string;
  rows: number;
  timeUtc: string;
}

const SERVICES = ["payment-svc", "auth-svc", "inventory-svc", "user-svc", "billing-svc", "search-svc", "notification-svc", "analytics-svc"];
const REGIONS = ["us-east-1", "eu-west-1", "ap-southeast-2", "us-west-2", "eu-central-1"];
const ENVS = ["staging", "production", "canary", "dev"];
const TABLES = ["orders", "users", "events", "transactions", "logs", "sessions"];
const VERSIONS = ["2.4.1", "3.0.7", "1.12.5", "4.2.0", "2.9.3", "5.0.0-rc1"];

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndFloat = (min: number, max: number, dp = 1) => +(Math.random() * (max - min) + min).toFixed(dp);

function genVars(): Vars {
  return {
    svc: pick(SERVICES),
    prNum: rnd(100, 9999),
    ticketId: `INC-${rnd(1000, 99999)}`,
    region: pick(REGIONS),
    version: pick(VERSIONS),
    pct: rndFloat(0.1, 25),
    count: rnd(2, 50),
    errCount: rnd(1, 15),
    duration: rnd(2, 300),
    threshold: rnd(50, 500),
    user: `u-${rnd(10000, 99999)}`,
    envName: pick(ENVS),
    jobId: `job-${rnd(100, 9999)}`,
    table: pick(TABLES),
    rows: rnd(1000, 5000000),
    timeUtc: `${String(rnd(0, 23)).padStart(2, "0")}:${String(rnd(0, 59)).padStart(2, "0")}`,
  };
}

const SCENARIOS: Scenario[] = [
  {
    name: "incident-response",
    category: "incident",
    produce: (v) => [
      { from: "monitor", to: "broadcast", nl: `Alert: ${v.svc} returning 5xx errors at ${v.timeUtc} UTC. Error rate ${v.pct} percent.` },
      { from: "orchestrator", to: "sre-agent", nl: `Please diagnose the ${v.svc} alert. Priority P1. Ticket ${v.ticketId}.` },
      { from: "sre-agent", to: "orchestrator", nl: `Investigating ${v.svc}. Initial check shows db connection pool at ${rnd(80, 99)} of 100 connections.` },
      { from: "sre-agent", to: "orchestrator", nl: `Hypothesis: leak introduced in PR ${v.prNum} merged at ${v.timeUtc} UTC.` },
      { from: "orchestrator", to: "deploy-agent", nl: `Approving rollback of PR ${v.prNum}. Target version ${v.version}.` },
      { from: "deploy-agent", to: "orchestrator", nl: `Rolling back ${v.svc} to ${v.version}. Estimated ${v.duration / 10 | 0} minutes for full cluster restart.` },
      { from: "deploy-agent", to: "broadcast", nl: `Rollback complete. All ${v.count} pods restarted on ${v.version}.` },
      { from: "monitor", to: "orchestrator", nl: `Error rate dropped to ${rndFloat(0, 1)} percent. Ticket ${v.ticketId} resolved.` },
    ],
  },
  {
    name: "pr-review",
    category: "code-review",
    produce: (v) => [
      { from: "orchestrator", to: "code-review", nl: `Please review pull request ${v.prNum} submitted to main. Ensure all tests pass before approval.` },
      { from: "code-review", to: "security-agent", nl: `Delegating security audit of PR ${v.prNum}. Flag any high or critical findings.` },
      { from: "security-agent", to: "code-review", nl: `Security audit complete. Found ${rnd(0, 3)} medium severity issues, no high or critical.` },
      { from: "code-review", to: "qa-agent", nl: `Requesting QA verification. Run regression suite against PR ${v.prNum} build.` },
      { from: "qa-agent", to: "code-review", nl: `QA complete. ${rnd(40, 200)} of ${rnd(50, 250)} tests passed. ${rnd(0, 5)} failed.` },
      { from: "code-review", to: "orchestrator", nl: `Approved PR ${v.prNum} for merge. All checks passed.` },
    ],
  },
  {
    name: "deployment",
    category: "deployment",
    produce: (v) => [
      { from: "orchestrator", to: "deploy-agent", nl: `Initiate deployment of ${v.svc} version ${v.version} to ${v.envName} environment.` },
      { from: "deploy-agent", to: "infra-team", nl: `Request capacity check for ${v.svc} ${v.version} rollout. Expected ${v.count} pods.` },
      { from: "infra-team", to: "deploy-agent", nl: `Capacity confirmed. ${v.count} pod allocation approved in ${v.region}.` },
      { from: "deploy-agent", to: "monitor", nl: `Starting canary deployment. Monitor error rates and latency for ${v.duration} seconds.` },
      { from: "monitor", to: "deploy-agent", nl: `Canary metrics nominal. Error rate ${rndFloat(0, 0.5)} percent. P95 latency ${rnd(50, 200)}ms.` },
      { from: "deploy-agent", to: "orchestrator", nl: `Deployment complete. ${v.svc} ${v.version} live in ${v.envName}. ${v.count} pods running.` },
    ],
  },
  {
    name: "etl-pipeline",
    category: "data",
    produce: (v) => [
      { from: "orchestrator", to: "data-pipeline", nl: `Start nightly ETL ${v.jobId}. Source: ${v.table} replica. Target: warehouse.` },
      { from: "data-pipeline", to: "db-admin", nl: `Extracting ${v.rows} rows from ${v.table}. Estimated ${v.duration} seconds.` },
      { from: "db-admin", to: "data-pipeline", nl: `Extraction complete. ${v.rows} rows ready. ${v.errCount} corrupt records skipped.` },
      { from: "data-pipeline", to: "qa-agent", nl: `Run schema validation on ${v.rows} extracted rows from ${v.table}.` },
      { from: "qa-agent", to: "data-pipeline", nl: `Validation passed. ${rnd(5, 30)} rows flagged for manual review.` },
      { from: "data-pipeline", to: "orchestrator", nl: `ETL ${v.jobId} complete. ${v.rows} rows loaded into warehouse fact_${v.table}.` },
    ],
  },
  {
    name: "security-audit",
    category: "security",
    produce: (v) => [
      { from: "orchestrator", to: "security-agent", nl: `Run quarterly security audit on ${v.svc}. Severity threshold for blocking: high.` },
      { from: "security-agent", to: "code-review", nl: `Audit found ${rnd(1, 5)} findings in ${v.svc}. Need code review to confirm impact.` },
      { from: "code-review", to: "security-agent", nl: `Confirmed ${rnd(0, 2)} findings as high severity. Rest are medium or low.` },
      { from: "security-agent", to: "orchestrator", nl: `Audit ${v.ticketId} complete. Blocking on high findings. Notification sent to dev-team.` },
    ],
  },
  {
    name: "db-migration",
    category: "data",
    produce: (v) => [
      { from: "orchestrator", to: "db-admin", nl: `Apply migration ${v.jobId} on ${v.table} table in ${v.envName}.` },
      { from: "db-admin", to: "qa-agent", nl: `Pre-migration validation: confirm ${v.rows} rows in ${v.table} match expected count.` },
      { from: "qa-agent", to: "db-admin", nl: `Row count verified. Schema matches expected pre-migration state.` },
      { from: "db-admin", to: "orchestrator", nl: `Migration applied successfully in ${v.duration} seconds. ${v.rows} rows migrated.` },
      { from: "db-admin", to: "monitor", nl: `Monitor ${v.table} query latency for ${v.duration} seconds post-migration.` },
    ],
  },
  {
    name: "scale-event",
    category: "infrastructure",
    produce: (v) => [
      { from: "monitor", to: "orchestrator", nl: `Traffic spike detected on ${v.svc}: ${v.threshold * 10} requests per second in ${v.region}.` },
      { from: "orchestrator", to: "infra-team", nl: `Request scale-out for ${v.svc} in ${v.region}. Need ${v.count} additional pods.` },
      { from: "infra-team", to: "orchestrator", nl: `Scaling ${v.svc} from ${v.count - 2} to ${v.count + v.count} pods. ETA ${rnd(2, 10)} minutes.` },
      { from: "infra-team", to: "monitor", nl: `Scale-out complete. Verify error rate stays below ${rndFloat(0.5, 2)} percent.` },
      { from: "monitor", to: "orchestrator", nl: `Metrics stable. ${v.svc} now handling ${v.threshold * 12} rps with ${rnd(60, 120)}ms latency.` },
    ],
  },
  {
    name: "rate-limit-event",
    category: "incident",
    produce: (v) => [
      { from: "monitor", to: "broadcast", nl: `Rate limit threshold reached for user ${v.user} on ${v.svc}: ${v.threshold * 2} requests per minute.` },
      { from: "orchestrator", to: "security-agent", nl: `Investigate rate limit hit for ${v.user}. Check for abuse patterns.` },
      { from: "security-agent", to: "orchestrator", nl: `${v.user} shows legitimate traffic spike. Recommend quota increase.` },
      { from: "orchestrator", to: "infra-team", nl: `Raise quota for ${v.user} on ${v.svc} from ${v.threshold * 2} to ${v.threshold * 4} per minute.` },
      { from: "infra-team", to: "orchestrator", nl: `Quota updated. ${v.user} on ${v.svc} now permits ${v.threshold * 4} rpm.` },
    ],
  },
  {
    name: "failed-deployment-retry",
    category: "deployment",
    produce: (v) => [
      { from: "deploy-agent", to: "orchestrator", nl: `Deployment of ${v.svc} ${v.version} failed: readiness probe timeout after ${v.duration} seconds.` },
      { from: "orchestrator", to: "sre-agent", nl: `Diagnose failed deployment ${v.svc} ${v.version}. Ticket ${v.ticketId}.` },
      { from: "sre-agent", to: "orchestrator", nl: `Identified missing config in ${v.envName}. Retry deployment after config fix.` },
      { from: "orchestrator", to: "deploy-agent", nl: `Retry deployment of ${v.svc} ${v.version} to ${v.envName}. Config fix applied.` },
      { from: "deploy-agent", to: "orchestrator", nl: `Retry succeeded. ${v.svc} ${v.version} live with ${v.count} pods.` },
    ],
  },
  {
    name: "health-check-sweep",
    category: "monitoring",
    produce: (v) => [
      { from: "orchestrator", to: "monitor", nl: `Run health check sweep across all services in ${v.region}.` },
      { from: "monitor", to: "orchestrator", nl: `Health check complete: ${rnd(8, 12)} of ${rnd(10, 14)} services healthy. ${v.svc} degraded.` },
      { from: "orchestrator", to: "sre-agent", nl: `Triage ${v.svc} health degradation in ${v.region}. Ticket ${v.ticketId}.` },
      { from: "sre-agent", to: "orchestrator", nl: `${v.svc} elevated latency due to slow downstream. No user impact yet.` },
    ],
  },
  {
    name: "query-status",
    category: "query",
    produce: (v) => [
      { from: "orchestrator", to: "monitor", nl: `What is the current status of ${v.svc} in ${v.region}?` },
      { from: "monitor", to: "orchestrator", nl: `${v.svc} in ${v.region}: ${v.count} pods running, error rate ${rndFloat(0, 1)} percent, latency ${rnd(50, 150)}ms.` },
    ],
  },
  {
    name: "urgent-escalation",
    category: "incident",
    produce: (v) => [
      { from: "monitor", to: "broadcast", nl: `URGENT: ${v.svc} primary load balancer unresponsive. All traffic in ${v.region} affected.` },
      { from: "orchestrator", to: "infra-team", nl: `Critical: ${v.svc} LB down in ${v.region}. Failover immediately. Ticket ${v.ticketId}.` },
      { from: "infra-team", to: "orchestrator", nl: `Failing over ${v.svc} traffic from ${v.region} to standby. ETA ${rnd(2, 8)} minutes.` },
      { from: "infra-team", to: "monitor", nl: `Failover complete. Traffic now routed through standby. Verify health.` },
      { from: "monitor", to: "orchestrator", nl: `Standby healthy. ${v.svc} serving traffic with ${rnd(80, 150)}ms latency. Ticket ${v.ticketId} resolved.` },
    ],
  },
];

// ── Generate dataset ──────────────────────────────────────────────────

interface Message {
  ts: number;
  from: Agent;
  to: Agent | "broadcast";
  nl: string;
  axon: string;
  intent: string;
}

interface Conversation {
  id: string;
  scenario: string;
  category: string;
  startTs: number;
  messages: Message[];
}

const INTENT_FROM_SYMBOL: Record<string, string> = {
  "!": "REQUEST", "?": "QUERY", "≡": "INFORM", "→": "DELEGATE",
  "⊕": "MERGE", "✓": "CONFIRM", "✗": "REJECT", "⊗": "ERROR",
  "∎": "COMPLETE", "⟳": "RETRY", "⚡": "URGENT",
};

function detectIntent(axon: string): string {
  const trimmed = axon.trimStart();
  const firstChar = trimmed[0];
  return INTENT_FROM_SYMBOL[firstChar] ?? "REQUEST";
}

function generate(): Conversation[] {
  const conversations: Conversation[] = [];
  const TARGET = 1000;
  const NOW = Date.now();
  const SPAN_MS = 7 * 24 * 60 * 60 * 1000; // last 7 days

  for (let i = 0; i < TARGET; i++) {
    const scenario = pick(SCENARIOS);
    const vars = genVars();
    const templates = scenario.produce(vars);
    const startTs = NOW - rnd(0, SPAN_MS);
    const messages: Message[] = templates.map((t, idx) => {
      const enc = encode(t.nl, { ascii: false });
      const axon = enc.encoded;
      return {
        ts: startTs + idx * rnd(500, 30000),
        from: t.from,
        to: t.to,
        nl: t.nl,
        axon,
        intent: detectIntent(axon),
      };
    });
    conversations.push({
      id: `conv-${String(i + 1).padStart(4, "0")}`,
      scenario: scenario.name,
      category: scenario.category,
      startTs,
      messages,
    });
  }
  return conversations.sort((a, b) => b.startTs - a.startTs);
}

// ── Render HTML ───────────────────────────────────────────────────────

function buildHtml(convs: Conversation[]): string {
  const allMessages = convs.flatMap((c) => c.messages);
  const totalMessages = allMessages.length;
  const totalNlChars = allMessages.reduce((a, m) => a + m.nl.length, 0);
  const totalAxonChars = allMessages.reduce((a, m) => a + m.axon.length, 0);
  const reduction = ((1 - totalAxonChars / totalNlChars) * 100).toFixed(1);

  // Edge weights
  const edges: Record<string, number> = {};
  for (const m of allMessages) {
    if (m.to === "broadcast") continue;
    const key = `${m.from}→${m.to}`;
    edges[key] = (edges[key] ?? 0) + 1;
  }

  // Intent distribution
  const intentDist: Record<string, number> = {};
  for (const m of allMessages) intentDist[m.intent] = (intentDist[m.intent] ?? 0) + 1;

  const stats = {
    conversations: convs.length,
    agents: AGENTS.length,
    messages: totalMessages,
    nlChars: totalNlChars,
    axonChars: totalAxonChars,
    reduction,
  };

  // Embed data minified
  const dataJson = JSON.stringify({ stats, agents: AGENTS, conversations: convs, edges, intentDist });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>AXON Trace Explorer — 1000 conversations × 10 agents</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
:root {
  --bg: #0a0e14;
  --bg-panel: #11161e;
  --bg-panel-2: #161c25;
  --border: #1f2832;
  --text: #d3d7de;
  --text-dim: #7f8794;
  --text-faint: #4a525c;
  --accent: #7fdbca;
  --REQUEST: #6da7ff;
  --QUERY: #5dd9e5;
  --INFORM: #8b95a3;
  --DELEGATE: #b07cff;
  --MERGE: #ff9b6d;
  --CONFIRM: #6dd6a3;
  --REJECT: #ff8aa3;
  --ERROR: #ff6b6b;
  --COMPLETE: #5fd97c;
  --RETRY: #ffb55f;
  --URGENT: #ff4d6d;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; line-height: 1.5; }
.mono { font-family: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace; }
header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 24px; }
h1 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 0.3px; }
.subtitle { color: var(--text-dim); font-size: 12px; }
.stats { display: flex; gap: 24px; margin-left: auto; font-size: 12px; color: var(--text-dim); }
.stats b { color: var(--text); margin-left: 4px; }
.layout { display: grid; grid-template-columns: 380px 1fr 460px; gap: 1px; background: var(--border); height: calc(100vh - 53px); }
.panel { background: var(--bg-panel); overflow: auto; padding: 16px 18px; }
.panel h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin: 0 0 12px 0; font-weight: 600; }
.panel h2:not(:first-child) { margin-top: 24px; }

/* Graph */
#graph { width: 100%; height: 320px; background: var(--bg-panel-2); border-radius: 4px; position: relative; }
#graph svg { width: 100%; height: 100%; display: block; }
.node text { font-size: 10px; fill: var(--text); pointer-events: none; }
.node circle { stroke: #1f2832; stroke-width: 1.5; cursor: pointer; transition: stroke 0.15s; }
.node.active circle { stroke: var(--accent); stroke-width: 2.5; }
.link { stroke: #2a3441; stroke-opacity: 0.5; }
.link.active { stroke: var(--accent); stroke-opacity: 0.8; }

/* Intent legend */
.intents { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 11px; }
.intent-row { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 6px; border-radius: 3px; }
.intent-row:hover { background: var(--bg-panel-2); }
.intent-row.active { background: var(--bg-panel-2); }
.intent-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.intent-row .count { margin-left: auto; color: var(--text-dim); font-variant-numeric: tabular-nums; }

/* Filter chips */
.filters { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.chip { padding: 3px 9px; border-radius: 100px; background: var(--bg-panel-2); border: 1px solid var(--border); cursor: pointer; font-size: 11px; color: var(--text-dim); }
.chip:hover { color: var(--text); }
.chip.active { background: #1d2e3a; color: var(--accent); border-color: #284559; }

/* Search */
.search { width: 100%; background: var(--bg-panel-2); border: 1px solid var(--border); color: var(--text); padding: 7px 10px; border-radius: 4px; font-size: 12px; outline: none; }
.search:focus { border-color: #2c3a4a; }

/* Conversation list */
.conv-list { display: flex; flex-direction: column; gap: 1px; }
.conv-row { padding: 9px 11px; background: var(--bg-panel-2); border-left: 2px solid transparent; cursor: pointer; transition: background 0.1s; }
.conv-row:hover { background: #1a2129; }
.conv-row.selected { background: #1d2e3a; border-left-color: var(--accent); }
.conv-row .top { display: flex; justify-content: space-between; font-size: 11px; }
.conv-row .scenario { color: var(--text); font-weight: 500; }
.conv-row .time { color: var(--text-faint); font-variant-numeric: tabular-nums; }
.conv-row .bottom { color: var(--text-dim); font-size: 11px; margin-top: 3px; display: flex; gap: 8px; flex-wrap: wrap; }
.conv-row .pill { padding: 1px 5px; border-radius: 3px; background: var(--bg); font-size: 10px; }

/* Timeline */
#timeline { padding: 18px; }
.timeline-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; }
.timeline-title { font-size: 14px; font-weight: 600; }
.timeline-meta { color: var(--text-dim); font-size: 11px; margin-top: 2px; }
.timeline-stats { font-size: 11px; color: var(--text-dim); white-space: nowrap; }
.timeline-stats b { color: var(--text); }

.msg-list { display: flex; flex-direction: column; gap: 0; }
.msg { display: grid; grid-template-columns: 80px 1fr; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.msg:hover { background: rgba(255,255,255,0.02); }
.msg.selected { background: #14202a; }
.msg-time { color: var(--text-faint); font-size: 11px; text-align: right; padding-top: 1px; }
.msg-flow { display: flex; align-items: center; gap: 6px; font-size: 11px; margin-bottom: 4px; }
.agent-tag { color: var(--text-dim); font-weight: 500; }
.intent-tag { padding: 1px 6px; border-radius: 2px; font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
.arrow { color: var(--text-faint); }
.msg-axon { font-size: 12px; }
.msg-nl { color: var(--text-dim); font-size: 11px; margin-top: 4px; display: none; }
.msg.selected .msg-nl { display: block; }
.empty { color: var(--text-faint); text-align: center; padding: 80px 0; font-size: 12px; }

/* Bar chart */
.bar-row { display: grid; grid-template-columns: 70px 1fr 40px; gap: 8px; align-items: center; font-size: 11px; margin-bottom: 4px; }
.bar-bg { background: var(--bg-panel-2); height: 14px; border-radius: 2px; overflow: hidden; }
.bar-fill { height: 100%; transition: width 0.2s; }
.agent-name { color: var(--text-dim); font-size: 11px; }
.agent-count { color: var(--text-dim); text-align: right; font-variant-numeric: tabular-nums; }

footer { border-top: 1px solid var(--border); padding: 8px 24px; font-size: 11px; color: var(--text-faint); display: flex; gap: 16px; }
footer a { color: var(--text-dim); text-decoration: none; }
footer a:hover { color: var(--accent); }
</style>
</head>
<body>
<header>
  <div>
    <h1>AXON Trace Explorer</h1>
    <div class="subtitle">Glanceable view over 7 days of agent conversations</div>
  </div>
  <div class="stats">
    <div>conversations<b id="stat-convs">—</b></div>
    <div>agents<b id="stat-agents">—</b></div>
    <div>messages<b id="stat-msgs">—</b></div>
    <div>storage<b id="stat-storage">—</b></div>
  </div>
</header>

<div class="layout">

  <div class="panel" id="left">
    <h2>Inter-agent graph</h2>
    <div id="graph"></div>

    <h2>Intent distribution</h2>
    <div class="intents" id="intents"></div>

    <h2>Top talkers (out)</h2>
    <div id="agent-bars"></div>
  </div>

  <div class="panel" id="middle">
    <h2>Conversations</h2>
    <input class="search" id="search" placeholder="filter: e.g. payment, PR#42, sre-agent..." />
    <div class="filters" id="cat-filters"></div>
    <div class="conv-list" id="conv-list" style="margin-top: 12px;"></div>
  </div>

  <div class="panel" id="right">
    <div id="timeline">
      <div class="empty">Select a conversation to view its timeline.</div>
    </div>
  </div>

</div>

<footer>
  <span>AXON Trace Explorer demo</span>
  <span>·</span>
  <span>1000 synthetic conversations · 10 agents · rule-based AXON encoder</span>
  <span>·</span>
  <span id="reduction-stat">—</span>
</footer>

<script>
const DATA = ${dataJson};

// ─ Stats ─
document.getElementById('stat-convs').textContent = DATA.stats.conversations.toLocaleString();
document.getElementById('stat-agents').textContent = DATA.stats.agents;
document.getElementById('stat-msgs').textContent = DATA.stats.messages.toLocaleString();
document.getElementById('stat-storage').textContent = (DATA.stats.axonChars/1024).toFixed(0) + ' KB (was ' + (DATA.stats.nlChars/1024).toFixed(0) + ' KB)';
document.getElementById('reduction-stat').textContent = DATA.stats.reduction + '% storage saved vs raw NL';

// ─ Inter-agent graph (force-directed, vanilla SVG) ─
const graphEl = document.getElementById('graph');
const W = graphEl.clientWidth, H = 320;
const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
graphEl.appendChild(svg);

const nodes = DATA.agents.map(a => ({ id: a, x: W/2 + (Math.random()-0.5)*W*0.6, y: H/2 + (Math.random()-0.5)*H*0.6, vx:0, vy:0 }));
const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
const links = Object.entries(DATA.edges).map(([k,v]) => {
  const [from, to] = k.split('→');
  return { source: nodeById[from], target: nodeById[to], weight: v };
});

const maxW = Math.max(...links.map(l => l.weight));
const minW = Math.min(...links.map(l => l.weight));
const lScale = w => 0.4 + 2.5 * (w - minW) / (maxW - minW || 1);

// simple force simulation: charge + link
function tick() {
  for (let n of nodes) { n.vx *= 0.85; n.vy *= 0.85; }
  // repulsion
  for (let i = 0; i < nodes.length; i++) for (let j = i+1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j];
    const dx = b.x - a.x, dy = b.y - a.y;
    const d2 = dx*dx + dy*dy + 0.01;
    const f = 4500 / d2;
    a.vx -= dx*f/Math.sqrt(d2); a.vy -= dy*f/Math.sqrt(d2);
    b.vx += dx*f/Math.sqrt(d2); b.vy += dy*f/Math.sqrt(d2);
  }
  // link springs
  for (let l of links) {
    const dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
    const d = Math.sqrt(dx*dx + dy*dy) + 0.01;
    const target = 110;
    const f = (d - target) * 0.04;
    l.source.vx += dx/d * f; l.source.vy += dy/d * f;
    l.target.vx -= dx/d * f; l.target.vy -= dy/d * f;
  }
  // center pull
  for (let n of nodes) {
    n.vx += (W/2 - n.x) * 0.008;
    n.vy += (H/2 - n.y) * 0.008;
    n.x += n.vx; n.y += n.vy;
    n.x = Math.max(30, Math.min(W-30, n.x));
    n.y = Math.max(20, Math.min(H-20, n.y));
  }
}
for (let i = 0; i < 350; i++) tick();

// Render
for (let l of links) {
  const line = document.createElementNS('http://www.w3.org/2000/svg','line');
  line.setAttribute('x1', l.source.x); line.setAttribute('y1', l.source.y);
  line.setAttribute('x2', l.target.x); line.setAttribute('y2', l.target.y);
  line.setAttribute('stroke', '#2a3441'); line.setAttribute('stroke-opacity', '0.55');
  line.setAttribute('stroke-width', lScale(l.weight));
  line.dataset.from = l.source.id; line.dataset.to = l.target.id;
  line.classList.add('link');
  svg.appendChild(line);
}

const agentColors = {
  'orchestrator': '#7fdbca', 'sre-agent': '#ff9b6d', 'security-agent': '#b07cff',
  'code-review': '#6dd6a3', 'deploy-agent': '#6da7ff', 'monitor': '#ffb55f',
  'db-admin': '#5dd9e5', 'qa-agent': '#ff8aa3', 'infra-team': '#d9d77f', 'data-pipeline': '#9bdf94',
};
for (let n of nodes) {
  const g = document.createElementNS('http://www.w3.org/2000/svg','g');
  g.classList.add('node');
  g.dataset.agent = n.id;
  const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', 14);
  c.setAttribute('fill', agentColors[n.id] || '#666');
  c.setAttribute('fill-opacity', '0.85');
  g.appendChild(c);
  const t = document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('x', n.x); t.setAttribute('y', n.y + 26);
  t.setAttribute('text-anchor', 'middle');
  t.textContent = n.id;
  g.appendChild(t);
  svg.appendChild(g);
  g.addEventListener('click', () => filterByAgent(n.id));
}

function filterByAgent(agentId) {
  state.agentFilter = state.agentFilter === agentId ? null : agentId;
  applyFilters();
}

// ─ Intent legend ─
const intentEl = document.getElementById('intents');
const intents = Object.entries(DATA.intentDist).sort((a,b)=>b[1]-a[1]);
for (let [intent, count] of intents) {
  const row = document.createElement('div');
  row.className = 'intent-row';
  row.dataset.intent = intent;
  row.innerHTML = '<span class="intent-dot" style="background:var(--' + intent + ')"></span><span>' + intent + '</span><span class="count">' + count + '</span>';
  row.addEventListener('click', () => { state.intentFilter = state.intentFilter === intent ? null : intent; applyFilters(); });
  intentEl.appendChild(row);
}

// ─ Agent bars (top talkers) ─
const outCounts = {};
for (let c of DATA.conversations) for (let m of c.messages) outCounts[m.from] = (outCounts[m.from] || 0) + 1;
const sorted = Object.entries(outCounts).sort((a,b)=>b[1]-a[1]);
const maxOut = sorted[0][1];
const barsEl = document.getElementById('agent-bars');
for (let [agent, n] of sorted) {
  const r = document.createElement('div');
  r.className = 'bar-row';
  r.innerHTML = '<div class="agent-name">' + agent + '</div>' +
    '<div class="bar-bg"><div class="bar-fill" style="width:' + (n/maxOut*100).toFixed(1) + '%;background:' + (agentColors[agent]||'#666') + '"></div></div>' +
    '<div class="agent-count">' + n + '</div>';
  barsEl.appendChild(r);
}

// ─ Category filters ─
const cats = [...new Set(DATA.conversations.map(c => c.category))].sort();
const catEl = document.getElementById('cat-filters');
for (let cat of cats) {
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.textContent = cat;
  chip.dataset.cat = cat;
  chip.addEventListener('click', () => { state.catFilter = state.catFilter === cat ? null : cat; applyFilters(); });
  catEl.appendChild(chip);
}

// ─ State ─
const state = { catFilter: null, agentFilter: null, intentFilter: null, search: '', selectedConv: null, selectedMsg: null };

function applyFilters() {
  let filtered = DATA.conversations;
  if (state.catFilter) filtered = filtered.filter(c => c.category === state.catFilter);
  if (state.agentFilter) filtered = filtered.filter(c => c.messages.some(m => m.from === state.agentFilter || m.to === state.agentFilter));
  if (state.intentFilter) filtered = filtered.filter(c => c.messages.some(m => m.intent === state.intentFilter));
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    filtered = filtered.filter(c => c.scenario.toLowerCase().includes(q) || c.messages.some(m => m.nl.toLowerCase().includes(q) || m.axon.toLowerCase().includes(q)));
  }
  renderConvList(filtered);
  // Update chip states
  catEl.querySelectorAll('.chip').forEach(el => el.classList.toggle('active', el.dataset.cat === state.catFilter));
  intentEl.querySelectorAll('.intent-row').forEach(el => el.classList.toggle('active', el.dataset.intent === state.intentFilter));
  svg.querySelectorAll('.node').forEach(el => el.classList.toggle('active', el.dataset.agent === state.agentFilter));
  svg.querySelectorAll('.link').forEach(el => {
    const m = el.dataset.from === state.agentFilter || el.dataset.to === state.agentFilter;
    el.classList.toggle('active', state.agentFilter && m);
  });
}

const convListEl = document.getElementById('conv-list');
function renderConvList(convs) {
  convListEl.innerHTML = '';
  const slice = convs.slice(0, 200);
  if (slice.length === 0) { convListEl.innerHTML = '<div class="empty">No conversations match.</div>'; return; }
  for (let c of slice) {
    const row = document.createElement('div');
    row.className = 'conv-row' + (state.selectedConv === c.id ? ' selected' : '');
    row.dataset.id = c.id;
    const dt = new Date(c.startTs);
    const time = dt.toLocaleString('en-GB', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const intents = [...new Set(c.messages.map(m => m.intent))].slice(0,4).map(i => '<span class="pill" style="color:var(--'+i+')">'+i+'</span>').join('');
    row.innerHTML = '<div class="top"><span class="scenario">' + c.scenario + '</span><span class="time">' + time + '</span></div>' +
                    '<div class="bottom">' + intents + '<span style="color:var(--text-faint);margin-left:auto">' + c.messages.length + ' msgs</span></div>';
    row.addEventListener('click', () => { state.selectedConv = c.id; state.selectedMsg = null; applyFilters(); renderTimeline(c); });
    convListEl.appendChild(row);
  }
  if (convs.length > 200) {
    const more = document.createElement('div');
    more.className = 'empty';
    more.textContent = '+ ' + (convs.length - 200) + ' more (refine filter)';
    convListEl.appendChild(more);
  }
}

function renderTimeline(conv) {
  const el = document.getElementById('timeline');
  const totalNl = conv.messages.reduce((a,m)=>a+m.nl.length,0);
  const totalAx = conv.messages.reduce((a,m)=>a+m.axon.length,0);
  const reduct = ((1 - totalAx/totalNl)*100).toFixed(0);

  let html = '<div class="timeline-header">' +
    '<div><div class="timeline-title">' + conv.scenario + '</div>' +
    '<div class="timeline-meta">' + conv.id + ' · ' + conv.category + ' · ' + new Date(conv.startTs).toLocaleString() + '</div></div>' +
    '<div class="timeline-stats">' + conv.messages.length + ' messages · ' + totalAx + ' / ' + totalNl + ' chars · <b>' + reduct + '% smaller</b></div>' +
    '</div><div class="msg-list">';

  for (let i = 0; i < conv.messages.length; i++) {
    const m = conv.messages[i];
    const dt = new Date(m.ts);
    const t = dt.toLocaleTimeString('en-GB', { hour12: false });
    html += '<div class="msg" data-idx="' + i + '">' +
      '<div class="msg-time">' + t + '</div>' +
      '<div>' +
        '<div class="msg-flow">' +
          '<span class="intent-tag" style="background:rgba(127,219,202,0.1);color:var(--' + m.intent + ')">' + m.intent + '</span>' +
          '<span class="agent-tag">' + m.from + '</span>' +
          '<span class="arrow">→</span>' +
          '<span class="agent-tag">' + m.to + '</span>' +
        '</div>' +
        '<div class="msg-axon mono">' + escapeHtml(m.axon) + '</div>' +
        '<div class="msg-nl">↳ ' + escapeHtml(m.nl) + '</div>' +
      '</div>' +
    '</div>';
  }
  html += '</div>';
  el.innerHTML = html;
  el.querySelectorAll('.msg').forEach(msgEl => {
    msgEl.addEventListener('click', () => {
      el.querySelectorAll('.msg').forEach(x => x.classList.remove('selected'));
      msgEl.classList.add('selected');
    });
  });
}

function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// search
document.getElementById('search').addEventListener('input', (e) => { state.search = e.target.value; applyFilters(); });

// initial render
applyFilters();
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────

const convs = generate();
const html = buildHtml(convs);
const outDir = resolve(__dirname, "dist");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "trace-explorer.html");
writeFileSync(outPath, html);

const stats = {
  conversations: convs.length,
  messages: convs.reduce((a, c) => a + c.messages.length, 0),
  htmlKb: (html.length / 1024).toFixed(0),
};
console.log(`✓ Generated ${stats.conversations} conversations (${stats.messages} messages)`);
console.log(`✓ Wrote ${outPath} (${stats.htmlKb} KB)`);
