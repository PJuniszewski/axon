/**
 * Quality benchmark corpus — 30 annotated agent messages.
 *
 * Each entry has:
 *   - nl: the natural-language original
 *   - entities: ground-truth facts that MUST survive compression
 *       - numbers: numeric quantities (PR IDs, counts, timeouts)
 *       - ids: alphanumeric identifiers (service names, agent names, regions)
 *       - intent: high-level performative (request, error, complete, etc.)
 *       - qualifiers: probabilistic/scope hedges ("might", "only", "approximately")
 *
 * Used by:
 *   - 02_entity_preservation: deterministic check that entities appear in AXON output
 *   - 03_roundtrip_fidelity: round-trip semantic similarity
 *   - 04_hallucination_rate: ground truth for decode comparison
 */

export interface AnnotatedMessage {
  id: string;
  category: string;
  nl: string;
  entities: {
    numbers: (string | number)[];
    ids: string[];
    intent: string;
    qualifiers: string[];
  };
}

export const CORPUS: AnnotatedMessage[] = [
  {
    id: "qm-01",
    category: "delegation",
    nl: "Please delegate the code review of pull request 42 to the security-agent. Make sure all 47 tests pass before approving.",
    entities: { numbers: [42, 47], ids: ["security-agent", "PR"], intent: "delegate", qualifiers: ["all", "before"] },
  },
  {
    id: "qm-02",
    category: "error",
    nl: "The payment service returned a 500 error after a 30-second timeout. Retrying with exponential backoff, maximum 5 attempts.",
    entities: { numbers: [500, 30, 5], ids: ["payment"], intent: "error", qualifiers: ["maximum", "exponential"] },
  },
  {
    id: "qm-03",
    category: "completion",
    nl: "Deployment complete. All 12 microservices are running on the production Kubernetes cluster, all health checks passing.",
    entities: { numbers: [12], ids: ["production", "kubernetes"], intent: "complete", qualifiers: ["all"] },
  },
  {
    id: "qm-04",
    category: "query",
    nl: "What is the current status of the user-service in the eu-west-1 region?",
    entities: { numbers: [], ids: ["user-service", "eu-west-1"], intent: "query", qualifiers: [] },
  },
  {
    id: "qm-05",
    category: "urgent",
    nl: "URGENT: The primary load balancer is unresponsive. All traffic affected. Immediate infrastructure team action required.",
    entities: { numbers: [], ids: ["load balancer", "infrastructure"], intent: "urgent", qualifiers: ["primary", "all", "immediate"] },
  },
  {
    id: "qm-06",
    category: "inform-quantified",
    nl: "Database query complete: 1247 records matched the filter criteria, 3 were excluded as malformed.",
    entities: { numbers: [1247, 3], ids: ["database"], intent: "inform", qualifiers: [] },
  },
  {
    id: "qm-07",
    category: "conditional",
    nl: "If the test suite passes for all 24 services, proceed to deploy to staging. Otherwise, report failures back to the orchestrator.",
    entities: { numbers: [24], ids: ["staging", "orchestrator"], intent: "request", qualifiers: ["if", "otherwise", "all"] },
  },
  {
    id: "qm-08",
    category: "qualified-error",
    nl: "We noticed that the auth-service only fails for EU users, and only during peak hours. It might be rate limiting.",
    entities: { numbers: [], ids: ["auth-service", "EU"], intent: "inform", qualifiers: ["only", "only", "might", "noticed"] },
  },
  {
    id: "qm-09",
    category: "batch-request",
    nl: "Dispatch batch job to all 8 worker agents: scrape the top 10 results per keyword and return structured data.",
    entities: { numbers: [8, 10], ids: ["worker"], intent: "request", qualifiers: ["all", "top"] },
  },
  {
    id: "qm-10",
    category: "filter-aggregate",
    nl: "Fetch records from users-db where status equals pending and created_at is less than 30 days, then aggregate by region.",
    entities: { numbers: [30], ids: ["users-db", "pending"], intent: "request", qualifiers: ["less than"] },
  },
  {
    id: "qm-11",
    category: "confirm",
    nl: "Acknowledged. Proceeding with the rollback to version 2.4.1 on the api-gateway service.",
    entities: { numbers: ["2.4.1"], ids: ["api-gateway"], intent: "confirm", qualifiers: [] },
  },
  {
    id: "qm-12",
    category: "reject",
    nl: "Cannot approve the merge. Pull request 88 has 3 unresolved comments and 2 failing CI checks.",
    entities: { numbers: [88, 3, 2], ids: ["PR", "CI"], intent: "reject", qualifiers: ["unresolved", "failing"] },
  },
  {
    id: "qm-13",
    category: "merge-results",
    nl: "Combine the outputs from worker-1, worker-2, and worker-3 into a single aggregated report.",
    entities: { numbers: [1, 2, 3], ids: ["worker-1", "worker-2", "worker-3"], intent: "merge", qualifiers: [] },
  },
  {
    id: "qm-14",
    category: "retry",
    nl: "Retry the failed payment transaction for user 88421 using the secondary processor.",
    entities: { numbers: [88421], ids: ["payment", "secondary"], intent: "retry", qualifiers: ["failed"] },
  },
  {
    id: "qm-15",
    category: "timeout-constraint",
    nl: "Query the inventory service, but timeout after 5 seconds if no response.",
    entities: { numbers: [5], ids: ["inventory"], intent: "query", qualifiers: ["after", "if no response"] },
  },
  {
    id: "qm-16",
    category: "scope-local",
    nl: "Update the local cache only. Do not propagate the change to other nodes yet.",
    entities: { numbers: [], ids: ["cache"], intent: "request", qualifiers: ["only", "not", "yet"] },
  },
  {
    id: "qm-17",
    category: "existential-check",
    nl: "Check if any of the worker pods are in CrashLoopBackOff state.",
    entities: { numbers: [], ids: ["worker", "CrashLoopBackOff"], intent: "query", qualifiers: ["any"] },
  },
  {
    id: "qm-18",
    category: "null-result",
    nl: "Search returned no matching records for the customer ID c-44291.",
    entities: { numbers: ["c-44291"], ids: ["customer"], intent: "inform", qualifiers: ["no"] },
  },
  {
    id: "qm-19",
    category: "comparison",
    nl: "Latency on the search endpoint is greater than 500ms. Threshold breached.",
    entities: { numbers: [500], ids: ["search"], intent: "inform", qualifiers: ["greater than", "breached"] },
  },
  {
    id: "qm-20",
    category: "multi-clause",
    nl: "Restart the metrics-collector on hosts host-01 and host-02, then verify Prometheus scraping resumes within 60 seconds.",
    entities: { numbers: ["01", "02", 60], ids: ["metrics-collector", "host-01", "host-02", "Prometheus"], intent: "request", qualifiers: ["within"] },
  },
  {
    id: "qm-21",
    category: "long-causal",
    nl: "The deployment to staging failed because the database migration timed out after 120 seconds, which caused the readiness probe to fail, which triggered a rollback to the previous version.",
    entities: { numbers: [120], ids: ["staging", "database"], intent: "error", qualifiers: ["because", "after", "caused", "triggered"] },
  },
  {
    id: "qm-22",
    category: "ambiguous-pronoun",
    nl: "Send the report to the orchestrator before it expires.",
    entities: { numbers: [], ids: ["orchestrator"], intent: "request", qualifiers: ["before"] },
  },
  {
    id: "qm-23",
    category: "hedged-finding",
    nl: "Preliminary analysis suggests that approximately 15 percent of requests are timing out, but we need more samples to confirm.",
    entities: { numbers: [15], ids: [], intent: "inform", qualifiers: ["preliminary", "suggests", "approximately", "more samples", "confirm"] },
  },
  {
    id: "qm-24",
    category: "negation",
    nl: "Do not deploy to production until the security audit has passed.",
    entities: { numbers: [], ids: ["production"], intent: "request", qualifiers: ["not", "until"] },
  },
  {
    id: "qm-25",
    category: "metric-window",
    nl: "Error rate over the last 15 minutes is 4.2 percent, up from 0.3 percent over the prior hour.",
    entities: { numbers: [15, 4.2, 0.3], ids: [], intent: "inform", qualifiers: ["over", "up from", "prior"] },
  },
  {
    id: "qm-26",
    category: "version-bump",
    nl: "Upgrade the redis-cluster from version 6.2.7 to 7.0.5 during the maintenance window starting at 02:00 UTC.",
    entities: { numbers: ["6.2.7", "7.0.5", "02:00"], ids: ["redis-cluster", "UTC"], intent: "request", qualifiers: ["during"] },
  },
  {
    id: "qm-27",
    category: "permission",
    nl: "User u-9921 does not have permission to access the billing-service endpoint /admin/refunds.",
    entities: { numbers: ["u-9921"], ids: ["billing-service", "/admin/refunds"], intent: "reject", qualifiers: ["not"] },
  },
  {
    id: "qm-28",
    category: "rate-limit",
    nl: "Rate limit reached for tenant t-5544: 1000 requests per minute exceeded. Throttling for next 60 seconds.",
    entities: { numbers: ["t-5544", 1000, 60], ids: ["tenant"], intent: "inform", qualifiers: ["exceeded", "next"] },
  },
  {
    id: "qm-29",
    category: "chained-deps",
    nl: "Worker-7 cannot proceed because worker-4 has not yet produced output, which depends on the queue-consumer finishing batch 33.",
    entities: { numbers: [7, 4, 33], ids: ["queue-consumer"], intent: "inform", qualifiers: ["because", "not yet", "depends on"] },
  },
  {
    id: "qm-30",
    category: "approval-required",
    nl: "Deployment proposal ready for review. 3 reviewers must approve before this can proceed: alice, bob, carol.",
    entities: { numbers: [3], ids: ["alice", "bob", "carol"], intent: "request", qualifiers: ["must", "before"] },
  },
];
