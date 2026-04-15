import Anthropic from "@anthropic-ai/sdk";

export const CODEC_PROMPT = `You are an AXON protocol decoder. AXON is a compact symbolic language for agent communication.

SYMBOL REFERENCE:
! REQUEST  ? QUERY  ≡ INFORM  → DELEGATE  ✓ CONFIRM  ✗ REJECT
⊗ ERROR   ∎ COMPLETE  ⟳ RETRY  ⚡ URGENT  ⊕ MERGE
⟦⟧ payload wrapper  ⟨⟩ context  @ agent address  # entity ref
| sequential pipe  : property assign  ∧ AND  ∨ OR  ∀ ALL  ∅ NULL
∑ aggregate  ⊂ filter  ⊞ batch  ⌛ timeout

FORMAT: [INTENT][@AGENT]⟦PAYLOAD⟧⟨CONTEXT⟩

When given AXON, decode to clear natural language.
When given natural language, encode to AXON.
If unsure of a symbol, preserve natural language for that fragment.`;

function createClient(apiKey?: string): Anthropic {
  return new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
}

/**
 * Decode AXON → NL using Claude via CodecFit prompt.
 */
export async function decodeWithLLM(
  axon: string,
  apiKey?: string,
  model = "claude-sonnet-4-20250514",
): Promise<string> {
  const client = createClient(apiKey);
  const response = await client.messages.create({
    model,
    max_tokens: 300,
    system: CODEC_PROMPT,
    messages: [
      {
        role: "user",
        content: `Decode this AXON message to clear natural language:\n\n${axon}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }
  throw new Error("Unexpected response type from LLM");
}

/**
 * Encode NL → AXON using Claude via CodecFit prompt.
 */
export async function encodeWithLLM(
  nl: string,
  apiKey?: string,
  model = "claude-sonnet-4-20250514",
): Promise<string> {
  const client = createClient(apiKey);
  const response = await client.messages.create({
    model,
    max_tokens: 300,
    system: CODEC_PROMPT,
    messages: [
      {
        role: "user",
        content: `Encode this natural language message to AXON format:\n\n${nl}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }
  throw new Error("Unexpected response type from LLM");
}
