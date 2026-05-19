# AXON Protocol

## What It Is

AXON (Agent eXchange Object Notation) started as a compact symbolic
protocol for inter-agent communication. A 9-test quality benchmark we
ran in May 2026 reframed what it actually is: **a structured,
parseable representation of agent messages** that survives round-trip
encoding, preserves entities reliably, but loses scope qualifiers and
saves fewer tokens than the original pitch claimed.

The honest framing — and the direction this codebase is moving — is
documented in [`docs/PIVOT.md`](docs/PIVOT.md): AXON works best as an
**at-rest, queryable view over agent traces** (observability /
replay), not as a wire protocol that agents act on.

## The Numbers — Honest Version

Two distinct measurements, both real `cl100k_base` token counts:

| Setting | Token reduction | Caveat |
|---------|-----------------|--------|
| Rule-based encoder vs verbose CrewAI/AutoGen baselines | **46%** | Holds only if upstream LLM is verbose |
| Native AXON output vs verbose baselines | **74%** | Same caveat; agent must have CodecFit primer |
| Native AXON output vs **already-concise** baselines | **28%** | What you actually get if the upstream agent has been told to be brief |
| Human-compressed intent | 77% | Theoretical maximum |

**The single number to quote: ~28–46% depending on baseline verbosity.**
The 74% headline that earlier versions of this README led with is only
true against deliberately-padded baselines.

## Quality Beyond Tokens (the 9-Test Benchmark)

`benchmarks/quality/` — pre-registered methodology, anchored rubrics,
LLM-as-judge with subagent isolation. Results:

| Test | Result | Interpretation |
|------|--------|----------------|
| 1. Parser fidelity | **100%** | Encoder output always parses cleanly |
| 2. Entity preservation (NL → AXON) | 48.5% macro: numbers 88%, IDs 45%, intent 40%, **qualifiers 25%** | Encoder has known bugs; qualifier loss is the structural one |
| 3. Round-trip semantic fidelity | **9.2/10 mean** [CI 8.5–9.7] | Strong, with a 10% tail of qualifier-loss failures |
| 4. Hallucination rate on decode | **0 dangerous halls / 30** | The 4 "added facts" the judge flagged were all benign label prefixes |
| 5. Context retrieval | **NL 96.7% = AXON 96.7%** | AXON does not damage retrieval over 8–10-msg threads |
| 6. Multi-hop drift | small per-hop drop | Most loss on first compression; subsequent hops near-lossless |
| 7. Reasoning under CodecFit primer | **85% = 85%** | Injecting AXON into system prompt does not damage CoT |
| 8. Native generation A/B (blind judge) | **−1.8 / 10 task, −1.07 / 10 entity** | Real quality cost on top of 28% token saving |
| 9. Adversarial / malformed AXON | 80% correct refuse / hedge, 7% hallucination | Decoder is safe on broken input |

Full results: `benchmarks/quality/results/0[1-9]*.json`. Methodology:
`benchmarks/quality/METHODOLOGY.md`.

## Architecture

Both designs exist in the codebase. Neither is the future:

```
v1 (legacy): Agent A (NL) → AxonGate encodes → wire → AxonGate decodes → Agent B (NL)
v2 (current pitch): Agent A (AXON native via CodecFit) → AxonGate validates + routes → Agent B (AXON native)
```

Where this is heading (see `docs/PIVOT.md`):

```
v3 (proposed):
  Agent A (NL, unchanged) ──┐
                            ├──► OTel exporter ──► AXON twin + NL trace ──► query API / dashboard
  Agent B (NL, unchanged) ──┘                                                (ops / compliance / replay)
```

The agents stop being asked to think in symbols. AXON becomes the
index, NL stays the source of truth, and the value proposition shifts
from "save tokens between agents" to "give the platform team a
glanceable, queryable view over 1000s of multi-agent conversations."

A working demo of v3 lives at `apps/demo/dist/trace-explorer.html` —
single-file HTML, opens in any browser, 200 synthetic conversations
across 10 agents with intent graph, filters, and AXON↔NL drill-down.

## What's in the Repo

| Package | Purpose |
|---------|---------|
| `@axon/core` | 31-symbol codebook, grammar parser (Unicode + ASCII), 245-entry phrase dictionary |
| `@axon/codec` | Rule-based encoder, LLM decoder, CodecFit injection, real `cl100k_base` tokenizer |
| `@axon/sdk` | `AxonCodec` (rule/llm/hybrid/native modes), `AxonMsg` fluent builder, validation |
| `@axon/gateway` | Fastify server with inject/validate/parse/route/agents endpoints |
| `@axon/playground` | React 18 demo — Encoder, Codebook, Gateway, Benchmark tabs |
| `@axon/langchain` | LangChain callback handler, CrewAI bridge, framework-agnostic middleware |
| `@axon/demo` | Trace Explorer (the v3 pivot artifact) — single-file HTML generator |
| `benchmarks/` | 30-case encoder suite, real agent samples, tokenization audit, native simulation |
| `benchmarks/quality/` | 9-test quality benchmark + methodology + results |
| `docs/PIVOT.md` | Strategic pivot analysis backed by landscape survey + benchmark data |

**353 tests across 7 packages, ~10K lines.**

## Key Discovery: The Tokenization Audit

19 of 31 Unicode symbols (`⟦⟧⊗∎⟳⚡∧∑⊂⊞⌛⌂...`) cost 2–3 tokens each on
`cl100k_base`. Payload delimiters `⟦⟧` alone cost 6 tokens per message.

This killed the original "60% compression" claim — Unicode mode
achieves only 10% real savings. ASCII-safe alternatives (`[[]]`,
`ERR`, `DONE`, `SUM`, `&&`) bring it to 46% via rule-based encoding,
and native AXON generation hits 28–74% depending on how verbose the
baseline would have been.

## Honest Evolution of the Headline Number

| Phase | Claimed | Real (`cl100k_base`) | What Changed |
|-------|---------|----------------------|--------------|
| Initial POC | 61% | ~10% Unicode | Heuristic estimates were fake |
| + ASCII mode | 37% | 37% | Replaced heuristic with tiktoken |
| + Phase 2 encoder | 36% | 36% | 245 phrases, smart wrappers, harder suite |
| + Real verbose agent samples | — | 46% | Verbose LLM output has more filler to strip |
| + Native mode (verbose baseline) | — | 74% | Agents write AXON directly via CodecFit |
| + Native mode (concise baseline) | — | **28%** | Honest number when the agent isn't padding |

## Economics — Conditional

For a 20-message agent conversation, **assuming a verbose baseline**:

- Without AXON: 20 × 85 = 1,700 tokens
- With AXON: 148 (CodecFit) + 20 × 22 = 588 tokens
- Net saving: 1,112 tokens (65%)

For a 20-message conversation **with already-concise baseline**
(28% native saving, 65 tokens per message becomes 47):

- Without AXON: 20 × 65 = 1,300 tokens
- With AXON: 148 + 20 × 47 = 1,088 tokens
- Net saving: 212 tokens (16%)

At $3/M input tokens: $0.0006 saved per concise conversation. At 10K
conversations/day: ~$6/day, $2K/year. Lower than the original pitch.

## How to Use

```bash
pnpm install
pnpm test                                            # 353 tests
pnpm benchmark                                       # 30-case encoder benchmark
pnpm tsx benchmarks/real_baseline.ts                 # 20 verbose agent samples
pnpm tsx benchmarks/native_simulation.ts             # native mode (needs ANTHROPIC_API_KEY)
pnpm tsx benchmarks/tokenization.ts                  # symbol audit
pnpm tsx benchmarks/quality/tests/01_parser_fidelity.ts    # 9-test quality suite
pnpm tsx benchmarks/quality/tests/02_entity_preservation.ts
pnpm tsx benchmarks/quality/aggregate.ts             # aggregate all 9 tests → REPORT.md
pnpm tsx apps/demo/generate.ts                       # rebuild the Trace Explorer HTML demo
```

## Honest Limitations

- **Qualifier loss is the protocol-level weakness, not a fixable bug.**
  Entity preservation measured 25% recall on words like "only", "all",
  "approximately", "might", "if no response". For agents whose
  contracts depend on those qualifiers, AXON is currently lossy.
- **Native mode requires CodecFit in the agent's system prompt.**
  Without the 148-token primer the agent writes plain NL and you fall
  back to the rule-based path. If you don't control the system prompt
  (some platforms hide it), native mode is unavailable.
- **Token savings are conditional on verbose baselines.** Quoted 74%
  is against deliberately-padded CrewAI-style output. Against an LLM
  already told to be concise, real saving is ~28% with a measurable
  −1.8/10 task fidelity cost (A/B blind judge).
- **LLM-as-judge bias toward verbose responses.** Test 8's 1.8 pt drop
  is partly real, partly the judge penalising compressed form for
  being compressed. An external-model judge (Gemini / GPT-4o) is the
  proper robustness check; not done yet.
- **Untested in production.** Every number comes from controlled
  benchmarks against canned samples. No live multi-agent system runs
  on AXON in the wild. Latency, malformed-output rates, and routing
  edge cases under real load are unmeasured.
- **MCP and structured outputs took the wire-protocol layer.** As of
  May 2026 MCP is a Linux Foundation project with ~97M monthly SDK
  downloads, A2A v1.0 GA with 150+ orgs. AXON cannot win on
  "structured agent-to-agent envelope" — that fight is over.

## Strategic Direction

`docs/PIVOT.md` proposes a 6-week test of one focused pivot:
**AXON as observability layer.** NL traces stay the source of truth;
AXON is the compact, queryable index that powers dashboards, replay,
audit, and cross-vendor causal-order views.

Why this fits what we measured:
- Parser fidelity 100% → reliable indexing
- Zero dangerous hallucinations → safe for compliance use
- Entity preservation (numbers / IDs) is strong → useful queries
- Retrieval parity → "what did A tell B about service Z" works on
  the AXON side
- Qualifier loss doesn't matter when NL is preserved alongside

Why this avoids the strategic dead ends:
- Doesn't compete with MCP / A2A — they're wire protocols, not
  observability
- Doesn't require the downstream agent to act on AXON — eliminates
  the multi-hop drift and qualifier-loss risk
- Doesn't depend on the 74% headline — works fine at 28%

If a design partner doesn't materialise in 6 weeks, Plan B is to
write the methodology as a workshop paper and ship the benchmark
suite as a generic agent-protocol evaluation tool. See `docs/PIVOT.md`.

## Try the Demo

```bash
pnpm tsx apps/demo/generate.ts
open apps/demo/dist/trace-explorer.html
```

What you'll see: 200 synthetic multi-agent conversations across 10
agents (orchestrator, sre, security, code-review, deploy, monitor,
db-admin, qa, infra, data-pipeline) drawn from 12 realistic scenario
templates. The page renders an inter-agent graph, intent distribution,
top-talkers, a filterable conversation list, and a per-conversation
timeline with AXON↔NL drill-down. Mobile responsive with a tab layout.

This is what the v3 pitch looks like in practice — and the artifact
to walk a design partner through.

## Core Insight

The original insight — *compression happens at generation, not
transmission* — is true but its commercial value is smaller than the
74% number suggested. The 9-test benchmark made the costs visible:
qualifier loss, judge-detected task-fidelity drop, drift under
re-encoding. None of those kill the protocol; they kill the
"replace inter-agent NL on the wire" pitch.

The pitch that survives is narrower and more defensible:

> **Structured, queryable, lossy-but-bounded view over multi-agent
> conversations — for the platform team, not the agents themselves.**

That's what `docs/PIVOT.md` argues, and what `apps/demo/` demonstrates.
