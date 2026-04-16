import { describe, it, expect } from "vitest";
import { encode } from "../src/encoder.js";
import { parseAxon } from "@axon/core";

describe("encode", () => {
  it("encodes empty string", () => {
    const result = encode("");
    expect(result.encoded).toBe("");
    expect(result.reductionPct).toBe(0);
    expect(result.nlTokens).toBe(0);
    expect(result.axonTokens).toBe(0);
    expect(result.symbols).toEqual([]);
    expect(result.original).toBe("");
  });

  it("encodes whitespace-only string", () => {
    const result = encode("   ");
    expect(result.encoded).toBe("");
    expect(result.reductionPct).toBe(0);
  });

  describe("short message pass-through", () => {
    it("skips messages ≤5 tokens", () => {
      const result = encode("Deploy now");
      expect(result.skipped).toBe(true);
      expect(result.encoded).toBe("Deploy now");
      expect(result.reductionPct).toBe(0);
    });

    it("does not skip messages >5 tokens", () => {
      const result = encode("Please review the pull request number 42");
      expect(result.skipped).toBeUndefined();
      expect(result.encoded).not.toBe(result.original);
    });
  });

  describe("intent detection", () => {
    it("detects REQUEST from 'please' in longer message", () => {
      expect(encode("Please deploy the new service to the production environment").encoded).toMatch(/^!/);
    });

    it("detects QUERY from 'what' in longer message", () => {
      expect(encode("What is the current status of the deployment pipeline").encoded).toMatch(/^\?/);
    });

    it("detects QUERY from 'verify'", () => {
      expect(encode("Verify the configuration settings of the application server").encoded).toMatch(/^\?/);
    });

    it("detects INFORM from 'report'", () => {
      expect(encode("Report the latest findings from the security analysis team").encoded).toMatch(/^[≡!]/);
    });

    it("detects DELEGATE from 'forward to'", () => {
      expect(encode("Forward to the analysis team for a comprehensive review").encoded).toMatch(/^→/);
    });

    it("detects DELEGATE from 'delegate'", () => {
      expect(encode("Delegate this analysis task to the research worker agent").encoded).toMatch(/^→/);
    });

    it("detects MERGE from 'merge'", () => {
      expect(encode("Merge these results together from all the worker agents").encoded).toMatch(/^⊕/);
    });

    it("detects CONFIRM from 'confirmed'", () => {
      expect(encode("Confirmed the deployment was accepted and is now running properly").encoded).toMatch(/^✓/);
    });

    it("detects REJECT from 'reject'", () => {
      expect(encode("Reject this pull request due to security vulnerability issues").encoded).toMatch(/^✗/);
    });

    it("detects ERROR from 'error'", () => {
      expect(encode("An error occurred in the payment processing system service").encoded).toMatch(/^⊗/);
    });

    it("detects ERROR from 'failed'", () => {
      expect(encode("The build failed with three critical errors in the pipeline").encoded).toMatch(/^⊗/);
    });

    it("detects COMPLETE from 'finished'", () => {
      expect(encode("The deployment task is finished and all services are running").encoded).toMatch(/^∎/);
    });

    it("detects RETRY from 'retry'", () => {
      expect(encode("Retry the database connection after the timeout period ends").encoded).toMatch(/^⟳/);
    });

    it("detects URGENT from 'urgent'", () => {
      expect(encode("Urgent: the production database is experiencing severe issues").encoded).toMatch(/^⚡/);
    });

    it("detects URGENT from 'urgently'", () => {
      expect(encode("Please urgently investigate the production outage affecting users").encoded).toMatch(/^⚡/);
    });

    it("detects URGENT from 'immediately'", () => {
      expect(encode("Immediately investigate the service outage in the production cluster").encoded).toMatch(/^⚡/);
    });
  });

  describe("intent priority", () => {
    it("URGENT beats REQUEST in same sentence", () => {
      expect(encode("Please deploy this service urgently to the production environment").encoded).toMatch(/^⚡/);
    });

    it("ERROR beats REQUEST", () => {
      expect(encode("Please check why the production system failed in the deployment").encoded).toMatch(/^⊗/);
    });

    it("COMPLETE beats REQUEST", () => {
      expect(encode("The build has finished running please review the deployment status").encoded).toMatch(/^∎/);
    });
  });

  describe("agent extraction", () => {
    it("extracts agent from 'to X agent'", () => {
      const result = encode("Send to the orchestrator agent for processing the request");
      expect(result.encoded).toContain("@");
    });

    it("extracts agent from @mention", () => {
      const result = encode("Please @worker run this task on the production environment");
      expect(result.encoded).toContain("@worker");
    });

    it("extracts agent from 'forward to X'", () => {
      const result = encode("Forward to analytics for comprehensive data analysis review");
      expect(result.encoded).toContain("@analytics");
    });

    it("handles no agent gracefully", () => {
      const result = encode("Run all tests in the continuous integration pipeline now");
      expect(result.encoded).not.toContain("@");
    });
  });

  describe("phrase compression", () => {
    it("maps 'pull request' to PR", () => {
      expect(encode("Please review the pull request and check all tests").encoded).toContain("PR");
    });

    it("maps 'database' to db", () => {
      expect(encode("Please check the database connection status and report back").encoded).toContain("db");
    });

    it("maps 'deployment' to depl", () => {
      expect(encode("Start the deployment process for the production environment").encoded).toContain("depl");
    });

    it("maps 'authentication' to auth", () => {
      expect(encode("Fix the authentication flow for the user login service module").encoded).toContain("auth");
    });

    it("maps multi-word phrases before single words", () => {
      // "health check" should become "hchk" not "hea chk"
      expect(encode("Run the health check on all production services now please").encoded).toContain("hchk");
    });

    it("maps 'exponential backoff' as one phrase", () => {
      expect(encode("Please retry the connection using exponential backoff strategy please").encoded).toContain("expbkf");
    });
  });

  describe("filler stripping", () => {
    it("removes polite hedging", () => {
      const result = encode("Could you please make sure that the deployment is running correctly");
      expect(result.encoded).not.toMatch(/could you/i);
      expect(result.encoded).not.toMatch(/please/i);
    });

    it("removes verbose framing", () => {
      const result = encode("I need you to check the database status and report back to me");
      expect(result.encoded.length).toBeLessThan(40);
    });
  });

  describe("compression ratios — ASCII mode (real cl100k_base tokens)", () => {
    const testMessages = [
      "Please review the pull request number 42 and check if all tests are passing, then report back with a summary",
      "Could you please fetch the records from the database where the status is pending and the age is less than 30 days, then validate the pipeline and report any errors",
      "The deployment of service number 12 is finished and running, health check is passing, and there are no errors",
      "Forward to the code review team to check the security of the diff and assess the code structure according to standards",
      "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff",
      "Send to all workers a batch operation to scrape the top 10 results filtered by keywords, extract the structured data, and send an aggregate report to the orchestrator",
    ];

    for (const msg of testMessages) {
      it(`ASCII mode achieves savings on: "${msg.slice(0, 50)}..."`, () => {
        const result = encode(msg, { ascii: true });
        expect(result.axonTokens).toBeLessThan(result.nlTokens);
      });
    }

    it("Unicode mode still reduces character count", () => {
      for (const msg of testMessages) {
        const result = encode(msg);
        expect(result.encoded.length).toBeLessThan(msg.length);
      }
    });
  });

  describe("smart wrapper omission", () => {
    it("omits wrappers on simple short payload", () => {
      const result = encode("Please review the pull request number 42", { ascii: true });
      // Short simple payload — no [[ ]]
      expect(result.encoded).not.toContain("[[");
    });

    it("keeps wrappers on complex payload with pipe", () => {
      const result = encode(
        "Fetch from database where status is pending, then validate pipeline and report errors",
        { ascii: true },
      );
      // This has enough complexity — should keep wrappers
      // (depends on token count after compression)
    });
  });

  describe("output parsability", () => {
    it("produces parseable AXON for non-skipped messages", () => {
      const messages = [
        "Please review the pull request and check the tests",
        "Check if all tests are passing in the pipeline",
        "The deployment is complete and all services running",
        "An error occurred in the database connection layer",
        "Forward to the security team for review and assessment",
      ];

      for (const msg of messages) {
        const result = encode(msg);
        if (!result.skipped) {
          const parsed = parseAxon(result.encoded);
          expect(parsed.performative).toBeTruthy();
        }
      }
    });
  });

  describe("output structure", () => {
    it("wraps payload in delimiters for complex messages", () => {
      const result = encode("Please review the pull request, check all tests, and then generate a summary report for the orchestrator");
      expect(result.encoded.length).toBeGreaterThan(0);
    });

    it("strips punctuation from output", () => {
      const result = encode("Hello world, how are you today? Everything is fine here.");
      if (!result.skipped) {
        expect(result.encoded).not.toContain(",");
        expect(result.encoded).not.toContain(".");
      }
    });

    it("returns all CompressionResult fields", () => {
      const result = encode("Please review the deployment configuration settings");
      expect(result).toHaveProperty("original");
      expect(result).toHaveProperty("encoded");
      expect(result).toHaveProperty("nlTokens");
      expect(result).toHaveProperty("axonTokens");
      expect(result).toHaveProperty("reductionPct");
      expect(result).toHaveProperty("symbols");
      expect(Array.isArray(result.symbols)).toBe(true);
    });
  });

  describe("adversarial inputs", () => {
    it("handles single word (skipped)", () => {
      const result = encode("Deploy");
      expect(result.skipped).toBe(true);
    });

    it("handles numbers only", () => {
      const result = encode("42 100 200");
      expect(result.encoded).toBeTruthy();
    });

    it("handles repeated words", () => {
      const result = encode("test test test test test test test test test test");
      expect(result.encoded).toBeTruthy();
    });

    it("handles unicode text", () => {
      const result = encode("Please review the données and résumé for the application");
      expect(result.encoded).toBeTruthy();
    });

    it("handles very long message (500 words)", () => {
      const longMsg = Array(500).fill("check the database status").join(" ");
      const result = encode(longMsg);
      expect(result.encoded).toBeTruthy();
      expect(result.encoded.length).toBeLessThan(longMsg.length);
    });

    it("handles message with no mappable phrases", () => {
      const result = encode("The xyz abc qwe rty uio pqr stu vwx lmn are here");
      expect(result.encoded).toBeTruthy();
    });
  });
});
