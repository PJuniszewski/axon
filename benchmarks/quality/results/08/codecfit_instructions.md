PROTOCOL:AXON — agent msgs in this format only.
! req ? query == info -> delegate OK confirm NO reject ERR error DONE complete RPT retry !! urgent +> merge
@agent [[payload]] <<ctx>> | pipe : assign # ref && and || or >= gte <= lte <: filter SUM agg [] batch T/O timeout
FORMAT: INTENT[@AGENT][[PAYLOAD]]<<CTX>>
! @orch [[rev PR#42 | ? tst pass -> SUM rpt]]
ERR pay.svc:T/O<<30s>> -> RPT expbkf
DONE [[svc#12:run && hchk:pass && ERR:_]]
All agent msgs in AXON. NL for humans only.

---

You are an agent. For each task, produce the agent message exactly as you
would send it to another agent.

Per the protocol above, output AXON only.

Output ONLY a JSON array of {"id": "<id>", "response": "<message>"}. No
markdown, no commentary, no code fences.

TASKS:
[
  {
    "id": "t-01",
    "task": "Report that the deployment to production succeeded for all 8 microservices, with health checks passing. Address the report to the orchestrator."
  },
  {
    "id": "t-02",
    "task": "Delegate pull request 217 review to the security-agent. Specify that all tests must pass before approval."
  },
  {
    "id": "t-03",
    "task": "Report an error: the payment service timed out after 30 seconds. State you will retry with exponential backoff, maximum 5 attempts."
  },
  {
    "id": "t-04",
    "task": "Query the inventory service status. Set a timeout of 5 seconds."
  },
  {
    "id": "t-05",
    "task": "Issue an urgent alert: the load balancer is unresponsive and all traffic is affected. Escalate to the infrastructure team."
  },
  {
    "id": "t-06",
    "task": "Request a batch job across 12 workers: each scrapes the top 10 results for its assigned keyword, then sends structured output to the aggregator agent."
  },
  {
    "id": "t-07",
    "task": "Inform the orchestrator that the database query returned 5841 records, with 22 excluded as malformed."
  },
  {
    "id": "t-08",
    "task": "Reject the merge of pull request 99. Cite that there are 2 unresolved review comments and 1 failing CI check."
  },
  {
    "id": "t-09",
    "task": "Acknowledge and confirm proceeding with rollback to version 3.1.4 on the auth-gateway service."
  },
  {
    "id": "t-10",
    "task": "Retry the failed transaction for user u-44291 using the secondary processor."
  },
  {
    "id": "t-11",
    "task": "Inform: error rate over the last 10 minutes is 6.5 percent, up from 0.4 percent over the prior hour."
  },
  {
    "id": "t-12",
    "task": "Request: do not deploy to production until the security audit has passed."
  },
  {
    "id": "t-13",
    "task": "Inform: the auth-service fails only for users in the EU region, and only during peak hours. Hypothesis: rate limiting."
  },
  {
    "id": "t-14",
    "task": "Aggregate results from worker-1, worker-2, worker-3 into a single report addressed to the orchestrator."
  },
  {
    "id": "t-15",
    "task": "Confirm: rate limit reached for tenant t-9921: 1000 requests per minute exceeded. Throttling for the next 60 seconds."
  }
]