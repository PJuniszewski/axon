/**
 * Multi-message agent conversation threads for context-retrieval tests.
 *
 * Each thread is a sequence of inter-agent messages (NL form). The
 * test will encode the whole thread to AXON, hand it to a fresh LLM,
 * and ask retrieval questions about specific facts mentioned at known
 * positions.
 *
 * Position labels (early / mid / late) test the "lost in the middle"
 * effect — does AXON compression reshape it?
 */

export interface ThreadMessage {
  position: "early" | "mid" | "late";
  speaker: string;
  nl: string;
}

export interface ThreadProbe {
  question: string;
  expected: string;        // the exact fact the model must retrieve
  about_position: "early" | "mid" | "late";
  about_msg_idx: number;   // index in messages[]
}

export interface Thread {
  id: string;
  scenario: string;
  messages: ThreadMessage[];
  probes: ThreadProbe[];
}

export const THREADS: Thread[] = [
  {
    id: "th-01",
    scenario: "Incident response — payment service outage",
    messages: [
      { position: "early", speaker: "monitor", nl: "Alert: payment-svc returning 500 errors at 14:32 UTC. Error rate 8.2 percent." },
      { position: "early", speaker: "orchestrator", nl: "Acknowledged. Delegating diagnosis to sre-agent. Set priority P1." },
      { position: "early", speaker: "sre-agent", nl: "Investigating. Initial check: db connection pool exhausted at 95 of 100 connections." },
      { position: "early", speaker: "sre-agent", nl: "Hypothesis: leak introduced in PR 1142 merged at 13:50 UTC." },
      { position: "mid", speaker: "orchestrator", nl: "Validate hypothesis. Compare connection metric before and after PR 1142." },
      { position: "mid", speaker: "sre-agent", nl: "Confirmed. Connection count climbed from 42 to 95 within 30 minutes of merge." },
      { position: "mid", speaker: "orchestrator", nl: "Approving rollback of PR 1142. Notify deploy-agent." },
      { position: "mid", speaker: "deploy-agent", nl: "Rolling back to revision 2.7.3. Estimated 4 minutes for full cluster restart." },
      { position: "late", speaker: "deploy-agent", nl: "Rollback complete at 14:51 UTC. All 12 pods restarted on revision 2.7.3." },
      { position: "late", speaker: "monitor", nl: "Error rate dropped to 0.1 percent. Connection pool at 38 of 100. Incident resolved." },
    ],
    probes: [
      { question: "What PR was responsible for the incident?", expected: "PR 1142", about_position: "early", about_msg_idx: 3 },
      { question: "What was the connection pool size at peak?", expected: "95 of 100", about_position: "early", about_msg_idx: 2 },
      { question: "What revision did the rollback target?", expected: "2.7.3", about_position: "mid", about_msg_idx: 7 },
      { question: "How long did the deploy-agent estimate for the rollback?", expected: "4 minutes", about_position: "mid", about_msg_idx: 7 },
      { question: "What was the final error rate after rollback?", expected: "0.1 percent", about_position: "late", about_msg_idx: 9 },
      { question: "At what UTC time did the rollback complete?", expected: "14:51 UTC", about_position: "late", about_msg_idx: 8 },
    ],
  },
  {
    id: "th-02",
    scenario: "Multi-step data pipeline with quotas",
    messages: [
      { position: "early", speaker: "scheduler", nl: "Starting nightly ETL run job-id etl-2456. Source: postgres replica-2. Target: warehouse." },
      { position: "early", speaker: "extract-agent", nl: "Extracted 4 million 200 thousand rows from orders table. Skipped 14 corrupt rows." },
      { position: "early", speaker: "transform-agent", nl: "Joined with customers table. Output rows: 4 million 198 thousand 622 valid records." },
      { position: "mid", speaker: "validate-agent", nl: "Schema validation passed. 17 rows had nullable email fields, flagged for review." },
      { position: "mid", speaker: "load-agent", nl: "Loading into warehouse fact_orders. Batch size 50000. Estimated 84 batches." },
      { position: "mid", speaker: "load-agent", nl: "Batch 23 of 84 failed: warehouse quota exceeded at 800 gigabytes of 1 terabyte." },
      { position: "late", speaker: "orchestrator", nl: "Pausing load. Requesting quota increase to 2 terabytes from infra-team." },
      { position: "late", speaker: "infra-team", nl: "Quota raised to 2 terabytes effective immediately. Charged to cost-center cc-9182." },
      { position: "late", speaker: "load-agent", nl: "Resuming from batch 23. Completed all 84 batches in 47 minutes." },
    ],
    probes: [
      { question: "What is the ETL job ID?", expected: "etl-2456", about_position: "early", about_msg_idx: 0 },
      { question: "How many rows did the extract-agent skip?", expected: "14", about_position: "early", about_msg_idx: 1 },
      { question: "At which batch did the load-agent fail?", expected: "batch 23", about_position: "mid", about_msg_idx: 5 },
      { question: "What was the original warehouse quota?", expected: "1 terabyte", about_position: "mid", about_msg_idx: 5 },
      { question: "Which cost-center was charged for the quota increase?", expected: "cc-9182", about_position: "late", about_msg_idx: 7 },
      { question: "How long did the resumed load take?", expected: "47 minutes", about_position: "late", about_msg_idx: 8 },
    ],
  },
  {
    id: "th-03",
    scenario: "Security review with conditional approvals",
    messages: [
      { position: "early", speaker: "ci", nl: "Build sec-build-553 complete. Static analysis flagged 3 medium findings in module auth-handler." },
      { position: "early", speaker: "orchestrator", nl: "Delegating triage to security-agent. Severity threshold for blocking: high or above." },
      { position: "early", speaker: "security-agent", nl: "Finding 1: SQL string interpolation in handleLogin function. Severity medium." },
      { position: "early", speaker: "security-agent", nl: "Finding 2: weak password regex allowing 6-char passwords. Severity medium." },
      { position: "mid", speaker: "security-agent", nl: "Finding 3 escalated to high after manual review: token signing key hardcoded in line 287 of auth.go." },
      { position: "mid", speaker: "orchestrator", nl: "Build blocked. Routing to dev-team for remediation. Tag: sec-blocker." },
      { position: "mid", speaker: "dev-team", nl: "Acknowledged. Estimated fix time: 6 hours. Will rotate compromised key first." },
      { position: "late", speaker: "dev-team", nl: "Key rotated. Old key invalidated for all environments except staging-7 which is being decommissioned." },
      { position: "late", speaker: "security-agent", nl: "Rotation verified across 4 environments. staging-7 marked as exempt with expiry 2026-06-01." },
    ],
    probes: [
      { question: "What build ID was being reviewed?", expected: "sec-build-553", about_position: "early", about_msg_idx: 0 },
      { question: "What severity does the orchestrator consider blocking?", expected: "high or above", about_position: "early", about_msg_idx: 1 },
      { question: "On which line of auth.go was the signing key hardcoded?", expected: "line 287", about_position: "mid", about_msg_idx: 4 },
      { question: "How long did the dev-team estimate for the fix?", expected: "6 hours", about_position: "mid", about_msg_idx: 6 },
      { question: "Which environment was exempted from rotation?", expected: "staging-7", about_position: "late", about_msg_idx: 7 },
      { question: "What is the expiry date for the staging-7 exemption?", expected: "2026-06-01", about_position: "late", about_msg_idx: 8 },
    ],
  },
  {
    id: "th-04",
    scenario: "Multi-region failover decision",
    messages: [
      { position: "early", speaker: "monitor", nl: "Latency from us-east-1 to clients in eu-central-1 spiked to 380 milliseconds. Threshold: 200." },
      { position: "early", speaker: "router-agent", nl: "Considering failover. Current traffic on us-east-1: 12 thousand requests per second." },
      { position: "early", speaker: "capacity-agent", nl: "Standby in eu-central-1 can absorb 8 thousand rps without scaling. 12 thousand requires 2x scale-out." },
      { position: "mid", speaker: "orchestrator", nl: "Approve scale-out then failover. Cost impact: 240 dollars per hour additional during 2x." },
      { position: "mid", speaker: "capacity-agent", nl: "Scale-out triggered. ETA to ready state: 8 minutes." },
      { position: "mid", speaker: "router-agent", nl: "Starting graceful drain on us-east-1. 30-second client deadline before forced cutover." },
      { position: "late", speaker: "router-agent", nl: "Cutover complete. eu-central-1 now serving 11 thousand 800 rps with latency 95 milliseconds." },
      { position: "late", speaker: "orchestrator", nl: "Marking incident incident-7791 resolved. Post-mortem due within 48 hours." },
    ],
    probes: [
      { question: "What was the latency spike value?", expected: "380 milliseconds", about_position: "early", about_msg_idx: 0 },
      { question: "How much traffic was on us-east-1 when failover was considered?", expected: "12 thousand requests per second", about_position: "early", about_msg_idx: 1 },
      { question: "What is the additional cost per hour at 2x scale?", expected: "240 dollars", about_position: "mid", about_msg_idx: 3 },
      { question: "What was the graceful drain deadline?", expected: "30 seconds", about_position: "mid", about_msg_idx: 5 },
      { question: "What is the incident ID?", expected: "incident-7791", about_position: "late", about_msg_idx: 7 },
      { question: "What is the post-mortem deadline?", expected: "48 hours", about_position: "late", about_msg_idx: 7 },
    ],
  },
  {
    id: "th-05",
    scenario: "Training run with checkpoints",
    messages: [
      { position: "early", speaker: "trainer", nl: "Starting training run train-9911 on model gpt-medium-v3. Dataset: combined-v7 with 1.2 million examples." },
      { position: "early", speaker: "trainer", nl: "Optimizer: AdamW with learning rate 2e-5 and weight decay 0.01. Batch size 32 per GPU across 8 GPUs." },
      { position: "early", speaker: "trainer", nl: "Checkpoint 1 at step 1000: loss 2.41, perplexity 11.13, val accuracy 0.62." },
      { position: "mid", speaker: "monitor", nl: "GPU 4 reporting elevated temperature 87 degrees Celsius. Threshold: 85." },
      { position: "mid", speaker: "trainer", nl: "Reducing batch size on GPU 4 from 32 to 24 to lower thermal load." },
      { position: "mid", speaker: "trainer", nl: "Checkpoint 5 at step 5000: loss 1.83, perplexity 6.22, val accuracy 0.78." },
      { position: "late", speaker: "trainer", nl: "Training paused at step 7400 due to gradient explosion. Last stable checkpoint: step 7000." },
      { position: "late", speaker: "orchestrator", nl: "Rolling back to checkpoint at step 7000. Resuming with gradient clipping at norm 1.0." },
    ],
    probes: [
      { question: "What is the training run ID?", expected: "train-9911", about_position: "early", about_msg_idx: 0 },
      { question: "What is the learning rate?", expected: "2e-5", about_position: "early", about_msg_idx: 1 },
      { question: "What was the validation accuracy at checkpoint 1?", expected: "0.62", about_position: "early", about_msg_idx: 2 },
      { question: "Why was GPU 4's batch size reduced?", expected: "temperature / thermal load", about_position: "mid", about_msg_idx: 4 },
      { question: "At which step did the gradient explode?", expected: "step 7400", about_position: "late", about_msg_idx: 6 },
      { question: "What gradient clipping norm was applied on resume?", expected: "1.0", about_position: "late", about_msg_idx: 7 },
    ],
  },
];
