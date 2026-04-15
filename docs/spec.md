# AXON Protocol Specification

**Version:** 0.1.0 (POC)
**Agent eXchange Object Notation** — compact symbolic language for token-efficient multi-agent communication.

## Overview

AXON compresses natural language inter-agent messages by 60-80% using a fixed symbol codebook. It sits between existing LLM agents as a transparent encoding layer — no fine-tuning, no model changes required.

## Wire Format

```
[INTENT] [@AGENT] ⟦PAYLOAD⟧ ⟨CONTEXT⟩
```

### Grammar (BNF-style)

```
<message>     ::= <intent> [<agent>] [<payload>] [<context>]
<intent>      ::= "!" | "?" | "≡" | "→" | "⊕" | "✓" | "✗" | "⊗" | "∎" | "⟳" | "⚡"
<agent>       ::= "@" <identifier>
<payload>     ::= "⟦" <content> "⟧"
<context>     ::= "⟨" <content> "⟩"
<content>     ::= (<symbol> | <text> | <operator>)*
<operator>    ::= "|" | ":" | "#" | "∧" | "∨" | "∀" | "∃" | "∅" | "≥" | "≤"
                | "⊂" | "∑" | "⊞" | "⌛" | "⌂"
<identifier>  ::= [a-zA-Z0-9_-∀]+
<text>        ::= [^\s⟦⟧⟨⟩]+
```

### Rules

- **INTENT** is required — one of the 11 intent symbols
- **@AGENT** is optional — omit for broadcast
- **⟦PAYLOAD⟧** is the compressed operation body
- **⟨CONTEXT⟩** is optional metadata (timing, priority, session)
- **PIPE** operator `|` chains sequential steps inside payload
- **ASSIGN** `:` binds property values
- **REF** `#` links entity IDs

## Symbol Table

### Intent Symbols (11)

| Symbol | Name     | Description                  |
|--------|----------|------------------------------|
| `!`    | REQUEST  | Initiate action              |
| `?`    | QUERY    | Request information / status |
| `≡`    | INFORM   | Transmit data or state       |
| `→`    | DELEGATE | Transfer task ownership      |
| `⊕`    | MERGE    | Combine multiple results     |
| `✓`    | CONFIRM  | Acknowledge and accept       |
| `✗`    | REJECT   | Refuse or deny               |
| `⊗`    | ERROR    | Signal failure state         |
| `∎`    | COMPLETE | Task finalized               |
| `⟳`    | RETRY    | Repeat last operation        |
| `⚡`   | URGENT   | High-priority escalation     |

### Structure Symbols (8)

| Symbol | Name          | Description             |
|--------|---------------|-------------------------|
| `#`    | REF           | ID or entity reference  |
| `@`    | AGENT         | Target agent address    |
| `\|`   | PIPE          | Sequential chain        |
| `:`    | ASSIGN        | Property assignment     |
| `⟦`    | PAYLOAD_OPEN  | Payload open bracket    |
| `⟧`    | PAYLOAD_CLOSE | Payload close bracket   |
| `⟨`    | CTX_OPEN      | Context open bracket    |
| `⟩`    | CTX_CLOSE     | Context close bracket   |

### Logic Symbols (7)

| Symbol | Name   | Description            |
|--------|--------|------------------------|
| `∧`    | AND    | Logical conjunction    |
| `∨`    | OR     | Logical disjunction    |
| `∀`    | ALL    | Universal quantifier   |
| `∃`    | EXISTS | Existential check      |
| `∅`    | NULL   | Empty, none, not found |
| `≥`    | GTE    | Greater than or equal  |
| `≤`    | LTE    | Less than or equal     |

### Domain Symbols (5)

| Symbol | Name      | Description                |
|--------|-----------|----------------------------|
| `⊂`    | FILTER    | Subset or filter condition |
| `∑`    | AGGREGATE | Summarize or collect       |
| `⊞`    | BATCH     | Batch operation            |
| `⌛`   | TIMEOUT   | Time constraint            |
| `⌂`    | LOCAL     | Internal scope             |

## Encoding Rules

The encoder applies a pipeline of transformations (no LLM required):

1. **Intent Detection** — Match keywords to determine the primary performative
2. **Agent Extraction** — Detect target agent references
3. **Filler Stripping** — Remove articles, prepositions, modal hedges
4. **Phrase Mapping** — Replace common phrases with symbols/abbreviations
5. **Stem Compression** — Truncate long words to 3-char stems
6. **Format Assembly** — Wrap in AXON wire format with ⟦⟧ payload

## Decoding Protocol (CodecFit)

Decoding AXON back to natural language uses a ~200-token system prompt (CodecFit) sent to any frontier LLM. The prompt contains:

- Symbol reference table
- Format description
- Instructions to expand symbols to clear natural language

No fine-tuning needed — the compact prompt is sufficient for any model to decode AXON.

## Examples

### PR Review
```
NL: "Please review pull request number 42, check if all tests are passing,
     and then report back with a summary to the orchestrator"
AXON: !@orch ⟦rev PR#42 | ?tst.∀pass → ∑rpt⟧
```

### Data Pipeline
```
NL: "Fetch records from the database where status is pending and age ≤ 30,
     then validate and report errors"
AXON: !⟦db.fetch ⊂{status:pending ∧ age≤30} | valid.pipe → ⊗.rpt⟧
```

### Task Complete
```
NL: "The deployment of service 12 is finished and running, health check
     is passing, and there are no errors"
AXON: ∎ depl ⟦svc#12:run ∧ health:pass ∧ ⊗:∅⟧
```

### Delegation
```
NL: "Forward to the code review team to check security and assess
     code structure"
AXON: →@code-rev ⟦diff.sec ∧ std.check → assess.struct⟧
```

### Error Recovery
```
NL: "Payment service timeout after 30s, retry with exponential backoff"
AXON: ⊗ pay.svc:timeout⟨30s⟩ → ⟳ backoff:exp
```

### Multi-Agent Fan-Out
```
NL: "Send all workers a batch scrape of top 10 by keywords, extract
     structured data, aggregate report to orchestrator"
AXON: !@∀workers ⊞⟦scrape.top10⊂keywords | extract.struct⟧ → @orch ∑rpt
```

## Token Estimation

For POC purposes, token counts are estimated heuristically:

- **NL tokens:** `word_count * 1.35` (English words average ~1.35 BPE tokens)
- **AXON tokens:** `char_count / 4` (symbols and short stems are token-dense)

These are approximate — production systems should use proper tokenizer (e.g., tiktoken).

## Extension Points

- Additional domain-specific symbols can be added to the codebook
- The phrase map is extensible for domain-specific terminology
- The CodecFit prompt can be adapted for different LLM providers
- Gateway supports custom upstream routing and codec modes
