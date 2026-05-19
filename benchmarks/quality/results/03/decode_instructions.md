You are a decoding agent. You will be given a list of AXON-encoded agent messages.
AXON uses these symbols and conventions:

PROTOCOL:AXON — agent msgs in this format only.
! req ? query == info -> delegate OK confirm NO reject ERR error DONE complete RPT retry !! urgent +> merge
@agent [[payload]] <<ctx>> | pipe : assign # ref && and || or >= gte <= lte <: filter SUM agg [] batch T/O timeout
FORMAT: INTENT[@AGENT][[PAYLOAD]]<<CTX>>
! @orch [[rev PR#42 | ? tst pass -> SUM rpt]]
ERR pay.svc:T/O<<30s>> -> RPT expbkf
DONE [[svc#12:run && hchk:pass && ERR:_]]
All agent msgs in AXON. NL for humans only.

For EACH message in the payload below, expand it back to natural English. Do not
add facts that are not present in the AXON. Do not omit facts that are present.
Preserve numbers, identifiers, qualifiers, and intent exactly.

Output ONLY a JSON array of {"id": "<id>", "decoded": "<natural english>"}.
No markdown, no commentary, no code fences. Just the JSON array.

PAYLOAD:
[
  {
    "id": "qm-01",
    "nl": "Please delegate the code review of pull request 42 to the security-agent. Make sure all 47 tests pass before approving.",
    "axon": "→ @security- ⟦dele cr PR 42 Make sure 47 tests pass approving⟧"
  },
  {
    "id": "qm-02",
    "nl": "The payment service returned a 500 error after a 30-second timeout. Retrying with exponential backoff, maximum 5 attempts.",
    "axon": "⊗ ⟦pay svc retu 500 error 30-second T/O retry expbkf max 5 attempts⟧"
  },
  {
    "id": "qm-03",
    "nl": "Deployment complete. All 12 microservices are running on the production Kubernetes cluster, all health checks passing.",
    "axon": "! ⟦depl complete 12 svcs runn prod k8s clu hchks pass⟧"
  },
  {
    "id": "qm-04",
    "nl": "What is the current status of the user-service in the eu-west-1 region?",
    "axon": "? ⟦curr status user-svc eu-west-1 region⟧"
  },
  {
    "id": "qm-05",
    "nl": "URGENT: The primary load balancer is unresponsive. All traffic affected. Immediate infrastructure team action required.",
    "axon": "⚡ ⟦URGENT prim lb unresponsive traf affected Imme infra team action required⟧"
  },
  {
    "id": "qm-06",
    "nl": "Database query complete: 1247 records matched the filter criteria, 3 were excluded as malformed.",
    "axon": "! ⟦db query complete 1247 recs matc filt criteria 3 excl as malformed⟧"
  },
  {
    "id": "qm-07",
    "nl": "If the test suite passes for all 24 services, proceed to deploy to staging. Otherwise, report failures back to the orchestrator.",
    "axon": "≡ ⟦tstste passes 24 svcs proc depl staging Otherwise report fail orch⟧"
  },
  {
    "id": "qm-08",
    "nl": "We noticed that the auth-service only fails for EU users, and only during peak hours. It might be rate limiting.",
    "axon": "! ⟦noti auth-svc fails EU users peak hours rlim⟧"
  },
  {
    "id": "qm-09",
    "nl": "Dispatch batch job to all 8 worker agents: scrape the top 10 results per keyword and return structured data.",
    "axon": "! ⟦Disp batch job 8 wagts scrape top 10 res keyw return sdata⟧"
  },
  {
    "id": "qm-10",
    "nl": "Fetch records from users-db where status equals pending and created_at is less than 30 days, then aggregate by region.",
    "axon": "? ⟦Fetch recs users-db status equals pend created_at 30 days agg region⟧"
  },
  {
    "id": "qm-11",
    "nl": "Acknowledged. Proceeding with the rollback to version 2.4.1 on the api-gateway service.",
    "axon": "✓ ⟦Acknowledged Pro rback vers 241 api-gateway svc⟧"
  },
  {
    "id": "qm-12",
    "nl": "Cannot approve the merge. Pull request 88 has 3 unresolved comments and 2 failing CI checks.",
    "axon": "⊕ ⟦Cannot appr merge PR 88 3 unr comm 2 fail CI checks⟧"
  },
  {
    "id": "qm-13",
    "nl": "Combine the outputs from worker-1, worker-2, and worker-3 into a single aggregated report.",
    "axon": "⊕ ⟦Comb outp wkr-1 wkr-2 wkr-3 single agg report⟧"
  },
  {
    "id": "qm-14",
    "nl": "Retry the failed payment transaction for user 88421 using the secondary processor.",
    "axon": "⊗ ⟦retry fail pay txn user 88421 seco processor⟧"
  },
  {
    "id": "qm-15",
    "nl": "Query the inventory service, but timeout after 5 seconds if no response.",
    "axon": "! ⟦Query inve svc T/O 5 s rsp⟧"
  },
  {
    "id": "qm-16",
    "nl": "Update the local cache only. Do not propagate the change to other nodes yet.",
    "axon": "! Update local cache only prop change nodes yet"
  },
  {
    "id": "qm-17",
    "nl": "Check if any of the worker pods are in CrashLoopBackOff state.",
    "axon": "! Check wkr pods Cra state"
  },
  {
    "id": "qm-18",
    "nl": "Search returned no matching records for the customer ID c-44291.",
    "axon": "! ⟦Search retu matc recs cust ID c-44291⟧"
  },
  {
    "id": "qm-19",
    "nl": "Latency on the search endpoint is greater than 500ms. Threshold breached.",
    "axon": "! ⟦lat search endp grea 500ms thr breached⟧"
  },
  {
    "id": "qm-20",
    "nl": "Restart the metrics-collector on hosts host-01 and host-02, then verify Prometheus scraping resumes within 60 seconds.",
    "axon": "? ⟦rst metrics-collector hosts host-01 host-02 ver Pro scra resu 60 s⟧"
  },
  {
    "id": "qm-21",
    "nl": "The deployment to staging failed because the database migration timed out after 120 seconds, which caused the readiness probe to fail, which triggered a rollback to the previous version.",
    "axon": "⊗ ⟦depl stag fail beca db migr timed 120 s caused read probe fail trig rback prev version⟧"
  },
  {
    "id": "qm-22",
    "nl": "Send the report to the orchestrator before it expires.",
    "axon": "≡ report orch expires"
  },
  {
    "id": "qm-23",
    "nl": "Preliminary analysis suggests that approximately 15 percent of requests are timing out, but we need more samples to confirm.",
    "axon": "✓ ⟦Pre anl sugg ~ 15 pct reqs timing out samp confirm⟧"
  },
  {
    "id": "qm-24",
    "nl": "Do not deploy to production until the security audit has passed.",
    "axon": "! depl prod until sec audit passed"
  },
  {
    "id": "qm-25",
    "nl": "Error rate over the last 15 minutes is 4.2 percent, up from 0.3 percent over the prior hour.",
    "axon": "⊗ ⟦Error rate last 15 min 42 pct 03 pct prior hour⟧"
  },
  {
    "id": "qm-26",
    "nl": "Upgrade the redis-cluster from version 6.2.7 to 7.0.5 during the maintenance window starting at 02:00 UTC.",
    "axon": "! ⟦Upgr redis-clu vers 627 705 mai window star 0200 UTC⟧"
  },
  {
    "id": "qm-27",
    "nl": "User u-9921 does not have permission to access the billing-service endpoint /admin/refunds.",
    "axon": "! ⟦User u-9921 per access billing-svc endp /admin/refunds⟧"
  },
  {
    "id": "qm-28",
    "nl": "Rate limit reached for tenant t-5544: 1000 requests per minute exceeded. Throttling for next 60 seconds.",
    "axon": "! ⟦rlim reac tenant t-5544 1000 reqs minute exceeded Thr 60 s⟧"
  },
  {
    "id": "qm-29",
    "nl": "Worker-7 cannot proceed because worker-4 has not yet produced output, which depends on the queue-consumer finishing batch 33.",
    "axon": "? ⟦wkr-7 cannot proc beca wkr-4 yet prod output depe queue-consumer fini batch 33⟧"
  },
  {
    "id": "qm-30",
    "nl": "Deployment proposal ready for review. 3 reviewers must approve before this can proceed: alice, bob, carol.",
    "axon": "! ⟦depl prop ready review 3 revi must appr proceed alice bob carol⟧"
  }
]