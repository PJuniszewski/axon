/**
 * Reasoning problems for test 07 — does CodecFit injection hurt CoT?
 *
 * Mix of arithmetic, logical, and conditional reasoning tasks. Same task
 * is presented to two subagents: one with CodecFit in system prompt, one
 * without. Both are told to think step by step and output a final numeric
 * or short-text answer.
 *
 * Tasks chosen so that:
 *   - Each has a single unambiguous answer
 *   - Solving requires multi-step reasoning, not lookup
 *   - Tasks resemble plausible agent-orchestration logic
 */

export interface ReasoningProblem {
  id: string;
  prompt: string;
  answer: string;            // exact-match (or substring) target after normalisation
  difficulty: "easy" | "med" | "hard";
}

export const REASONING_PROBLEMS: ReasoningProblem[] = [
  { id: "r-01", difficulty: "easy",
    prompt: "An agent retried a failed task 3 times. Each retry costs 12 tokens. The initial attempt cost 47 tokens. What was the total token cost?",
    answer: "83" },
  { id: "r-02", difficulty: "easy",
    prompt: "A batch job processed 240 records. 18 failed validation. What percentage of records passed?",
    answer: "92.5" },
  { id: "r-03", difficulty: "med",
    prompt: "Workers A, B, C each take 8 minutes per task. They can work in parallel. How long to complete 21 tasks?",
    answer: "56" },
  { id: "r-04", difficulty: "med",
    prompt: "A service has 99.5 percent uptime. Over 30 days, how many minutes of downtime are expected? Round to the nearest minute.",
    answer: "216" },
  { id: "r-05", difficulty: "med",
    prompt: "Agent A completes a task in 4 minutes. Agent B is 50 percent slower. If they work together on 14 tasks in parallel (one each at a time), how long to finish?",
    answer: "28" },
  { id: "r-06", difficulty: "easy",
    prompt: "A queue has 1000 messages. Producer adds 50 per second, consumer drains 80 per second. When is the queue empty?",
    answer: "33.3" },
  { id: "r-07", difficulty: "hard",
    prompt: "An ETL job processes 2 million rows. Extraction is 5 minutes, transformation is 30 percent of extraction time, loading is twice transformation. Then validation adds 15 percent overhead on top of total. Total time in minutes?",
    answer: "11.9" },
  { id: "r-08", difficulty: "med",
    prompt: "If a deployment must wait for at least 3 of 5 reviewers to approve, and reviewer approval is independent with probability 0.7 each, what is the probability the deployment is approved? Round to 2 decimals.",
    answer: "0.84" },
  { id: "r-09", difficulty: "easy",
    prompt: "Two workers split 100 tasks. Worker 1 takes 60 percent. Worker 2 finishes 20 tasks in 1 hour. How long for worker 2 to finish all assigned tasks?",
    answer: "2" },
  { id: "r-10", difficulty: "hard",
    prompt: "An agent chain has 4 hops. Each hop loses 8 percent of fidelity. What is the final fidelity as a percentage, rounded to 1 decimal?",
    answer: "71.6" },
  { id: "r-11", difficulty: "easy",
    prompt: "Rate limit is 600 requests per minute. An agent is currently at 540 requests in the current window with 25 seconds remaining. How many more requests can it make safely?",
    answer: "60" },
  { id: "r-12", difficulty: "med",
    prompt: "If the orchestrator must NOT proceed unless tests pass AND security audit passes, and tests pass with probability 0.9, audit with 0.85 (independent), what is the probability of proceeding? Round to 3 decimals.",
    answer: "0.765" },
  { id: "r-13", difficulty: "easy",
    prompt: "A cluster has 12 nodes. 25 percent are reserved for canary deploys. How many nodes serve production traffic?",
    answer: "9" },
  { id: "r-14", difficulty: "med",
    prompt: "A batch of 500 tasks is split equally across 8 workers. Each worker takes 2 minutes per task and works in parallel. What is the total wall clock time in minutes? Round up.",
    answer: "126" },
  { id: "r-15", difficulty: "hard",
    prompt: "Token budget is 1 million. The encoder reduces 850 tokens per message to 230. After paying a 148-token CodecFit overhead, what is the maximum number of messages that fit in the budget?",
    answer: "4347" },
  { id: "r-16", difficulty: "easy",
    prompt: "A worker pool of 20 has 4 in CrashLoopBackOff. What percentage is healthy?",
    answer: "80" },
  { id: "r-17", difficulty: "med",
    prompt: "An agent received 200 messages. 30 percent were errors. Of the errors, half were retryable. How many retryable errors?",
    answer: "30" },
  { id: "r-18", difficulty: "med",
    prompt: "If failover takes 8 minutes and during failover error rate is 60 percent on remaining capacity of 5000 rps, how many failed requests during failover?",
    answer: "1440000" },
  { id: "r-19", difficulty: "easy",
    prompt: "Cache hit rate is 85 percent. Cache miss cost is 40ms, hit cost is 2ms. Average latency in ms?",
    answer: "7.7" },
  { id: "r-20", difficulty: "hard",
    prompt: "A pipeline has 3 stages A→B→C. A processes 1000 items in 5 min, B in 8 min, C in 3 min. They can pipeline (stage starts as soon as upstream produces). What is end-to-end time for 1000 items? Assume each stage processes items in arrival order and takes proportional time per item.",
    answer: "16" },
];
