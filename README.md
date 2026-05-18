# AXON Protocol

## What It Is

AXON (Agent eXchange Object Notation) is a compact symbolic protocol that
reduces token usage in LLM multi-agent communication. A 148-token system
prompt (CodecFit) teaches any frontier model to write AXON natively,
eliminating verbose natural language between agents.

## The Numbers

| Approach | Avg Token Reduction | Mechanism |
|----------|---------------------|-----------|
| Rule-based encoder (middleware) | 46% | Strip fillers + phrase compress at transmission |
| **Native AXON output** | **74%** | Agent writes AXON directly via CodecFit injection |
| Human-compressed intent | 77% | Theoretical maximum |

Native mode measured on 20 realistic agent output samples (CrewAI/AutoGen/LangGraph
style, averaging 85 NL tokens each) run through Claude Sonnet with CodecFit injected.
All numbers are real `cl100k_base` token counts, not heuristic estimates.

## Architecture

Old model (dead end):

```
Agent A (NL) → AxonGate encodes → wire → AxonGate decodes → Agent B (NL)
```

New model (ships):

```
Agent A (AXON native via CodecFit) → AxonGate validates + routes → Agent B (AXON native)
```

AxonGate's role is not encode/decode. It is:

1. **Inject** — prepend 148-token CodecFit prompt into agent system prompts
2. **Validate** — check agent output is valid AXON, graceful NL fallback
3. **Route** — parse `@AGENT` field, resolve from registry, forward

## What We Built

**7 packages, 353 tests, ~10K lines**

| Package | What |
|---------|------|
| `@axon/core` | 31-symbol codebook, grammar parser (Unicode + ASCII), 245-entry phrase dictionary |
| `@axon/codec` | Rule-based encoder (fallback), LLM decoder, CodecFit injection system, real `cl100k_base` tokenizer |
| `@axon/sdk` | `AxonCodec` class (rule/llm/hybrid/native modes), `AxonMsg` fluent builder, validation |
| `@axon/gateway` | Fastify server with inject/validate/parse/route/agents endpoints + legacy encode/decode |
| `@axon/playground` | React 18 demo — Encoder, Codebook, Gateway, Benchmark tabs |
| `@axon/langchain` | LangChain callback handler, CrewAI bridge, framework-agnostic middleware |
| `benchmarks` | 30-case encoder suite, 20 real agent samples, tokenization audit, native simulation |

## Key Discovery: The Tokenization Audit

19 of 31 Unicode symbols (`⟦⟧⊗∎⟳⚡∧∑⊂⊞⌛⌂...`) cost 2–3 tokens each on
`cl100k_base`. Payload delimiters `⟦⟧` alone cost 6 tokens per message.

This killed the original "60% compression" claim — Unicode mode achieves
only 10% real savings. ASCII-safe alternatives (`[[]]`, `ERR`, `DONE`, `SUM`, `&&`)
bring it to 46% via rule-based encoding.

But the real fix was architectural: don't encode at transmission. Let agents
write AXON at generation. Native mode achieves 74% with zero encoding cost.

## Honest Evolution of the Headline Number

| Phase | Claimed | Real (`cl100k_base`) | What Changed |
|-------|---------|----------------------|--------------|
| Initial POC | 61% | ~10% Unicode | Heuristic estimates were fake |
| + ASCII mode | 37% | 37% | Replaced heuristic with tiktoken |
| + Phase 2 encoder | 36% | 36% | 245 phrases, smart wrappers, harder suite |
| + Real agent samples | — | 46% | Verbose LLM output has more filler to strip |
| **+ Native mode** | — | **74%** | Agents write AXON directly via CodecFit |

## Economics

- CodecFit prompt: **148 tokens** (one-time per conversation)
- Average saving per native AXON message: **63 tokens**
- Break-even: **3 messages** (148 ÷ 63 = 2.3)

For a 20-message agent conversation:

- Without AXON: 20 × 85 = 1,700 tokens
- With AXON: 148 (prompt) + 20 × 22 = 588 tokens
- **Net saving: 1,112 tokens (65%)**

At $3/M input tokens (Claude Sonnet): $0.003 saved per conversation.
At 10K conversations/day: **$33/day**, $12K/year.

## How to Use

```bash
pnpm install
pnpm test                                    # 353 tests
pnpm benchmark                               # 30-case encoder benchmark
pnpm tsx benchmarks/real_baseline.ts         # 20 real agent samples (46%)
pnpm tsx benchmarks/native_simulation.ts     # native mode (74%, needs API key)
pnpm tsx benchmarks/tokenization.ts          # symbol audit
```

## Honest Limitations

- **Native mode requires CodecFit in the agent's system prompt.** The 74%
  number assumes the 148-token CodecFit primer has been injected. Without
  it, the agent writes ordinary natural language and you fall back to the
  46% rule-based path.
- **Not yet tested in production.** Every number in this README comes from
  controlled benchmarks against canned agent samples. There is no live
  multi-agent system running on AXON in the wild yet — latency under load,
  malformed-output rates, and routing edge cases are unmeasured.
- **MCP and structured outputs solve an overlapping problem set.** Tool
  schemas, JSON mode, and MCP message envelopes already cut ceremony for a
  large slice of agent traffic. AXON's win is on the free-text reasoning
  channel between agents — not on tool calls, which are already structured.
- **Surviving value proposition: streaming-friendly routing plus a measured
  74% saving with break-even at 3 messages.** AXON is parseable
  line-by-line (`@agent` resolves before the payload finishes streaming),
  and the CodecFit overhead amortizes after the third message in a
  conversation. That is the case to make — not a generic "compression"
  pitch.

## Core Insight

**Compression happens at generation, not transmission.**

The rule-based encoder can only delete words from existing verbose output —
ceiling ~46%. But if you teach the agent to write AXON natively (via a
148-token system prompt), it never produces the verbose output in the first
place — achieving 74%, within 3 pp of human-optimal compression.

**AxonGate's value is not encode/decode middleware.** It is CodecFit
injection + AXON validation + message routing.
