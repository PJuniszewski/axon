You are a strict fact-delta judge.

You are comparing a DECODED message against the ORIGINAL it was derived from.

List, separately:
  - facts_lost: facts present in ORIGINAL but missing from DECODED
  - facts_added: facts present in DECODED but NOT in ORIGINAL (hallucinations)
  - facts_modified: facts present in both but with changed values (e.g. wrong number)

A "fact" is a named entity, number, qualifier, scope, condition, or intent.
Be precise. Quote the exact fact in <=10 words.

Output ONLY a JSON object:
{"facts_lost": ["..."], "facts_added": ["..."], "facts_modified": ["..."]}

For EACH item in the payload, produce one delta object.

Output ONLY a JSON array of {"id", "facts_lost", "facts_added", "facts_modified"}.
No markdown. No commentary. No code fences.

PAYLOAD:
[
  {
    "id": "qm-01",
    "original": "Please delegate the code review of pull request 42 to the security-agent. Make sure all 47 tests pass before approving.",
    "decoded": "Delegate the code review of pull request 42 to the security agent. Make sure 47 tests pass before approving."
  },
  {
    "id": "qm-02",
    "original": "The payment service returned a 500 error after a 30-second timeout. Retrying with exponential backoff, maximum 5 attempts.",
    "decoded": "Error: the payment service returned a 500 error after a 30-second timeout. Retrying with exponential backoff, maximum 5 attempts."
  },
  {
    "id": "qm-03",
    "original": "Deployment complete. All 12 microservices are running on the production Kubernetes cluster, all health checks passing.",
    "decoded": "Deployment complete: all 12 services are running on the production Kubernetes cluster, and all health checks pass."
  },
  {
    "id": "qm-04",
    "original": "What is the current status of the user-service in the eu-west-1 region?",
    "decoded": "Query: what is the current status of the user-service in the eu-west-1 region?"
  },
  {
    "id": "qm-05",
    "original": "URGENT: The primary load balancer is unresponsive. All traffic affected. Immediate infrastructure team action required.",
    "decoded": "Urgent: the primary load balancer is unresponsive, traffic is affected, and immediate infrastructure team action is required."
  },
  {
    "id": "qm-06",
    "original": "Database query complete: 1247 records matched the filter criteria, 3 were excluded as malformed.",
    "decoded": "Database query complete: 1247 records matched the filter criteria, 3 were excluded as malformed."
  },
  {
    "id": "qm-07",
    "original": "If the test suite passes for all 24 services, proceed to deploy to staging. Otherwise, report failures back to the orchestrator.",
    "decoded": "If the test suite passes for all 24 services, proceed to deploy to staging. Otherwise, report failures to the orchestrator."
  },
  {
    "id": "qm-08",
    "original": "We noticed that the auth-service only fails for EU users, and only during peak hours. It might be rate limiting.",
    "decoded": "Noticed that the auth-service fails for EU users during peak hours; possibly rate limiting."
  },
  {
    "id": "qm-09",
    "original": "Dispatch batch job to all 8 worker agents: scrape the top 10 results per keyword and return structured data.",
    "decoded": "Dispatch a batch job to 8 worker agents: scrape the top 10 results per keyword and return structured data."
  },
  {
    "id": "qm-10",
    "original": "Fetch records from users-db where status equals pending and created_at is less than 30 days, then aggregate by region.",
    "decoded": "Fetch records from users-db where status equals pending and created_at is within 30 days, then aggregate by region."
  },
  {
    "id": "qm-11",
    "original": "Acknowledged. Proceeding with the rollback to version 2.4.1 on the api-gateway service.",
    "decoded": "Acknowledged. Proceeding with the rollback to version 2.4.1 on the api-gateway service."
  },
  {
    "id": "qm-12",
    "original": "Cannot approve the merge. Pull request 88 has 3 unresolved comments and 2 failing CI checks.",
    "decoded": "Cannot approve the merge: pull request 88 has 3 unresolved comments and 2 failing CI checks."
  },
  {
    "id": "qm-13",
    "original": "Combine the outputs from worker-1, worker-2, and worker-3 into a single aggregated report.",
    "decoded": "Combine the outputs from worker-1, worker-2, and worker-3 into a single aggregated report."
  },
  {
    "id": "qm-14",
    "original": "Retry the failed payment transaction for user 88421 using the secondary processor.",
    "decoded": "Retry the failed payment transaction for user 88421 using the secondary processor."
  },
  {
    "id": "qm-15",
    "original": "Query the inventory service, but timeout after 5 seconds if no response.",
    "decoded": "Query the inventory service, with a timeout of 5 seconds for the response."
  },
  {
    "id": "qm-16",
    "original": "Update the local cache only. Do not propagate the change to other nodes yet.",
    "decoded": "Update the local cache only; do not propagate the change to other nodes yet."
  },
  {
    "id": "qm-17",
    "original": "Check if any of the worker pods are in CrashLoopBackOff state.",
    "decoded": "Check whether any worker pods are in CrashLoopBackOff state."
  },
  {
    "id": "qm-18",
    "original": "Search returned no matching records for the customer ID c-44291.",
    "decoded": "Search returned no matching records for the customer ID c-44291."
  },
  {
    "id": "qm-19",
    "original": "Latency on the search endpoint is greater than 500ms. Threshold breached.",
    "decoded": "Latency on the search endpoint is greater than 500ms; threshold breached."
  },
  {
    "id": "qm-20",
    "original": "Restart the metrics-collector on hosts host-01 and host-02, then verify Prometheus scraping resumes within 60 seconds.",
    "decoded": "Restart the metrics-collector on hosts host-01 and host-02, then verify Prometheus scraping resumes within 60 seconds."
  },
  {
    "id": "qm-21",
    "original": "The deployment to staging failed because the database migration timed out after 120 seconds, which caused the readiness probe to fail, which triggered a rollback to the previous version.",
    "decoded": "Error: the deployment to staging failed because the database migration timed out after 120 seconds, which caused the readiness probe to fail, which triggered a rollback to the previous version."
  },
  {
    "id": "qm-22",
    "original": "Send the report to the orchestrator before it expires.",
    "decoded": "Send the report to the orchestrator before it expires."
  },
  {
    "id": "qm-23",
    "original": "Preliminary analysis suggests that approximately 15 percent of requests are timing out, but we need more samples to confirm.",
    "decoded": "Preliminary analysis suggests approximately 15 percent of requests are timing out; more samples are needed to confirm."
  },
  {
    "id": "qm-24",
    "original": "Do not deploy to production until the security audit has passed.",
    "decoded": "Do not deploy to production until the security audit has passed."
  },
  {
    "id": "qm-25",
    "original": "Error rate over the last 15 minutes is 4.2 percent, up from 0.3 percent over the prior hour.",
    "decoded": "Error: error rate over the last 15 minutes is 4.2 percent, up from 0.3 percent over the prior hour."
  },
  {
    "id": "qm-26",
    "original": "Upgrade the redis-cluster from version 6.2.7 to 7.0.5 during the maintenance window starting at 02:00 UTC.",
    "decoded": "Upgrade the redis-cluster from version 6.2.7 to 7.0.5 during the maintenance window starting at 02:00 UTC."
  },
  {
    "id": "qm-27",
    "original": "User u-9921 does not have permission to access the billing-service endpoint /admin/refunds.",
    "decoded": "User u-9921 does not have permission to access the billing-service endpoint /admin/refunds."
  },
  {
    "id": "qm-28",
    "original": "Rate limit reached for tenant t-5544: 1000 requests per minute exceeded. Throttling for next 60 seconds.",
    "decoded": "Rate limit reached for tenant t-5544: 1000 requests per minute exceeded. Throttling for the next 60 seconds."
  },
  {
    "id": "qm-29",
    "original": "Worker-7 cannot proceed because worker-4 has not yet produced output, which depends on the queue-consumer finishing batch 33.",
    "decoded": "Worker-7 cannot proceed because worker-4 has not yet produced output, which depends on the queue-consumer finishing batch 33."
  },
  {
    "id": "qm-30",
    "original": "Deployment proposal ready for review. 3 reviewers must approve before this can proceed: alice, bob, carol.",
    "decoded": "Deployment proposal ready for review. 3 reviewers must approve before this can proceed: alice, bob, and carol."
  }
]