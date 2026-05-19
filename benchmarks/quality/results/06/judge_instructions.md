You are a semantic similarity judge.

You are scoring how well a DECODED message preserves the meaning of an ORIGINAL message.

Score 0–10 with these anchors. Be strict.

10 — every fact, number, identifier, qualifier (e.g. "all", "only", "might", "approximately"),
     and intent is preserved. Reader of the decoded version would draw identical conclusions.
 7 — all hard facts and identifiers preserved; some qualifiers softened or dropped, but no
     reader would be misled in practice.
 5 — core facts preserved, but quantitative or scope qualifiers lost (e.g. "all" → silently
     dropped; "might" → asserted as fact); a careful reader could draw a different conclusion.
 3 — at least one hard fact wrong or hallucinated (e.g. invented number, wrong service name).
 0 — fundamentally different meaning, or pure hallucination.

Output ONLY a JSON object: {"score": <int 0-10>, "missing": ["..."], "added": ["..."], "rationale": "<= 30 words"}

For EACH item, output one judgement.

Output ONLY a JSON array of {"id", "score", "missing", "added", "rationale"}.
No markdown, no commentary.

PAYLOAD:
[
  {
    "id": "th-01-m0-h1",
    "hop": 1,
    "original": "Alert: payment-svc returning 500 errors at 14:32 UTC. Error rate 8.2 percent.",
    "decoded": "Information: Alert that the payment service is returning HTTP 500 errors as of 14:32 UTC. The error rate is 82 percent."
  },
  {
    "id": "th-01-m0-h2",
    "hop": 2,
    "original": "Alert: payment-svc returning 500 errors at 14:32 UTC. Error rate 8.2 percent.",
    "decoded": "Informational alert: the payment service is returning HTTP 500 errors as of 14:32 UTC, with an error rate of 82 percent."
  },
  {
    "id": "th-01-m0-h3",
    "hop": 3,
    "original": "Alert: payment-svc returning 500 errors at 14:32 UTC. Error rate 8.2 percent.",
    "decoded": "Information alert: the payment service is returning HTTP 500 errors as of 14:32 UTC, with an error rate of 82 percent."
  },
  {
    "id": "th-01-m1-h1",
    "hop": 1,
    "original": "Acknowledged. Delegating diagnosis to sre-agent. Set priority P1.",
    "decoded": "Confirmation from the SRE agent: Acknowledged. Delegating diagnosis. Setting priority to P1."
  },
  {
    "id": "th-01-m1-h2",
    "hop": 2,
    "original": "Acknowledged. Delegating diagnosis to sre-agent. Set priority P1.",
    "decoded": "Confirmation: the SRE agent has acknowledged the request. Diagnosis has been delegated and the priority has been set to P1."
  },
  {
    "id": "th-01-m1-h3",
    "hop": 3,
    "original": "Acknowledged. Delegating diagnosis to sre-agent. Set priority P1.",
    "decoded": "Confirmation: the SRE agent has acknowledged the request, diagnostics have been delegated, and the priority is set to P1."
  },
  {
    "id": "th-02-m0-h1",
    "hop": 1,
    "original": "Starting nightly ETL run job-id etl-2456. Source: postgres replica-2. Target: warehouse.",
    "decoded": "Request: Start the nightly ETL run with job id etl-2456. The source is the Postgres replica-2 and the target is the warehouse."
  },
  {
    "id": "th-02-m0-h2",
    "hop": 2,
    "original": "Starting nightly ETL run job-id etl-2456. Source: postgres replica-2. Target: warehouse.",
    "decoded": "Request: start the nightly ETL run with job id etl-2456, sourced from Postgres replica-2 and targeted at the warehouse."
  },
  {
    "id": "th-02-m0-h3",
    "hop": 3,
    "original": "Starting nightly ETL run job-id etl-2456. Source: postgres replica-2. Target: warehouse.",
    "decoded": "Request to start the nightly ETL run, job id etl-2456, source is Postgres replica-2, target is the warehouse."
  },
  {
    "id": "th-02-m1-h1",
    "hop": 1,
    "original": "Extracted 4 million 200 thousand rows from orders table. Skipped 14 corrupt rows.",
    "decoded": "Request: Extract 4,200,000 rows from the orders table. Skip 14 corrupted rows."
  },
  {
    "id": "th-02-m1-h2",
    "hop": 2,
    "original": "Extracted 4 million 200 thousand rows from orders table. Skipped 14 corrupt rows.",
    "decoded": "Request: extract 4,200,000 rows from the orders table, skipping 14 corrupted rows."
  },
  {
    "id": "th-02-m1-h3",
    "hop": 3,
    "original": "Extracted 4 million 200 thousand rows from orders table. Skipped 14 corrupt rows.",
    "decoded": "Request to extract 4,200,000 rows from the orders table, skipping 14 corrupt rows."
  },
  {
    "id": "th-03-m0-h1",
    "hop": 1,
    "original": "Build sec-build-553 complete. Static analysis flagged 3 medium findings in module auth-handler.",
    "decoded": "Request: Build sec-build-553 is complete. Static analysis flagged 3 medium-severity results in the auth-handler module."
  },
  {
    "id": "th-03-m0-h2",
    "hop": 2,
    "original": "Build sec-build-553 complete. Static analysis flagged 3 medium findings in module auth-handler.",
    "decoded": "Request: build sec-build-553 is complete. Static analysis flagged 3 medium-severity results in the auth-handler module."
  },
  {
    "id": "th-03-m0-h3",
    "hop": 3,
    "original": "Build sec-build-553 complete. Static analysis flagged 3 medium findings in module auth-handler.",
    "decoded": "Request: build sec-build-553 is complete; static analysis flagged 3 medium-severity results in the auth-handler module."
  },
  {
    "id": "th-03-m1-h1",
    "hop": 1,
    "original": "Delegating triage to security-agent. Severity threshold for blocking: high or above.",
    "decoded": "Request to the security agent: Delegate triage; the severity threshold for blocking is high and above."
  },
  {
    "id": "th-03-m1-h2",
    "hop": 2,
    "original": "Delegating triage to security-agent. Severity threshold for blocking: high or above.",
    "decoded": "Delegation to the security agent: request to delegate triage; the severity threshold is set to block high and above."
  },
  {
    "id": "th-03-m1-h3",
    "hop": 3,
    "original": "Delegating triage to security-agent. Severity threshold for blocking: high or above.",
    "decoded": "Delegate to the security agent: delegation requested for triage, with the severity threshold set to block high and above."
  },
  {
    "id": "th-04-m0-h1",
    "hop": 1,
    "original": "Latency from us-east-1 to clients in eu-central-1 spiked to 380 milliseconds. Threshold: 200.",
    "decoded": "Request: Latency for us-east-1 clients in eu-central-1 spiked to 380 milliseconds, exceeding the threshold of 200."
  },
  {
    "id": "th-04-m0-h2",
    "hop": 2,
    "original": "Latency from us-east-1 to clients in eu-central-1 spiked to 380 milliseconds. Threshold: 200.",
    "decoded": "Request: latency from us-east-1 clients to eu-central-1 has spiked to 380 milliseconds, exceeding the threshold of 200."
  },
  {
    "id": "th-04-m0-h3",
    "hop": 3,
    "original": "Latency from us-east-1 to clients in eu-central-1 spiked to 380 milliseconds. Threshold: 200.",
    "decoded": "Request: latency from us-east-1 clients to eu-central-1 has spiked to 380 milliseconds, exceeding the threshold of 200."
  },
  {
    "id": "th-04-m1-h1",
    "hop": 1,
    "original": "Considering failover. Current traffic on us-east-1: 12 thousand requests per second.",
    "decoded": "Request: Confirm failover. Current traffic on us-east-1 is 12,000 requests per second."
  },
  {
    "id": "th-04-m1-h2",
    "hop": 2,
    "original": "Considering failover. Current traffic on us-east-1: 12 thousand requests per second.",
    "decoded": "Confirmation requested: confirm the failover. Current traffic in us-east-1 is 12,000 requests per second."
  },
  {
    "id": "th-04-m1-h3",
    "hop": 3,
    "original": "Considering failover. Current traffic on us-east-1: 12 thousand requests per second.",
    "decoded": "Confirmation: requested confirmation of failover; current traffic on us-east-1 is 12,000 requests per second."
  },
  {
    "id": "th-05-m0-h1",
    "hop": 1,
    "original": "Starting training run train-9911 on model gpt-medium-v3. Dataset: combined-v7 with 1.2 million examples.",
    "decoded": "Request: Start the training run train-9911 for model gpt-medium-v3. The dataset is combined-v7 with 12,000,000 examples."
  },
  {
    "id": "th-05-m0-h2",
    "hop": 2,
    "original": "Starting training run train-9911 on model gpt-medium-v3. Dataset: combined-v7 with 1.2 million examples.",
    "decoded": "Request: start the training run train-9911 using model gpt-medium-v3 on the combined-v7 dataset with 12,000,000 examples."
  },
  {
    "id": "th-05-m0-h3",
    "hop": 3,
    "original": "Starting training run train-9911 on model gpt-medium-v3. Dataset: combined-v7 with 1.2 million examples.",
    "decoded": "Request to start training run train-9911 with model gpt-medium-v3 on the combined-v7 dataset of 12,000,000 examples."
  },
  {
    "id": "th-05-m1-h1",
    "hop": 1,
    "original": "Optimizer: AdamW with learning rate 2e-5 and weight decay 0.01. Batch size 32 per GPU across 8 GPUs.",
    "decoded": "Request: Optimizer is AdamW with learning rate 2e-5 and weight decay 0.01. Batch size is 32, using 8 GPUs."
  },
  {
    "id": "th-05-m1-h2",
    "hop": 2,
    "original": "Optimizer: AdamW with learning rate 2e-5 and weight decay 0.01. Batch size 32 per GPU across 8 GPUs.",
    "decoded": "Request: use the AdamW optimizer with a learning rate of 2e-5, weight decay of 0.01, batch size of 32, on 8 GPUs."
  },
  {
    "id": "th-05-m1-h3",
    "hop": 3,
    "original": "Optimizer: AdamW with learning rate 2e-5 and weight decay 0.01. Batch size 32 per GPU across 8 GPUs.",
    "decoded": "Request to use the AdamW optimizer with learning rate 2e-5, weight decay 0.01, batch size 32, on 8 GPUs."
  }
]