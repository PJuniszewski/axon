/**
 * Real-world LLM agent output samples.
 *
 * These represent how actual agents (CrewAI, AutoGen, LangGraph) communicate.
 * LLMs are verbose by default: they hedge, repeat context, add polite framing,
 * and narrate their intent. This is what AXON needs to compress in production.
 */

export interface AgentSample {
  id: string;
  source: string;
  scenario: string;
  agentOutput: string;
  expectedIntent: string;
}

export const REAL_AGENT_SAMPLES: AgentSample[] = [
  {
    id: "ra-01",
    source: "crewai",
    scenario: "PR review delegation",
    agentOutput: "I have completed my initial analysis and I am now forwarding this task to the code review specialist agent. The task requires a thorough review of pull request number 42, which has been submitted to the main branch. Please ensure that all automated test suites are passing before proceeding, and kindly provide a comprehensive summary report back to the orchestrating agent upon completion of your review.",
    expectedIntent: "delegate PR#42 review to code-review agent, check tests, report to orchestrator",
  },
  {
    id: "ra-02",
    source: "autogen",
    scenario: "Database query status",
    agentOutput: "I would like to inform you that I have successfully completed the database query operation. The query was executed against the primary PostgreSQL database instance and returned a total of 1,247 records that match the specified filter criteria. All records have been validated against the schema and are ready for downstream processing. Please be aware that 3 records were flagged as potentially malformed and have been excluded from the result set.",
    expectedIntent: "inform: db query complete, 1247 records ok, 3 excluded as malformed",
  },
  {
    id: "ra-03",
    source: "langgraph",
    scenario: "Service health check",
    agentOutput: "I am reporting the current health status of all microservices in the production environment. After performing a comprehensive health check across all registered service endpoints, I can confirm that 11 out of 12 services are currently operational and responding within acceptable latency thresholds. The payment processing microservice is currently experiencing elevated response times and may require immediate attention from the infrastructure team.",
    expectedIntent: "inform: health check done, 11/12 svcs ok, payment svc degraded - urgent",
  },
  {
    id: "ra-04",
    source: "crewai",
    scenario: "Error reporting with retry",
    agentOutput: "I need to inform you that an unexpected error has occurred during the execution of the data pipeline task that was assigned to me. The error was caused by a connection timeout when attempting to establish a connection with the external authentication service provider. The timeout occurred after waiting for a period of 30 seconds. I am going to attempt to retry this operation using an exponential backoff strategy, with a maximum of 5 retry attempts before escalating to the orchestrator.",
    expectedIntent: "error: auth svc timeout 30s, retrying expbkf max 5 attempts",
  },
  {
    id: "ra-05",
    source: "autogen",
    scenario: "Batch job coordination",
    agentOutput: "I would like to request that you initiate a batch processing operation across all available worker agents in the current agent pool. Each worker agent should be assigned a subset of the keyword list that has been provided in the shared context. The specific task for each worker agent is to scrape the top 10 search results for each keyword that has been assigned to them, extract the relevant structured data from those results, and then return the collected data to the aggregation agent for final processing and report generation.",
    expectedIntent: "batch request to all workers: scrape top10 per keyword, extract structured data, send to aggregator",
  },
  {
    id: "ra-06",
    source: "langgraph",
    scenario: "Task completion confirmation",
    agentOutput: "I am pleased to inform you that the deployment task has been completed successfully and all systems are now operational. A total of 12 microservices have been deployed to the production Kubernetes cluster and all of them are currently running and passing their respective health checks. No errors were detected during the deployment process and all service endpoints are responding correctly to requests. The deployment can be considered fully complete and no further action is required at this time.",
    expectedIntent: "complete: depl done, 12 svcs running, hchks pass, no errors",
  },
  {
    id: "ra-07",
    source: "crewai",
    scenario: "Security audit delegation",
    agentOutput: "I am now delegating the following task to the security analysis specialist agent for immediate attention. You are required to perform a comprehensive security audit of the code changes that are included in the current diff. Specifically, you should carefully analyze the diff for any potential security vulnerabilities, verify that all code changes are in compliance with our established coding standards and security policies, and then return a structured and detailed assessment report to the requesting agent.",
    expectedIntent: "delegate to security-agent: audit diff for sec.vuln, check std compliance, return structured assessment",
  },
  {
    id: "ra-08",
    source: "autogen",
    scenario: "ETL pipeline with filtering",
    agentOutput: "Please proceed to fetch all of the records from the user accounts database table where the current account status is set to pending and the account creation date indicates that the account is less than or equal to 30 days old. Once you have retrieved all matching records, please run each record through the data validation pipeline to ensure data integrity, and then please generate a comprehensive structured error report that documents any records that failed the validation process.",
    expectedIntent: "fetch db.users where status=pending && age<=30 | run validation pipeline | gen structured error report",
  },
  {
    id: "ra-09",
    source: "langgraph",
    scenario: "Urgent escalation",
    agentOutput: "I need to immediately escalate a critical issue that has just been detected in the production environment. The primary load balancer has stopped responding to health check requests and appears to be completely unresponsive. This is causing a significant degradation in service availability and is affecting all incoming user traffic. This issue requires immediate attention from the infrastructure team and should be treated as the highest priority incident.",
    expectedIntent: "urgent: lb unresponsive, hchks failing, all traffic affected - immediate infra action required",
  },
  {
    id: "ra-10",
    source: "crewai",
    scenario: "Context handoff between agents",
    agentOutput: "I am transferring the current task context and all relevant information to the next agent in the processing pipeline. The task that has been worked on involves the analysis of customer sentiment data from the Q3 report. So far, the data ingestion phase has been completed successfully and the preprocessing pipeline has been run on all 15,000 records in the dataset. The next agent should proceed with the sentiment classification phase using the preprocessed data that is now available in the shared vector store.",
    expectedIntent: "delegate to next-agent: sentiment analysis Q3, ingestion done, 15k records preprocessed in vstore - proceed with classification",
  },
  {
    id: "ra-11",
    source: "autogen",
    scenario: "API rate limit handling",
    agentOutput: "I need to inform you that the external API that we are currently using for data retrieval has returned a rate limiting response. The API has indicated that we have exceeded the maximum number of allowed requests for the current time window. As a result, I am going to pause the current data retrieval operation and implement a waiting period before attempting to resume. Please be aware that this may cause a delay in the completion of the overall task.",
    expectedIntent: "inform: external API rate limited, pausing retrieval, delay expected",
  },
  {
    id: "ra-12",
    source: "langgraph",
    scenario: "Multi-step validation",
    agentOutput: "I would like to request that you perform a multi-step validation process on the dataset that has been prepared for processing. In the first step, please verify that all required fields are present and correctly formatted in each record. In the second step, please check that all numeric values fall within the acceptable ranges that have been defined in the validation schema. In the third and final step, please cross-reference each record against the master reference database to ensure data consistency and accuracy.",
    expectedIntent: "validate dataset: step1 field presence/format, step2 numeric ranges check, step3 cross-ref master db",
  },
  {
    id: "ra-13",
    source: "crewai",
    scenario: "Report aggregation",
    agentOutput: "I am now ready to proceed with the aggregation of all of the individual reports that have been submitted by the various worker agents that were assigned to this task. I will be combining and consolidating all of the individual data points and findings from each worker agent's report into a single comprehensive summary report. Once the aggregation process has been completed, I will format the results in a structured manner and deliver the final consolidated report to the orchestrating agent.",
    expectedIntent: "aggregate all worker reports → structured summary → deliver to orchestrator",
  },
  {
    id: "ra-14",
    source: "autogen",
    scenario: "Kubernetes incident response",
    agentOutput: "A critical incident has been detected in the Kubernetes cluster that is running in the production environment. Multiple pods in the data processing namespace have entered a crash loop back-off state and are continuously restarting. The root cause appears to be related to insufficient memory allocation for the pods, as the memory usage is consistently exceeding the configured limits. I recommend that the resource limits for the affected pods be increased immediately and that the affected deployments be restarted.",
    expectedIntent: "urgent: k8s pods crash-looping in data-processing ns, cause: mem.use exceeds limits, recommend increase limits + restart depl",
  },
  {
    id: "ra-15",
    source: "langgraph",
    scenario: "LLM chain coordination",
    agentOutput: "I would like to inform you that the first stage of the language model processing chain has been completed successfully. The input documents have been processed through the embedding generation pipeline and all of the resulting vector embeddings have been stored in the vector database. The next stage of the pipeline requires the retrieval augmented generation agent to use these embeddings to perform semantic search and retrieve the most relevant context documents for the query that needs to be answered.",
    expectedIntent: "inform: embeddings generated and stored in vstore, RAG agent should proceed with semantic search for query context",
  },
  {
    id: "ra-16",
    source: "crewai",
    scenario: "Quality gate check",
    agentOutput: "Before proceeding to the next stage of the deployment pipeline, I need to verify that all of the required quality gates have been successfully passed. Please confirm that the code coverage percentage is at or above the minimum required threshold of 80 percent, that all linting checks have passed without any errors or warnings, that all unit tests and integration tests are currently passing, and that the security vulnerability scan has not identified any critical or high severity vulnerabilities.",
    expectedIntent: "query: quality gates - cov>=80%, lint pass, utst+itst pass, sec.vuln scan clear",
  },
  {
    id: "ra-17",
    source: "autogen",
    scenario: "Agent pool status",
    agentOutput: "I am providing a status update regarding the current availability and utilization of agents in the worker agent pool. At the present time, there are 8 worker agents that are currently active and available to accept new task assignments. Additionally, there are 3 worker agents that are currently busy processing tasks that have already been assigned to them. There are 2 worker agents that are currently offline and are not available for task assignment.",
    expectedIntent: "inform: agent pool status - 8 available, 3 busy, 2 offline",
  },
  {
    id: "ra-18",
    source: "langgraph",
    scenario: "Data pipeline completion",
    agentOutput: "I am pleased to report that the complete end-to-end data processing pipeline has been executed successfully without any errors or interruptions. All 50,000 records from the source database have been extracted, transformed according to the specified transformation rules, and successfully loaded into the target data warehouse. The entire pipeline execution took a total of 47 minutes and 23 seconds to complete. A detailed execution log has been saved to the designated log storage location for audit purposes.",
    expectedIntent: "complete: ETL pipeline done, 50k records processed, duration 47m23s, log saved",
  },
  {
    id: "ra-19",
    source: "crewai",
    scenario: "Conflict resolution",
    agentOutput: "I need to inform you that a conflict has been detected between the outputs that were produced by two different analysis agents that were working on the same dataset. The first agent concluded that the trend in the data is positive and showing growth, while the second agent concluded that the trend is negative and showing decline. I am requesting that a senior analysis agent review both sets of findings and the underlying data in order to resolve this conflict and provide a definitive conclusion.",
    expectedIntent: "inform: conflict detected - agent1 says positive trend, agent2 says negative trend, request senior agent to resolve",
  },
  {
    id: "ra-20",
    source: "autogen",
    scenario: "Graceful shutdown coordination",
    agentOutput: "I am initiating a graceful shutdown sequence for all of the agents in the current agent network. All agents are requested to complete any tasks that are currently in progress before shutting down. Agents should not accept any new task assignments at this time. Once each agent has completed its current tasks, it should save its current state to the shared state store and then confirm its readiness to shut down by sending a confirmation message to the orchestrating agent.",
    expectedIntent: "request all agents: finish current tasks, reject new, save state to store, confirm shutdown ready to orchestrator",
  },
];
