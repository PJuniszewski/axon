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
[
  {
    "id": "t-01",
    "task": "Report that the deployment to production succeeded for all 8 microservices, with health checks passing. Address the report to the orchestrator.",
    "must_contain": [
      "8",
      "orchestrator",
      "production"
    ],
    "response_A": "To the orchestrator: Production deployment completed successfully. All 8 microservices have been deployed and their health checks are passing.",
    "response_B": "DONE @orch [[deploy:prod && svc[8]:run && hchk:pass]]"
  },
  {
    "id": "t-02",
    "task": "Delegate pull request 217 review to the security-agent. Specify that all tests must pass before approval.",
    "must_contain": [
      "217",
      "security-agent",
      "tests"
    ],
    "response_A": "! @security-agent [[rev PR#217 <: tst:pass -> OK]]",
    "response_B": "Security-agent, please take over the review of pull request 217. Note that all tests must pass before you approve it."
  },
  {
    "id": "t-03",
    "task": "Report an error: the payment service timed out after 30 seconds. State you will retry with exponential backoff, maximum 5 attempts.",
    "must_contain": [
      "payment",
      "30",
      "5"
    ],
    "response_A": "Error: the payment service request timed out after 30 seconds. I will retry using exponential backoff, with a maximum of 5 attempts.",
    "response_B": "ERR pay.svc:T/O<<30s>> -> RPT expbkf<<max:5>>"
  },
  {
    "id": "t-04",
    "task": "Query the inventory service status. Set a timeout of 5 seconds.",
    "must_contain": [
      "inventory",
      "5"
    ],
    "response_A": "? @inventory.svc [[status]] T/O<<5s>>",
    "response_B": "Inventory service, please report your current status. Timeout is set to 5 seconds."
  },
  {
    "id": "t-05",
    "task": "Issue an urgent alert: the load balancer is unresponsive and all traffic is affected. Escalate to the infrastructure team.",
    "must_contain": [
      "load balancer",
      "infrastructure"
    ],
    "response_A": "URGENT ALERT: the load balancer is unresponsive and all traffic is affected. Escalating to the infrastructure team for immediate action.",
    "response_B": "!! @infra [[lb:unresp && traffic:_]] -> esc"
  },
  {
    "id": "t-06",
    "task": "Request a batch job across 12 workers: each scrapes the top 10 results for its assigned keyword, then sends structured output to the aggregator agent.",
    "must_contain": [
      "12",
      "10",
      "aggregator"
    ],
    "response_A": "! @worker[12] [[scrape <: top:10 | kw:assign]] | @aggregator",
    "response_B": "Launching a batch job across 12 workers. Each worker: scrape the top 10 results for your assigned keyword, then send structured output to the aggregator agent."
  },
  {
    "id": "t-07",
    "task": "Inform the orchestrator that the database query returned 5841 records, with 22 excluded as malformed.",
    "must_contain": [
      "5841",
      "22",
      "orchestrator"
    ],
    "response_A": "To the orchestrator: the database query returned 5841 records. Of these, 22 were excluded as malformed.",
    "response_B": "== @orch [[db.q:5841 && malformed:22 -> excl]]"
  },
  {
    "id": "t-08",
    "task": "Reject the merge of pull request 99. Cite that there are 2 unresolved review comments and 1 failing CI check.",
    "must_contain": [
      "99",
      "2",
      "1"
    ],
    "response_A": "NO merge PR#99 <<rev.cmt:2 && ci:fail#1>>",
    "response_B": "Rejecting the merge of pull request 99. Reason: 2 review comments remain unresolved and 1 CI check is failing."
  },
  {
    "id": "t-09",
    "task": "Acknowledge and confirm proceeding with rollback to version 3.1.4 on the auth-gateway service.",
    "must_contain": [
      "3.1.4",
      "auth-gateway"
    ],
    "response_A": "Acknowledged. Proceeding with rollback of the auth-gateway service to version 3.1.4.",
    "response_B": "OK [[rollback @auth-gateway : v3.1.4]]"
  },
  {
    "id": "t-10",
    "task": "Retry the failed transaction for user u-44291 using the secondary processor.",
    "must_contain": [
      "u-44291",
      "secondary"
    ],
    "response_A": "RPT tx<<user:u-44291>> | proc:secondary",
    "response_B": "Retrying the failed transaction for user u-44291 via the secondary processor."
  },
  {
    "id": "t-11",
    "task": "Inform: error rate over the last 10 minutes is 6.5 percent, up from 0.4 percent over the prior hour.",
    "must_contain": [
      "10",
      "6.5",
      "0.4"
    ],
    "response_A": "Notice: error rate over the last 10 minutes is 6.5%, up from 0.4% over the prior hour.",
    "response_B": "== [[err.rate:6.5% <<10m>> && prior:0.4% <<1h>>]]"
  },
  {
    "id": "t-12",
    "task": "Request: do not deploy to production until the security audit has passed.",
    "must_contain": [
      "production",
      "audit"
    ],
    "response_A": "! [[deploy:prod NO -> sec.audit:pass]]",
    "response_B": "Request: please hold all production deployments until the security audit has passed."
  },
  {
    "id": "t-13",
    "task": "Inform: the auth-service fails only for users in the EU region, and only during peak hours. Hypothesis: rate limiting.",
    "must_contain": [
      "auth-service",
      "EU",
      "rate"
    ],
    "response_A": "Notice: the auth-service is failing only for users in the EU region, and only during peak hours. Working hypothesis: rate limiting.",
    "response_B": "== [[auth.svc:fail <: region:EU && time:peak]] # hyp:ratelimit"
  },
  {
    "id": "t-14",
    "task": "Aggregate results from worker-1, worker-2, worker-3 into a single report addressed to the orchestrator.",
    "must_contain": [
      "worker-1",
      "worker-2",
      "worker-3",
      "orchestrator"
    ],
    "response_A": "SUM @orch [[worker-1 +> worker-2 +> worker-3]]",
    "response_B": "To the orchestrator: aggregated report from worker-1, worker-2, and worker-3 consolidated into a single report as requested."
  },
  {
    "id": "t-15",
    "task": "Confirm: rate limit reached for tenant t-9921: 1000 requests per minute exceeded. Throttling for the next 60 seconds.",
    "must_contain": [
      "t-9921",
      "1000",
      "60"
    ],
    "response_A": "Confirmed: rate limit reached for tenant t-9921. The threshold of 1000 requests per minute has been exceeded. Throttling will be in effect for the next 60 seconds.",
    "response_B": "OK [[ratelimit <<tenant:t-9921>> : 1000rpm >= excd -> throttle<<60s>>]]"
  }
]