export interface BenchmarkCase {
  id: string;
  category: string;
  natural: string;
  expectedAxon?: string;
}

export const BENCHMARK_SUITE: BenchmarkCase[] = [
  // ── Original 20 cases ──

  // PR / CI status
  { id: "01", category: "PR/CI",      natural: "Please review pull request number 42, check if all tests are passing, and then report back with a summary to the orchestrator" },
  { id: "02", category: "PR/CI",      natural: "The continuous integration pipeline has finished running and all 47 test suites are passing with no errors or warnings" },

  // Database / ETL
  { id: "03", category: "DB/ETL",     natural: "Fetch records from the database where status is pending and age is less than or equal to 30, then run them through the validation pipeline and report any errors" },
  { id: "04", category: "DB/ETL",     natural: "Extract all customer transaction records from the database, transform them into the structured format, and load them into the data warehouse" },

  // Agent delegation / routing
  { id: "05", category: "Delegation", natural: "Forward to the code review team to check the security of the diff and assess the code structure according to standards" },
  { id: "06", category: "Delegation", natural: "Delegate this analysis task to the research agent and have them report their findings back to the orchestrator when complete" },

  // Error reporting / recovery
  { id: "07", category: "Error",      natural: "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff" },
  { id: "08", category: "Error",      natural: "The database connection has failed with an authentication error, please check the credentials and retry the connection" },

  // Batch job coordination
  { id: "09", category: "Batch",      natural: "Send to all workers a batch operation to scrape the top 10 results filtered by keywords, extract the structured data, and send an aggregate report to the orchestrator" },
  { id: "10", category: "Batch",      natural: "Process all pending notifications in the queue, filter them by priority level, and send the urgent ones immediately while scheduling the rest for later delivery" },

  // Multi-agent fan-out
  { id: "11", category: "Fan-out",    natural: "Broadcast to all monitoring agents to check the health status of their assigned services and report back with a summary of any issues found" },
  { id: "12", category: "Fan-out",    natural: "Distribute the workload across all available workers, each processing a subset of the customer records and aggregating their results" },

  // Health check / monitoring
  { id: "13", category: "Health",     natural: "Check the health status of all services in the production environment and report any that are not responding or have degraded performance" },
  { id: "14", category: "Health",     natural: "Run the scheduled health check on the database cluster and verify that replication is working correctly across all nodes" },

  // Task completion confirmation
  { id: "15", category: "Complete",   natural: "The deployment of service number 12 is finished and running, health check is passing, and there are no errors" },
  { id: "16", category: "Complete",   natural: "The data migration task has been completed successfully, all records have been transferred and validated with no discrepancies found" },

  // Urgent escalation
  { id: "17", category: "Urgent",     natural: "Urgent: the production database is experiencing severe performance degradation, immediately investigate and report findings to the incident response team" },
  { id: "18", category: "Urgent",     natural: "Critical alert: the payment processing service has gone down, all transactions are failing, need immediate investigation and resolution" },

  // Context handoff
  { id: "19", category: "Context",    natural: "Continue the analysis from the previous session, the customer data has been updated with new records and the model needs to be retrained with the latest information" },
  { id: "20", category: "Context",    natural: "Resume the deployment process that was paused due to the error, the configuration has been updated and the service should now be ready for the next step" },

  // ── 10 New Long Verbose Cases (30+ NL tokens each) ──

  {
    id: "21",
    category: "DB/ETL",
    natural: "Please fetch all records from the user database where the account status is currently pending and the account age is less than or equal to 30 days, then run them through the validation pipeline and generate a structured error report for any failures that are found",
  },
  {
    id: "22",
    category: "Error",
    natural: "An error has occurred in the payment processing microservice. The service returned a timeout response after waiting 30 seconds for the upstream authentication provider. Please retry the operation using exponential backoff with a maximum of 5 attempts and report the final status back to the orchestrator agent",
  },
  {
    id: "23",
    category: "Delegation",
    natural: "I would like you to forward this security vulnerability assessment task to the code review team. They should carefully analyze the pull request diff for potential security vulnerabilities, verify compliance with coding standards, and then generate a structured assessment report with their findings and recommendations",
  },
  {
    id: "24",
    category: "Fan-out",
    natural: "Please broadcast to all available worker agents in the cluster a batch operation to scrape the top 100 results from each assigned data source, filter them by the specified keywords, extract the structured data into the standard format, and then send an aggregated summary report back to the orchestrator agent for final processing",
  },
  {
    id: "25",
    category: "Health",
    natural: "Could you please run a comprehensive health check on all microservices in the production environment, including the database cluster, the message queue, the api gateway, and the load balancer. For each service, verify that the response time is within acceptable latency thresholds and that there are no authentication or connection errors. Generate a detailed status report and send it to the monitoring team",
  },
  {
    id: "26",
    category: "Batch",
    natural: "Process all pending customer transaction records from the message queue, validate each transaction against the fraud detection rules in the knowledge base, filter out any transactions that exceed the rate limit threshold, and then aggregate the results into a summary report. For any flagged transactions, immediately escalate to the incident response team with the relevant stack trace and error details",
  },
  {
    id: "27",
    category: "Context",
    natural: "Continue the data migration process from the previous session. The source database has been updated with approximately 50000 new customer records since the last extraction. Please re-run the extraction pipeline, transform the records into the structured output format required by the downstream application, validate the data integrity, and load the results into the production data warehouse. Report any discrepancies or validation errors to the orchestrator",
  },
  {
    id: "28",
    category: "PR/CI",
    natural: "The continuous integration pipeline has completed its run. All 156 unit tests and 43 integration tests are passing. Code coverage is at 87 percent. However, there are 3 linting errors that need to be resolved before the pull request can be merged. Please forward the linting error details to the code review agent and have them submit a hotfix pull request to address the issues",
  },
  {
    id: "29",
    category: "Urgent",
    natural: "Urgent critical alert: the production kubernetes cluster is experiencing severe resource constraints. Multiple docker containers are being killed due to memory usage exceeding limits. The api gateway is returning timeout errors and the circuit breaker has tripped for the payment processing microservice. Immediately investigate the root cause, check the observability telemetry dashboards, and escalate findings to the incident response team with a detailed status report",
  },
  {
    id: "30",
    category: "LLM/Agent",
    natural: "Please instruct the orchestrator agent to coordinate a multi-agent workflow. The first worker agent should perform a semantic search on the vector store using the provided embeddings to retrieve relevant documents from the knowledge base. The second worker agent should then use chain of thought reasoning to analyze the retrieved documents and generate a structured output. Finally, aggregate all results and send a comprehensive summary report back to the requesting agent through the api gateway",
  },
];
