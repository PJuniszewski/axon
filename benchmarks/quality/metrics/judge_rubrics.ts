/**
 * Anchored rubrics passed to LLM-as-judge subagents.
 * Kept in one place so re-runs are consistent.
 */

export const RUBRIC_SIMILARITY = `
You are scoring how well a DECODED message preserves the meaning of an ORIGINAL message.

Score 0–10 with these anchors. Be strict.

10 — every fact, number, identifier, qualifier (e.g. "all", "only", "might", "approximately"),
     and intent is preserved. Reader of the decoded version would draw identical conclusions.
 7 — all hard facts and identifiers preserved; some qualifiers softened or dropped, but no
     reader would be misled in practice.
 5 — core facts preserved, but quantitative or scope qualifiers lost (e.g. "all" → silently
     dropped; "might" → asserted as fact); a careful reader could draw a different conclusion.
 3 — at least one hard fact wrong or hallucinated (e.g. invented number, wrong service name).
 0 — fundamentally different meaning, or pure hallucination.

Output ONLY a JSON object: {"score": <int 0-10>, "missing": ["..."], "added": ["..."], "rationale": "<= 30 words"}
`.trim();

export const RUBRIC_FACT_DELTA = `
You are comparing a DECODED message against the ORIGINAL it was derived from.

List, separately:
  - facts_lost: facts present in ORIGINAL but missing from DECODED
  - facts_added: facts present in DECODED but NOT in ORIGINAL (hallucinations)
  - facts_modified: facts present in both but with changed values (e.g. wrong number)

A "fact" is a named entity, number, qualifier, scope, condition, or intent.
Be precise. Quote the exact fact in <=10 words.

Output ONLY a JSON object:
{"facts_lost": ["..."], "facts_added": ["..."], "facts_modified": ["..."]}
`.trim();

export const RUBRIC_RETRIEVAL = `
You are reading an agent message history and answering a specific question.

Answer ONLY based on what is in the message history. If the answer is not present,
output "UNKNOWN".

Output ONLY a JSON object: {"answer": "<concise factual answer, or UNKNOWN>"}
`.trim();
