import { describe, it, expect } from "vitest";
import { AxonCodec } from "../src/AxonCodec.js";
import { AxonMsg } from "../src/AxonMsg.js";
import { parseAxon, formatAxon, CODEBOOK, SYMBOL_MAP, PERFORMATIVE_TO_SYMBOL } from "@axon/core";
import { encode } from "@axon/codec";
import type { PerformativeType } from "@axon/core";

describe("cross-package integration", () => {
  describe("encode → parseAxon roundtrip", () => {
    const messages = [
      "Please review the pull request number 42 and check all tests",
      "Check the database connection status and report any issues found",
      "The deployment is complete and all services are running properly",
      "An error occurred in the payment service during processing",
      "Forward to the security team for comprehensive review and assessment",
      "Urgent: the production environment is down and needs investigation",
    ];

    for (const msg of messages) {
      it(`encode → parse roundtrip: "${msg.slice(0, 40)}..."`, () => {
        const result = encode(msg);
        if (!result.skipped) {
          const parsed = parseAxon(result.encoded);
          expect(parsed.performative).toBeTruthy();
          expect(PERFORMATIVE_TO_SYMBOL.has(parsed.performative)).toBe(true);
        }
      });
    }
  });

  describe("AxonMsg.build → parseAxon consistency", () => {
    it("builder output matches parser expectations", () => {
      const built = AxonMsg.request().to("orch").payload("test data").build();
      const parsed = parseAxon(built);
      expect(parsed.performative).toBe("REQUEST");
      expect(parsed.agent).toBe("orch");
      expect(parsed.payload).toBe("test data");
    });

    it("all performative builders parse back correctly", () => {
      const perfs: PerformativeType[] = [
        "REQUEST", "QUERY", "INFORM", "DELEGATE", "MERGE",
        "CONFIRM", "REJECT", "ERROR", "COMPLETE", "RETRY", "URGENT",
      ];

      for (const perf of perfs) {
        const symbol = PERFORMATIVE_TO_SYMBOL.get(perf)!;
        const built = formatAxon({
          performative: perf,
          agent: "test",
          payload: "data",
          raw: "",
        });
        const parsed = parseAxon(built);
        expect(parsed.performative).toBe(perf);
        expect(parsed.agent).toBe("test");
        expect(parsed.payload).toBe("data");
      }
    });
  });

  describe("AxonCodec + AxonMsg consistency", () => {
    it("codec.encode and AxonMsg.parse agree on structure", async () => {
      const codec = new AxonCodec();
      const result = await codec.encode("Please check the database status and report back to the team");
      if (!result.skipped) {
        const parsed = AxonMsg.parse(result.encoded);
        expect(parsed.performative).toBeTruthy();
      }
    });

    it("codec.analyze returns same encoded as codec.encode", async () => {
      const codec = new AxonCodec();
      const msg = "Deploy the service immediately";
      const encoded = await codec.encode(msg);
      const analyzed = codec.analyze(msg);
      expect(encoded.encoded).toBe(analyzed.encoded);
      expect(encoded.reductionPct).toBe(analyzed.reductionPct);
    });
  });

  describe("symbol consistency between core and codec", () => {
    it("all intent symbols in CODEBOOK match encoder's intent detection output", () => {
      // The encoder should produce encoded strings that start with valid intent symbols
      const testInputs: Record<string, string> = {
        "REQUEST": "Please run this deployment to the production environment",
        "QUERY": "What is the current status of the deployment pipeline",
        "ERROR": "An error occurred in the payment processing service",
        "COMPLETE": "The deployment task is finished and all services are running",
        "DELEGATE": "Forward to the security team for comprehensive review",
        "URGENT": "Urgent alert: production database is experiencing issues",
      };

      for (const [expectedPerf, input] of Object.entries(testInputs)) {
        const result = encode(input);
        const parsed = parseAxon(result.encoded);
        expect(parsed.performative).toBe(expectedPerf);
      }
    });

    it("encoder-detected symbols are all in CODEBOOK", () => {
      const result = encode("Please review the database with timeout and filter the results");
      for (const sym of result.symbols) {
        const inCodebook = CODEBOOK.find((c) => c.symbol === sym.symbol);
        expect(inCodebook).toBeDefined();
      }
    });
  });

  describe("benchmark messages encode→parse", () => {
    const benchmarkMessages = [
      "Please review pull request number 42, check if all tests are passing, and then report back with a summary to the orchestrator",
      "Fetch records from the database where status is pending and age is less than or equal to 30, then run them through the validation pipeline and report any errors",
      "The deployment of service number 12 is finished and running, health check is passing, and there are no errors",
      "Forward to the code review team to check the security of the diff and assess the code structure according to standards",
      "An error occurred in the payment service with a timeout of 30 seconds, please retry with exponential backoff",
      "Send to all workers a batch operation to scrape the top 10 results filtered by keywords, extract the structured data, and send an aggregate report to the orchestrator",
    ];

    for (const msg of benchmarkMessages) {
      it(`benchmark msg parses and compresses chars: "${msg.slice(0, 50)}..."`, () => {
        const result = encode(msg);
        // Must produce shorter character output
        expect(result.encoded.length).toBeLessThan(msg.length);
        // Must produce parseable output
        const parsed = parseAxon(result.encoded);
        expect(parsed.performative).toBeTruthy();
        // Must have valid symbols
        expect(result.symbols.length).toBeGreaterThan(0);
      });

      it(`benchmark msg achieves real token savings in ASCII: "${msg.slice(0, 50)}..."`, () => {
        const result = encode(msg, { ascii: true });
        expect(result.axonTokens).toBeLessThan(result.nlTokens);
      });
    }
  });

  describe("SYMBOL_MAP lookup for all encoded symbols", () => {
    it("every symbol found in encoded output exists in SYMBOL_MAP", () => {
      const testMessages = [
        "Please deploy the database with timeout",
        "Error in the authentication service",
        "Aggregate all results and filter by status",
        "Urgent batch processing needed immediately",
      ];

      for (const msg of testMessages) {
        const result = encode(msg);
        for (const sym of result.symbols) {
          expect(SYMBOL_MAP.has(sym.symbol)).toBe(true);
        }
      }
    });
  });

  describe("adversarial cross-package scenarios", () => {
    it("encoding then formatting then parsing is consistent", () => {
      const result = encode("Please check all services in the production environment");
      if (result.skipped) return;
      const parsed = parseAxon(result.encoded);
      const reformatted = formatAxon(parsed);
      const reparsed = parseAxon(reformatted);
      expect(reparsed.performative).toBe(parsed.performative);
      expect(reparsed.agent).toBe(parsed.agent);
    });

    it("AxonMsg builder matches manual formatAxon", () => {
      const built = AxonMsg.request().to("orch").payload("test").build();
      const manual = formatAxon({
        performative: "REQUEST",
        agent: "orch",
        payload: "test",
        raw: "",
      });
      expect(built).toBe(manual);
    });

    it("batch encode preserves individual results", async () => {
      const codec = new AxonCodec();
      const msgs = ["Deploy now", "Check status", "Error occurred"];
      const batch = await codec.encodeBatch(msgs);
      for (let i = 0; i < msgs.length; i++) {
        const single = await codec.encode(msgs[i]);
        expect(batch[i].encoded).toBe(single.encoded);
        expect(batch[i].reductionPct).toBe(single.reductionPct);
      }
    });
  });
});
