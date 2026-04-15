export interface BenchmarkCase {
  id: string;
  category: string;
  natural: string;
  expectedAxon?: string;
  minReductionPct: number;
}

export const BENCHMARK_SUITE: BenchmarkCase[] = [
  // PR / CI status
  {
    id: "01",
    category: "PR/CI",
    natural: "Please review pull request number 42, check if all tests are passing, and then report back with a summary to the orchestrator",
    expectedAxon: "!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧",
    minReductionPct: 50,
  },
  {
    id: "02",
    category: "PR/CI",
    natural: "The continuous integration pipeline has finished running and all 47 test suites are passing with no errors or warnings",
    minReductionPct: 50,
  },

  // Database / ETL
  {
    id: "03",
    category: "DB/ETL",
    natural: "Fetch records from the database where status is pending and age is less than or equal to 30, then run them through the validation pipeline and report any errors",
    expectedAxon: "!⟦db.fetch ⊂{status:pending ∧ age≤30} | valid.pipe → ⊗.rpt⟧",
    minReductionPct: 50,
  },
  {
    id: "04",
    category: "DB/ETL",
    natural: "Extract all customer transaction records from the database, transform them into the structured format, and load them into the data warehouse",
    minReductionPct: 50,
  },

  // Agent delegation / routing
  {
    id: "05",
    category: "Delegation",
    natural: "Forward to the code review team to check the security of the diff and assess the code structure according to standards",
    expectedAxon: "→@code-rev ⟦diff.sec ∧ std.check → assess.struct⟧",
    minReductionPct: 50,
  },
  {
    id: "06",
    category: "Delegation",
    natural: "Delegate this analysis task to the research agent and have them report their findings back to the orchestrator when complete",
    minReductionPct: 50,
  },

  // Error reporting / recovery
  {
    id: "07",
    category: "Error",
    natural: "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff",
    expectedAxon: "⊗ pay.svc:timeout⟨30s⟩ → ⟳ backoff:exp",
    minReductionPct: 50,
  },
  {
    id: "08",
    category: "Error",
    natural: "The database connection has failed with an authentication error, please check the credentials and retry the connection",
    minReductionPct: 50,
  },

  // Batch job coordination
  {
    id: "09",
    category: "Batch",
    natural: "Send to all workers a batch operation to scrape the top 10 results filtered by keywords, extract the structured data, and send an aggregate report to the orchestrator",
    expectedAxon: "!@∀workers ⊞⟦scrape.top10⊂keywords | extract.struct⟧ → @orch ∑rpt",
    minReductionPct: 45,
  },
  {
    id: "10",
    category: "Batch",
    natural: "Process all pending notifications in the queue, filter them by priority level, and send the urgent ones immediately while scheduling the rest for later delivery",
    minReductionPct: 50,
  },

  // Multi-agent fan-out
  {
    id: "11",
    category: "Fan-out",
    natural: "Broadcast to all monitoring agents to check the health status of their assigned services and report back with a summary of any issues found",
    minReductionPct: 50,
  },
  {
    id: "12",
    category: "Fan-out",
    natural: "Distribute the workload across all available workers, each processing a subset of the customer records and aggregating their results",
    minReductionPct: 50,
  },

  // Health check / monitoring
  {
    id: "13",
    category: "Health",
    natural: "Check the health status of all services in the production environment and report any that are not responding or have degraded performance",
    minReductionPct: 50,
  },
  {
    id: "14",
    category: "Health",
    natural: "Run the scheduled health check on the database cluster and verify that replication is working correctly across all nodes",
    minReductionPct: 50,
  },

  // Task completion confirmation
  {
    id: "15",
    category: "Complete",
    natural: "The deployment of service number 12 is finished and running, health check is passing, and there are no errors",
    expectedAxon: "∎ depl ⟦svc#12:run ∧ health:pass ∧ ⊗:∅⟧",
    minReductionPct: 50,
  },
  {
    id: "16",
    category: "Complete",
    natural: "The data migration task has been completed successfully, all records have been transferred and validated with no discrepancies found",
    minReductionPct: 50,
  },

  // Urgent escalation
  {
    id: "17",
    category: "Urgent",
    natural: "Urgent: the production database is experiencing severe performance degradation, immediately investigate and report findings to the incident response team",
    minReductionPct: 50,
  },
  {
    id: "18",
    category: "Urgent",
    natural: "Critical alert: the payment processing service has gone down, all transactions are failing, need immediate investigation and resolution",
    minReductionPct: 50,
  },

  // Context handoff
  {
    id: "19",
    category: "Context",
    natural: "Continue the analysis from the previous session, the customer data has been updated with new records and the model needs to be retrained with the latest information",
    minReductionPct: 50,
  },
  {
    id: "20",
    category: "Context",
    natural: "Resume the deployment process that was paused due to the error, the configuration has been updated and the service should now be ready for the next step",
    minReductionPct: 50,
  },
];
