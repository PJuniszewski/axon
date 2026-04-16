# AXON Protocol — Tokenization Audit & Real Token Counting

## Priority 1: Symbol Tokenization Benchmark

### Problem

The AXON codebook assumed every symbol tokenizes as 1 token. This assumption
was never validated against a real tokenizer — the `tokenHint: 1` field was
aspirational, not measured.

### Method

Built `benchmarks/tokenization.ts` that runs every codebook symbol through
cl100k_base (GPT-4o encoding, closest available proxy for Claude's tokenizer)
via `js-tiktoken`. For each symbol: measure actual token count, flag offenders,
propose ASCII-safe alternatives, and verify alternatives tokenize as 1 token.

### Findings

**19 of 31 symbols (61%) cost more than 1 token.**

#### 3-token symbols (worst offenders)

| Symbol | Name          | Tokens | Token IDs         | ASCII Alt | Alt Tokens |
|--------|---------------|--------|-------------------|-----------|------------|
| `⟦`    | PAYLOAD_OPEN  | 3      | `[158, 253, 99]`  | `[[`      | 1          |
| `⟧`    | PAYLOAD_CLOSE | 3      | `[158, 253, 100]` | `]]`      | 1          |
| `⟨`    | CTX_OPEN      | 3      | `[158, 253, 101]` | `<<`      | 1          |
| `⟩`    | CTX_CLOSE     | 3      | `[158, 253, 102]` | `>>`      | 1          |

Every AXON message pays **12 tokens** just for structural wrapping (`⟦⟧` open
and close = 6 tokens, or `⟦⟧ + ⟨⟩` = 12). This is catastrophic for short
messages.

#### 2-token symbols

| Symbol | Name      | Token IDs          | ASCII Alt | Alt Tokens |
|--------|-----------|--------------------|-----------|------------|
| `≡`    | INFORM    | `[35726, 94]`      | `==`      | 1          |
| `⊕`    | MERGE     | `[159042, 243]`    | `+>`      | 2          |
| `✗`    | REJECT    | `[18632, 245]`     | `NO`      | 1          |
| `⊗`    | ERROR     | `[159042, 245]`    | `ERR`     | 1          |
| `∎`    | COMPLETE  | `[18085, 236]`     | `DONE`    | 1          |
| `⟳`    | RETRY     | `[158, 64311]`     | `RPT`     | 2          |
| `⚡`   | URGENT    | `[84396, 94]`      | `!!`      | 1          |
| `∧`    | AND       | `[18085, 100]`     | `&&`      | 1          |
| `∃`    | EXISTS    | `[18085, 225]`     | `??`      | 2          |
| `∅`    | NULL      | `[18085, 227]`     | `_`       | 1          |
| `⊂`    | FILTER    | `[159042, 224]`    | `<:`      | 2          |
| `∑`    | AGGREGATE | `[18085, 239]`     | `SUM`     | 1          |
| `⊞`    | BATCH     | `[159042, 252]`    | `[]`      | 1          |
| `⌛`   | TIMEOUT   | `[139819, 249]`    | `T/O`     | 2          |
| `⌂`    | LOCAL     | `[139819, 224]`    | `~`       | 1          |

#### 1-token symbols (12 symbols — safe to use)

| Symbol | Name     | Token ID  |
|--------|----------|-----------|
| `!`    | REQUEST  | `0`       |
| `?`    | QUERY    | `30`      |
| `→`    | DELEGATE | `20216`   |
| `✓`    | CONFIRM  | `65941`   |
| `#`    | REF      | `2`       |
| `@`    | AGENT    | `31`      |
| `\|`   | PIPE     | `91`      |
| `:`    | ASSIGN   | `25`      |
| `∨`    | OR       | `140399`  |
| `∀`    | ALL      | `94039`   |
| `≥`    | GTE      | `87319`   |
| `≤`    | LTE      | `104733`  |

### Message-level impact

Real token counts for the 6 preset messages:

| Preset           | AXON Tokens | NL Tokens | What you actually pay |
|------------------|-------------|-----------|----------------------|
| PR Review        | 25          | 26        | Nearly zero savings   |
| Data Pipeline    | 32          | 31        | **Worse than NL**     |
| Task Complete    | 27          | 22        | **Worse than NL**     |
| Delegation       | 20          | 21        | ~5% savings           |
| Error Recovery   | 22          | 21        | **Worse than NL**     |
| Multi-Agent      | 30          | 32        | ~6% savings           |

The Unicode symbols actively **hurt** compression on most messages.

### Resolution

Added `ascii` field to every multi-token `AxonSymbol` in the codebook.
Added `ASCII_MAP`, `PERFORMATIVE_TO_ASCII` exports from `@axon/core`.
Grammar parser now accepts both `⟦⟧` and `[[]]` formats.
Encoder supports `encode(msg, { ascii: true })`.

---

## Priority 3: Real Token Counting

### Problem

The heuristic estimators produced fake numbers:

```typescript
// Old — heuristic
estimateNLTokens(text)   = Math.ceil(words * 1.35)
estimateAxonTokens(text) = Math.ceil(chars / 4)
```

These two errors compounded:
- **NL overestimate:** `words × 1.35` overestimates by 15–29% vs real tokens.
  "Fetch records from the database where status is pending..." = 31 real tokens,
  heuristic said 40.
- **AXON underestimate:** `chars / 4` ignores that Unicode symbols take 2-3
  tokens. A 28-char AXON string with `⟦⟧` and `⊗` = 22 real tokens, heuristic
  said 7.

Combined: the old benchmark reported "61% average reduction" when the real
number was **10%** in Unicode mode.

### Method

Replaced both estimators with a single `countTokens()` function backed by
`js-tiktoken`'s cl100k_base encoder:

```typescript
import { encodingForModel } from "js-tiktoken";

const enc = encodingForModel("gpt-4o");

export function countTokens(text: string): number {
  if (!text.trim()) return 0;
  return enc.encode(text).length;
}
```

All three public functions (`estimateNLTokens`, `estimateAxonTokens`,
`estimateTokens`) now delegate to `countTokens()`.

### Honest benchmark results

20 benchmark messages, measured with cl100k_base:

| Mode    | Avg Reduction | Best | Worst | Notes                        |
|---------|---------------|------|-------|------------------------------|
| Unicode | **10%**       | 34%  | -11%  | Multi-token symbols eat savings |
| ASCII   | **37%**       | 54%  | 25%   | 1-token alternatives work    |

#### Heuristic vs real accuracy

| Message (truncated)                              | Est NL | Real NL | Error |
|--------------------------------------------------|--------|---------|-------|
| Please review pull request number 42, check...   | 30     | 26      | +15%  |
| Fetch records from the database where status...  | 40     | 31      | +29%  |
| The deployment of service number 12 is finished..| 26     | 22      | +18%  |
| An error occurred in the payment service with... | 25     | 21      | +19%  |

The NL heuristic consistently inflated token counts, making compression
look better than it was.

### Resolution

- `tokenCounter.ts` now uses `js-tiktoken` (added to `@axon/codec` dependencies)
- Benchmark runner (`benchmarks/run.ts`) reports both Unicode and ASCII columns
- All test assertions updated from "≥50% reduction" to character-length checks
  (Unicode mode) and "fewer tokens than NL" checks (ASCII mode)
- The `@axon/langchain` middleware defaults to `ascii: true` for honest savings
- Added `benchmarks/ascii_compare.ts` for side-by-side mode comparison

### What this means for the pitch

The headline number changes from "60% compression" to "37% real token savings
in ASCII mode." That's still meaningful — on a multi-agent system processing
10K messages/day at an average 25 tokens each, AXON saves ~92K tokens/day
(~$0.28/day on Claude Sonnet at $3/M input tokens, or ~$2.76/day on Opus).

The value proposition shifts from "massive compression" to:
1. **Structured protocol** — machines parse AXON deterministically, NL is ambiguous
2. **Moderate token savings** — 25-54% on real messages, more on verbose ones
3. **CodecFit overhead** — the ~130-token system prompt is amortized across all
   messages in a conversation, not paid per-message
