You are a careful reasoning agent. For each problem, think step by
step. Then output your final answer.

Output ONLY a JSON array of {"id": "<id>", "reasoning": "<step-by-step, <=80 words>", "answer": "<numeric or short text>"}.
The answer field should contain ONLY the value (no units, no commentary).
No markdown, no commentary outside the JSON, no code fences.

PROBLEMS:
[
  {
    "id": "r-01",
    "prompt": "An agent retried a failed task 3 times. Each retry costs 12 tokens. The initial attempt cost 47 tokens. What was the total token cost?"
  },
  {
    "id": "r-02",
    "prompt": "A batch job processed 240 records. 18 failed validation. What percentage of records passed?"
  },
  {
    "id": "r-03",
    "prompt": "Workers A, B, C each take 8 minutes per task. They can work in parallel. How long to complete 21 tasks?"
  },
  {
    "id": "r-04",
    "prompt": "A service has 99.5 percent uptime. Over 30 days, how many minutes of downtime are expected? Round to the nearest minute."
  },
  {
    "id": "r-05",
    "prompt": "Agent A completes a task in 4 minutes. Agent B is 50 percent slower. If they work together on 14 tasks in parallel (one each at a time), how long to finish?"
  },
  {
    "id": "r-06",
    "prompt": "A queue has 1000 messages. Producer adds 50 per second, consumer drains 80 per second. When is the queue empty?"
  },
  {
    "id": "r-07",
    "prompt": "An ETL job processes 2 million rows. Extraction is 5 minutes, transformation is 30 percent of extraction time, loading is twice transformation. Then validation adds 15 percent overhead on top of total. Total time in minutes?"
  },
  {
    "id": "r-08",
    "prompt": "If a deployment must wait for at least 3 of 5 reviewers to approve, and reviewer approval is independent with probability 0.7 each, what is the probability the deployment is approved? Round to 2 decimals."
  },
  {
    "id": "r-09",
    "prompt": "Two workers split 100 tasks. Worker 1 takes 60 percent. Worker 2 finishes 20 tasks in 1 hour. How long for worker 2 to finish all assigned tasks?"
  },
  {
    "id": "r-10",
    "prompt": "An agent chain has 4 hops. Each hop loses 8 percent of fidelity. What is the final fidelity as a percentage, rounded to 1 decimal?"
  },
  {
    "id": "r-11",
    "prompt": "Rate limit is 600 requests per minute. An agent is currently at 540 requests in the current window with 25 seconds remaining. How many more requests can it make safely?"
  },
  {
    "id": "r-12",
    "prompt": "If the orchestrator must NOT proceed unless tests pass AND security audit passes, and tests pass with probability 0.9, audit with 0.85 (independent), what is the probability of proceeding? Round to 3 decimals."
  },
  {
    "id": "r-13",
    "prompt": "A cluster has 12 nodes. 25 percent are reserved for canary deploys. How many nodes serve production traffic?"
  },
  {
    "id": "r-14",
    "prompt": "A batch of 500 tasks is split equally across 8 workers. Each worker takes 2 minutes per task and works in parallel. What is the total wall clock time in minutes? Round up."
  },
  {
    "id": "r-15",
    "prompt": "Token budget is 1 million. The encoder reduces 850 tokens per message to 230. After paying a 148-token CodecFit overhead, what is the maximum number of messages that fit in the budget?"
  },
  {
    "id": "r-16",
    "prompt": "A worker pool of 20 has 4 in CrashLoopBackOff. What percentage is healthy?"
  },
  {
    "id": "r-17",
    "prompt": "An agent received 200 messages. 30 percent were errors. Of the errors, half were retryable. How many retryable errors?"
  },
  {
    "id": "r-18",
    "prompt": "If failover takes 8 minutes and during failover error rate is 60 percent on remaining capacity of 5000 rps, how many failed requests during failover?"
  },
  {
    "id": "r-19",
    "prompt": "Cache hit rate is 85 percent. Cache miss cost is 40ms, hit cost is 2ms. Average latency in ms?"
  },
  {
    "id": "r-20",
    "prompt": "A pipeline has 3 stages A→B→C. A processes 1000 items in 5 min, B in 8 min, C in 3 min. They can pipeline (stage starts as soon as upstream produces). What is end-to-end time for 1000 items? Assume each stage processes items in arrival order and takes proportional time per item."
  }
]