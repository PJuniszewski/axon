# AXON Protocol

**Agent eXchange Object Notation** — a compact symbolic language for token-efficient multi-agent communication.

AXON compresses natural-language inter-agent messages by **60–80%** using a fixed 31-symbol codebook. It sits between existing LLM agents as a transparent encoding layer — no fine-tuning, no model changes required.

---

## How It Works

```
Natural Language (26 tokens):
  "Please review pull request number 42, check if all tests are passing,
   and then report back with a summary to the orchestrator"

AXON Encoded (10 tokens):
  !@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧

Reduction: 62%
```

AXON uses three mechanisms:

1. **Intent Symbols** — single-character performatives replace verbose intent phrases (`!` = REQUEST, `?` = QUERY, `⊗` = ERROR, etc.)
2. **Phrase Compression** — common multi-agent terms map to short stems (`database` → `db`, `deployment` → `depl`, `authentication` → `auth`)
3. **Structural Notation** — payload delimiters `⟦⟧`, agent addressing `@`, and operators (`∧`, `|`, `⊂`) replace natural-language connectives

Decoding uses a ~200-token **CodecFit** prompt — any frontier LLM can expand AXON back to fluent English with no training.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  @axon/core │ ◄── │ @axon/codec │ ◄── │  @axon/sdk  │
│  codebook   │     │  encoder    │     │  AxonCodec  │
│  grammar    │     │  decoder    │     │  AxonMsg    │
│  types      │     │  codecfit   │     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                              ┌────────────────┤
                              ▼                ▼
                    ┌─────────────┐   ┌──────────────┐
                    │@axon/gateway│   │  playground   │
                    │  Fastify    │   │  React 18    │
                    │  proxy :9090│   │  Vite :5173  │
                    └─────────────┘   └──────────────┘
```

### Packages

| Package | Description |
|---------|-------------|
| `packages/core` | 31-symbol codebook, TypeScript types, AXON grammar parser/formatter |
| `packages/codec` | Rule-based NL→AXON encoder (no LLM), LLM-based decoder via CodecFit prompt |
| `packages/sdk` | Public API — `AxonCodec` class and `AxonMsg` fluent builder |
| `packages/gateway` | AxonGate transparent proxy server (Fastify, port 9090) |
| `apps/playground` | Interactive demo with Encoder, Codebook, Gateway, and Benchmark tabs |
| `benchmarks/` | 20-case benchmark suite with CLI runner |

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all tests (85 tests across 4 packages)
pnpm test

# Run the 20-case benchmark suite
pnpm benchmark

# Start the gateway proxy (port 9090)
pnpm --filter @axon/gateway dev

# Start the playground UI (port 5173)
pnpm playground
```

### Environment Setup

Copy `.env.example` to `.env` and add your Anthropic API key (required only for LLM-based decoding):

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

---

## SDK Usage

### Encode in 3 lines

```typescript
import { AxonCodec } from "@axon/sdk";

const codec = new AxonCodec();
const result = await codec.encode("Please review pull request 42 and report back");
console.log(result.encoded);      // !⟦rev PR 42 rpt⟧
console.log(result.reductionPct); // 67
```

### Fluent Message Builder

```typescript
import { AxonMsg } from "@axon/sdk";

// Build an AXON message programmatically
const msg = AxonMsg.request()
  .to("orch")
  .payload("rev PR#42 | ?tst.∀pass → ∑rpt")
  .build();
// → "!@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧"

// Parse an AXON string
const parsed = AxonMsg.parse("!@orch ⟦rev PR#42⟧");
// → { performative: "REQUEST", agent: "orch", payload: "rev PR#42", ... }
```

### Decode with LLM

```typescript
const codec = new AxonCodec({ apiKey: process.env.ANTHROPIC_API_KEY });
const natural = await codec.decode("⊗ pay.svc:timeout⟨30s⟩ → ⟳ backoff:exp");
// → "An error occurred in the payment service due to a 30-second timeout.
//    Retrying with exponential backoff."
```

---

## Symbol Reference

### Intent (11 symbols)

| Symbol | Name | Description |
|:------:|------|-------------|
| `!` | REQUEST | Initiate action |
| `?` | QUERY | Request information or status |
| `≡` | INFORM | Transmit data or state update |
| `→` | DELEGATE | Transfer task ownership |
| `⊕` | MERGE | Combine multiple results |
| `✓` | CONFIRM | Acknowledge and accept |
| `✗` | REJECT | Refuse or deny |
| `⊗` | ERROR | Signal failure state |
| `∎` | COMPLETE | Task finalized |
| `⟳` | RETRY | Repeat last operation |
| `⚡` | URGENT | High-priority escalation |

### Structure (8 symbols)

| Symbol | Name | Description |
|:------:|------|-------------|
| `#` | REF | ID or entity reference |
| `@` | AGENT | Target agent address |
| `\|` | PIPE | Sequential operation chain |
| `:` | ASSIGN | Property assignment |
| `⟦` `⟧` | PAYLOAD | Payload delimiters |
| `⟨` `⟩` | CONTEXT | Context delimiters |

### Logic (7 symbols)

| Symbol | Name | Description |
|:------:|------|-------------|
| `∧` | AND | Logical conjunction |
| `∨` | OR | Logical disjunction |
| `∀` | ALL | Universal quantifier |
| `∃` | EXISTS | Existential check |
| `∅` | NULL | Empty, none, not found |
| `≥` `≤` | GTE/LTE | Comparison operators |

### Domain (5 symbols)

| Symbol | Name | Description |
|:------:|------|-------------|
| `⊂` | FILTER | Subset or filter condition |
| `∑` | AGGREGATE | Summarize or collect results |
| `⊞` | BATCH | Batch operation |
| `⌛` | TIMEOUT | Time constraint |
| `⌂` | LOCAL | Internal or in-process scope |

---

## Wire Format

```
[INTENT] [@AGENT] ⟦PAYLOAD⟧ ⟨CONTEXT⟩
```

- **INTENT** — required, one of the 11 intent symbols
- **@AGENT** — optional, target agent address (omit for broadcast)
- **⟦PAYLOAD⟧** — compressed operation body
- **⟨CONTEXT⟩** — optional metadata (timing, priority, session)

---

## Benchmark Results

20 canonical inter-agent messages across 10 categories:

| Metric | Value |
|--------|-------|
| **Average Reduction** | 61% |
| **Best Case** | 73% |
| **Worst Case** | 50% |
| **Pass Rate** | 20/20 |

Run `pnpm benchmark` to reproduce.

---

## Gateway API

Start with `pnpm --filter @axon/gateway dev` (default port 9090).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/encode` | NL → AXON (`{ "message": "..." }`) |
| `POST` | `/decode` | AXON → NL (`{ "axon": "..." }`) |
| `POST` | `/proxy` | Full proxy flow: encode → forward → decode |
| `GET` | `/analytics` | Aggregated token savings stats |
| `GET` | `/analytics/live` | SSE stream of real-time compression events |

```bash
# Encode a message
curl -X POST http://localhost:9090/encode \
  -H "Content-Type: application/json" \
  -d '{"message": "Please check the database status"}'
```

---

## Playground

The interactive demo (`pnpm playground`) provides four tabs:

- **Encoder** — Type or select a preset, see live NL→AXON encoding with token comparison bars
- **Codebook** — Searchable, filterable grid of all 31 symbols
- **Gateway** — Visual proxy flow diagram with live token savings counter
- **Benchmark** — Run all 20 benchmark cases, view results table, export to CSV

---

## Project Structure

```
axon/
├── packages/
│   ├── core/          # codebook, types, grammar
│   ├── codec/         # encoder, decoder, codecfit
│   ├── sdk/           # AxonCodec, AxonMsg
│   └── gateway/       # Fastify proxy server
├── apps/
│   └── playground/    # React demo UI
├── benchmarks/        # 20-case benchmark suite
├── docs/
│   └── spec.md        # Full AXON format specification
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces + Turborepo |
| Core / SDK | TypeScript 5.8, strict mode |
| Gateway | Fastify 5 |
| Demo | Vite 6 + React 18 |
| Testing | Vitest 3 |
| LLM | Anthropic SDK (Claude) |

---

## What This POC Proves

1. **Encoding NL → AXON reduces tokens measurably** — 61% average on benchmark set
2. **Any frontier LLM can decode AXON** via a ~200-token CodecFit prompt
3. **AxonGate proxy works transparently** — zero changes to upstream/downstream agents
4. **Developer SDK is ergonomic** — encode/decode in 3 lines
