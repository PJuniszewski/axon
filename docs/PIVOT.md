# AXON — Honest Pivot Analysis

May 2026. Written after the 9-test quality benchmark
(`benchmarks/quality/`) and a survey of the agent-protocol landscape.

## Where we are

AXON is a 31-symbol compression protocol for inter-agent messages. The
9-test benchmark measured what it actually does:

**Strengths** — preserves numbers (88%) and round-trip fidelity (9.2/10
mean), does not damage context retrieval (96.7% NL = 96.7% AXON), does
not damage reasoning under CodecFit injection (85% = 85%), does not
hallucinate dangerously (0 factual halls on 30 round-trips), parses
deterministically (100% on tested cases).

**Weaknesses** — loses scope/condition qualifiers ("only", "all", "if no
response", "less than") at 25% recall; real token savings collapse from
the headline 74% to ~28% when the NL baseline is already concise; costs
~1.8/10 pts of task fidelity in A/B blind judging.

**Reality check on the pitch.** AXON as "generic compression for agent
messages" is a dead product category. MCP (Linux Foundation, ~97M
monthly downloads, 10k+ servers) owns the agent-to-tool layer. A2A
(LF, GA April 2026, 150+ orgs) owns cross-vendor agent-to-agent peer
messaging. Both consumed the compression problem at the structural
level: tool calls and handoffs are already structured, so the verbose
channel that AXON compresses is *shrinking on the hot path*. What
remains is the orchestrator → sub-agent → summary-back pattern that
every major framework converged on in 2026 — and that's exactly where
qualifier loss is fatal.

## Where the real gaps are

From the landscape survey, four 2026 gaps with documented evidence:

1. **A2A has no typed skill schema.** Cross-vendor agents currently
   negotiate capabilities via free-text capability cards. Verbatim from
   the spec: "A2A does not yet require a machine-readable definition of
   skill inputs and outputs."

2. **Handoff context cost is unsolved.** Multi-agent systems use ~15×
   more tokens than single-agent (Vantage, FlowHunt 2026). OpenAI
   shipped opt-in nested-handoff history in April 2026 *specifically*
   because cross-agent context bleed was too expensive. Compression on
   the handoff payload is a real, costed problem.

3. **Streaming routing is underspecified.** A2A supports SSE streams
   but mandates no early-routable header. Latency-sensitive routers
   buffer until the body lands.

4. **Deterministic replay across vendors does not exist.** LangSmith
   replays within LangGraph; OpenAI traces stay in OpenAI. Causal
   inter-agent message ordering is not captured by OpenTelemetry
   GenAI semconv.

## The pivot

**Agent Trace Compressor for observability and replay.**

What it is: an at-rest representation of agent traces — not a wire
protocol. NL stays the source of truth; AXON is a queryable,
glanceable view over the trace.

Why the measured strengths fit:
- Parser fidelity 100% → reliable indexing
- Entity preservation 88% (numbers), 45–97% (IDs depending on form) →
  queries like `intent=DELEGATE target=@security since=14:00 UTC`
- Retrieval parity → "what did agent X tell agent Y about service Z"
  works on the AXON side
- Zero dangerous hallucinations → safe for compliance/audit use
- 30–46% size reduction at rest → dashboards stay fast over million-
  message corpora

Why the measured weaknesses don't kill it:
- Qualifier loss is acceptable because the **NL trace is preserved as
  source of truth**. AXON is the index, not the record.
- Multi-hop drift is irrelevant — observability emits AXON once, never
  re-encodes.
- The 28% native saving doesn't matter — this is post-hoc compression
  of stored traces, not generation-time saving.

Differentiation from the landscape:
- MCP / A2A are wire protocols, not observability. They don't query.
- Langfuse, Arize, Phoenix render NL as flat strings — no symbolic
  intent index, no agent-graph view.
- LangSmith does graph replay within LangGraph only.

Minimum demo (1–2 weeks):
1. OpenTelemetry GenAI exporter that emits NL + AXON twin per span
2. A query API: `intent`, `agent_from`, `agent_to`, `entity`, `time`
3. A React timeline that renders the AXON form as a glanceable
   inter-agent graph, expandable into NL on click
4. Demo on a 50-turn CrewAI run; show "find every ERROR from
   payment-svc to orch in the last hour" in <1s

Adoption risk — honest:
- Buyer is the platform/observability team running large agent fleets
- Real pain (15× token cost in handoffs, no inter-agent causality
  view), modest budget
- Likely lands as a feature inside an existing vendor (Langfuse,
  Arize, Datadog GenAI) rather than a standalone product
- 6-week test: get one design partner from the observability vendor
  space. If no traction, fall back to Plan B.

Realism: 7/10 (the pivot has a buyer, survives all measured
weaknesses, and uses 4 of the 9 measured strengths). Not "VC unicorn"
realism. "Open-source feature with users" realism.

## Plan B

**Methodology paper + benchmark suite as research artifact.**

The pre-registered 9-test framework (parser fidelity, entity
preservation, round-trip, hallucination, retrieval, multi-hop drift,
reasoning under primer, A/B native, adversarial) is itself a
contribution. Nobody has published "we tried to compress agent
chatter on these 9 axes and here's what broke." Tokenization audit
(19/31 Unicode symbols cost 2–3 tokens) is a free citation.

Output: a NeurIPS/EMNLP workshop paper + tagged OSS release of the
benchmark harness. Realism: 8/10 as a paper. 1/10 as a product.

## What I would NOT do

- Do not pitch AXON as "save 74% tokens between agents." The number
  is conditional on verbose baselines that real agents won't produce
  if you tell them to be concise. Internet will surface this within
  weeks of launch.
- Do not try to ship AXON as a wire protocol where the downstream
  agent acts on the AXON. The hop-1 drift with measurable factual
  drift (qm-25: 4.2% → 42%, qm-15: dropped "if no response" clause)
  disqualifies it for any agent-acting-on-AXON scenario.
- Do not try to compete with MCP or A2A. Both are foundation projects
  with vendor backing. A solo-developed protocol does not survive
  there.
- Do not spend weeks fixing the rule-encoder bugs (intent ordering,
  decimal stripping). They are real bugs but they don't change the
  strategic picture — qualifier loss is protocol-level, not
  encoder-level.

## Recommendation

Spend 6 weeks on the observability pivot (Plan A). Concretely:

- Week 1: OTel exporter prototype + AXON-twin emission
- Week 2: Query API on top of a Postgres trace store
- Week 3: React timeline UI, demo against CrewAI sample
- Week 4: 3 design-partner conversations (Langfuse, Arize, Phoenix,
  or any team running ≥5-agent production workflows)
- Week 5–6: integrate with one partner's stack, measure real value

If no design partner says yes by week 6, write the paper (Plan B) and
move on. Total cap: 6 weeks of effort. Either way the work is
recoverable — the benchmark suite is generic, the codebook is open,
the tokenization analysis is publishable.

Either outcome beats continuing to pitch a wire protocol whose
measured numbers don't support the pitch.
