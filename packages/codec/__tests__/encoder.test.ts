import { describe, it, expect } from "vitest";
import { encode } from "../src/encoder.js";
import { parseAxon } from "@axon/core";

describe("encode", () => {
  it("encodes empty string", () => {
    const result = encode("");
    expect(result.encoded).toBe("");
    expect(result.reductionPct).toBe(0);
  });

  describe("intent detection", () => {
    it("detects REQUEST intent", () => {
      const result = encode("Please run the deployment");
      expect(result.encoded).toMatch(/^!/);
    });

    it("detects QUERY intent", () => {
      const result = encode("What is the current status of the service?");
      expect(result.encoded).toMatch(/^\?/);
    });

    it("detects ERROR intent", () => {
      const result = encode("An error occurred in the payment service");
      expect(result.encoded).toMatch(/^⊗/);
    });

    it("detects COMPLETE intent", () => {
      const result = encode("The deployment is finished and all services are running");
      expect(result.encoded).toMatch(/^∎/);
    });

    it("detects DELEGATE intent", () => {
      const result = encode("Forward to the security team for review");
      expect(result.encoded).toMatch(/^→/);
    });

    it("detects URGENT intent", () => {
      const result = encode("Urgent: database connection is failing immediately");
      expect(result.encoded).toMatch(/^⚡/);
    });
  });

  describe("agent extraction", () => {
    it("extracts agent from 'to X agent'", () => {
      const result = encode("Send to the orchestrator agent for processing");
      expect(result.encoded).toContain("@");
    });

    it("extracts agent from @mention", () => {
      const result = encode("Please @worker run this task");
      expect(result.encoded).toContain("@worker");
    });
  });

  describe("filler stripping", () => {
    it("removes common fillers", () => {
      const result = encode("Could you please make sure that the deployment is running");
      // Should not contain "could you please make sure that"
      expect(result.encoded).not.toMatch(/could you/i);
      expect(result.encoded).not.toMatch(/please/i);
    });
  });

  describe("phrase mapping", () => {
    it("maps 'pull request' to PR", () => {
      const result = encode("Please review the pull request");
      expect(result.encoded).toContain("PR");
    });

    it("maps 'database' to db", () => {
      const result = encode("Please check the database status");
      expect(result.encoded).toContain("db");
    });

    it("maps 'summary' to ∑", () => {
      const result = encode("Please generate a summary of the results");
      expect(result.encoded).toContain("∑");
    });
  });

  describe("compression ratio", () => {
    const testMessages = [
      "Please review the pull request number 42 and check if all tests are passing, then report back with a summary",
      "Could you please fetch the records from the database where the status is pending and the age is less than 30 days, then validate the pipeline and report any errors",
      "The deployment of service number 12 is finished and running, health check is passing, and there are no errors",
      "Forward to the code review team to check the security of the diff and assess the code structure according to standards",
      "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff",
      "Send to all workers a batch operation to scrape the top 10 results filtered by keywords, extract the structured data, and send an aggregate report to the orchestrator",
    ];

    for (const msg of testMessages) {
      it(`achieves ≥50% reduction on: "${msg.slice(0, 50)}..."`, () => {
        const result = encode(msg);
        expect(result.reductionPct).toBeGreaterThanOrEqual(50);
      });
    }
  });

  describe("output parsability", () => {
    it("produces valid AXON that parseAxon can handle", () => {
      const messages = [
        "Please review the pull request",
        "Check if all tests are passing",
        "The deployment is complete",
      ];

      for (const msg of messages) {
        const result = encode(msg);
        // Should not throw
        const parsed = parseAxon(result.encoded);
        expect(parsed.performative).toBeTruthy();
      }
    });
  });
});
