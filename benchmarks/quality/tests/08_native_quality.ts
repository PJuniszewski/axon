/**
 * Test 8 — Native AXON generation quality.
 *
 * 15 agent-style tasks. For each:
 *   A) baseline: model produces NL response
 *   B) codecfit: model produces AXON response (CodecFit in system prompt)
 *
 * Then a third subagent (judge) is given:
 *   - the original task description
 *   - both responses
 *   - it scores each on (a) task fidelity (did the response complete the
 *     task) and (b) information completeness (did all expected entities
 *     appear).
 *
 * The judge does not know which arm is which. They are presented as
 * "response A" and "response B" with order shuffled per task.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CODECFIT_INJECT } from "@axon/codec";
import { countTokens } from "@axon/codec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../results/08");

interface Task {
  id: string;
  prompt: string;       // task description handed to the agent
  must_contain: string[]; // entities expected in any valid response
}

const TASKS: Task[] = [
  { id: "t-01", prompt: "Report that the deployment to production succeeded for all 8 microservices, with health checks passing. Address the report to the orchestrator.", must_contain: ["8", "orchestrator", "production"] },
  { id: "t-02", prompt: "Delegate pull request 217 review to the security-agent. Specify that all tests must pass before approval.", must_contain: ["217", "security-agent", "tests"] },
  { id: "t-03", prompt: "Report an error: the payment service timed out after 30 seconds. State you will retry with exponential backoff, maximum 5 attempts.", must_contain: ["payment", "30", "5"] },
  { id: "t-04", prompt: "Query the inventory service status. Set a timeout of 5 seconds.", must_contain: ["inventory", "5"] },
  { id: "t-05", prompt: "Issue an urgent alert: the load balancer is unresponsive and all traffic is affected. Escalate to the infrastructure team.", must_contain: ["load balancer", "infrastructure"] },
  { id: "t-06", prompt: "Request a batch job across 12 workers: each scrapes the top 10 results for its assigned keyword, then sends structured output to the aggregator agent.", must_contain: ["12", "10", "aggregator"] },
  { id: "t-07", prompt: "Inform the orchestrator that the database query returned 5841 records, with 22 excluded as malformed.", must_contain: ["5841", "22", "orchestrator"] },
  { id: "t-08", prompt: "Reject the merge of pull request 99. Cite that there are 2 unresolved review comments and 1 failing CI check.", must_contain: ["99", "2", "1"] },
  { id: "t-09", prompt: "Acknowledge and confirm proceeding with rollback to version 3.1.4 on the auth-gateway service.", must_contain: ["3.1.4", "auth-gateway"] },
  { id: "t-10", prompt: "Retry the failed transaction for user u-44291 using the secondary processor.", must_contain: ["u-44291", "secondary"] },
  { id: "t-11", prompt: "Inform: error rate over the last 10 minutes is 6.5 percent, up from 0.4 percent over the prior hour.", must_contain: ["10", "6.5", "0.4"] },
  { id: "t-12", prompt: "Request: do not deploy to production until the security audit has passed.", must_contain: ["production", "audit"] },
  { id: "t-13", prompt: "Inform: the auth-service fails only for users in the EU region, and only during peak hours. Hypothesis: rate limiting.", must_contain: ["auth-service", "EU", "rate"] },
  { id: "t-14", prompt: "Aggregate results from worker-1, worker-2, worker-3 into a single report addressed to the orchestrator.", must_contain: ["worker-1", "worker-2", "worker-3", "orchestrator"] },
  { id: "t-15", prompt: "Confirm: rate limit reached for tenant t-9921: 1000 requests per minute exceeded. Throttling for the next 60 seconds.", must_contain: ["t-9921", "1000", "60"] },
];

function buildAgentInstructions(arm: "baseline" | "codecfit"): string {
  const sysPrefix = arm === "codecfit" ? `${CODECFIT_INJECT}\n\n---\n\n` : "";
  return `
${sysPrefix}You are an agent. For each task, produce the agent message exactly as you
would send it to another agent.

${arm === "codecfit" ? "Per the protocol above, output AXON only." : "Respond in natural English."}

Output ONLY a JSON array of {"id": "<id>", "response": "<message>"}. No
markdown, no commentary, no code fences.

TASKS:
${JSON.stringify(TASKS.map((t) => ({ id: t.id, task: t.prompt })), null, 2)}
`.trim();
}

function prepareAgent() {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, "baseline_instructions.md"), buildAgentInstructions("baseline"));
  writeFileSync(resolve(OUT_DIR, "codecfit_instructions.md"), buildAgentInstructions("codecfit"));
  console.log(`Agent arms prepared → ${OUT_DIR}/`);
}

interface AgentResponse { id: string; response: string; }

function prepareJudge() {
  const baseline: AgentResponse[] = JSON.parse(readFileSync(resolve(OUT_DIR, "baseline_responses.json"), "utf-8"));
  const codecfit: AgentResponse[] = JSON.parse(readFileSync(resolve(OUT_DIR, "codecfit_responses.json"), "utf-8"));
  const bById = new Map(baseline.map((r) => [r.id, r.response]));
  const cById = new Map(codecfit.map((r) => [r.id, r.response]));

  // shuffle order per task (deterministic via id parity)
  const judgeTasks = TASKS.map((t, idx) => {
    const flip = idx % 2 === 0;
    const A = flip ? bById.get(t.id) ?? "" : cById.get(t.id) ?? "";
    const B = flip ? cById.get(t.id) ?? "" : bById.get(t.id) ?? "";
    const A_is = flip ? "baseline" : "codecfit";
    const B_is = flip ? "codecfit" : "baseline";
    return { id: t.id, task: t.prompt, must_contain: t.must_contain, response_A: A, response_B: B, _truth: { A_is, B_is } };
  });

  // Hide truth from judge prompt
  const judgePayload = judgeTasks.map(({ _truth, ...rest }) => rest);
  writeFileSync(resolve(OUT_DIR, "judge_payload.json"), JSON.stringify(judgePayload, null, 2));
  writeFileSync(resolve(OUT_DIR, "judge_truth.json"), JSON.stringify(judgeTasks.map((t) => ({ id: t.id, _truth: t._truth })), null, 2));

  const instr = `
You are a judge. For each task you receive the original task description,
a list of entities that MUST appear in any valid response, and two candidate
agent responses (A and B). Score each response on:

  task_fidelity (0–10): did it accomplish the task as stated?
    10 = complete, accurate, well-formed agent message
     5 = partial — missing one element or incorrectly framed
     0 = does not address the task

  entity_completeness (0–10): how many of the must_contain entities are
  present in the response? (You may interpret an entity flexibly if its
  shortened form is unambiguous — e.g. "orchestrator" → "orch".)

Output ONLY a JSON array of {"id", "A_task", "A_entities", "B_task", "B_entities", "rationale"}.
No markdown, no commentary, no code fences.

PAYLOAD:
${JSON.stringify(judgePayload, null, 2)}
`.trim();
  writeFileSync(resolve(OUT_DIR, "judge_instructions.md"), instr);
  console.log(`Judge tasks prepared → ${OUT_DIR}/judge_instructions.md`);
}

interface JudgeResp { id: string; A_task: number; A_entities: number; B_task: number; B_entities: number; rationale: string; }

function collect() {
  const path = resolve(OUT_DIR, "judge_responses.json");
  if (!existsSync(path)) { console.error(`Missing ${path}`); process.exit(1); }
  const judges: JudgeResp[] = JSON.parse(readFileSync(path, "utf-8"));
  const truth: { id: string; _truth: { A_is: string; B_is: string } }[] =
    JSON.parse(readFileSync(resolve(OUT_DIR, "judge_truth.json"), "utf-8"));
  const truthById = new Map(truth.map((t) => [t.id, t._truth]));

  const baseline: AgentResponse[] = JSON.parse(readFileSync(resolve(OUT_DIR, "baseline_responses.json"), "utf-8"));
  const codecfit: AgentResponse[] = JSON.parse(readFileSync(resolve(OUT_DIR, "codecfit_responses.json"), "utf-8"));
  const bById = new Map(baseline.map((r) => [r.id, r.response]));
  const cById = new Map(codecfit.map((r) => [r.id, r.response]));

  let bTask = 0, bEnt = 0, cTask = 0, cEnt = 0, bTokens = 0, cTokens = 0;
  const rows: any[] = [];
  for (const j of judges) {
    const tr = truthById.get(j.id);
    if (!tr) continue;
    const baseTask = tr.A_is === "baseline" ? j.A_task : j.B_task;
    const baseEnt = tr.A_is === "baseline" ? j.A_entities : j.B_entities;
    const cfTask = tr.A_is === "codecfit" ? j.A_task : j.B_task;
    const cfEnt = tr.A_is === "codecfit" ? j.A_entities : j.B_entities;
    const bResp = bById.get(j.id) ?? "";
    const cResp = cById.get(j.id) ?? "";
    bTokens += countTokens(bResp);
    cTokens += countTokens(cResp);
    bTask += baseTask; bEnt += baseEnt; cTask += cfTask; cEnt += cfEnt;
    rows.push({ id: j.id, baseline_task: baseTask, baseline_entities: baseEnt, codecfit_task: cfTask, codecfit_entities: cfEnt, baseline_response: bResp, codecfit_response: cResp, rationale: j.rationale });
  }
  const n = judges.length;

  console.log("\n=== TEST 8: Native generation quality ===\n");
  console.log(`n = ${n} tasks`);
  console.log(`\n           task_fidelity  entity_compl   tokens_total`);
  console.log(`baseline:   ${(bTask / n).toFixed(2)}           ${(bEnt / n).toFixed(2)}          ${bTokens}`);
  console.log(`codecfit:   ${(cTask / n).toFixed(2)}           ${(cEnt / n).toFixed(2)}          ${cTokens}`);
  console.log(`Δ:          ${((cTask - bTask) / n).toFixed(2)}           ${((cEnt - bEnt) / n).toFixed(2)}          ${cTokens - bTokens}`);
  console.log(`\nToken reduction: ${((1 - cTokens / bTokens) * 100).toFixed(1)}%`);

  writeFileSync(resolve(OUT_DIR, "../08_native_quality.json"), JSON.stringify({
    test: "native_quality", n,
    baseline: { task_fidelity_mean: bTask / n, entity_completeness_mean: bEnt / n, total_tokens: bTokens },
    codecfit: { task_fidelity_mean: cTask / n, entity_completeness_mean: cEnt / n, total_tokens: cTokens },
    token_reduction_pct: (1 - cTokens / bTokens) * 100,
    rows,
  }, null, 2));
  console.log(`\nResults → results/08_native_quality.json`);
}

const mode = process.argv[2];
if (mode === "--prepare-agent") prepareAgent();
else if (mode === "--prepare-judge") prepareJudge();
else if (mode === "--collect") collect();
else { console.error("Usage: --prepare-agent | --prepare-judge | --collect"); process.exit(1); }
