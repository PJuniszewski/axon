import { CODEBOOK, SYMBOL_MAP } from "@axon/core";
import type { AxonSymbol, CompressionResult } from "@axon/core";
import { estimateNLTokens, estimateAxonTokens } from "./tokenCounter.js";

// ---------- Intent Detection (ordered checks) ----------
// The first match from the START of the sentence takes priority.
// We check for the first verb/keyword to determine the primary intent.

const INTENT_RULES: Array<{ patterns: RegExp; symbol: string }> = [
  { patterns: /\b(urgent(?:ly)?|immediately|asap|right away)\b/i,  symbol: "⚡" },
  { patterns: /\b(error|failed|exception|unable)\b/i,            symbol: "⊗" },
  { patterns: /\b(done|finished|completed|finalized)\b/i,        symbol: "∎" },
  { patterns: /\b(forward to|delegate|assign to)\b/i,            symbol: "→" },
  { patterns: /\b(confirm(?:ed)?|acknowledge[d]?|accept(?:ed)?|agreed|approved)\b/i, symbol: "✓" },
  { patterns: /\b(reject|refuse|deny|denied|decline)\b/i,        symbol: "✗" },
  { patterns: /\b(merge|combine|consolidate)\b/i,                symbol: "⊕" },
  { patterns: /\b(retry|again|re-?run|repeat)\b/i,               symbol: "⟳" },
  { patterns: /\b(what|which|verify|is there|are there|how many|how much|where)\b/i, symbol: "?" },
  { patterns: /\b(report|inform|result is|status:|here is|here are|update:)\b/i, symbol: "≡" },
  { patterns: /\b(please|could you|would you|i need|do|run|execute|create|send|fetch|deploy|review|start|build|process|make|get|pull|push|check)\b/i, symbol: "!" },
];

function detectIntent(text: string): { symbol: string; remaining: string } {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.test(text)) {
      return { symbol: rule.symbol, remaining: text };
    }
  }
  return { symbol: "!", remaining: text };
}

// ---------- Agent Extraction ----------

const AGENT_PATTERNS = [
  /\bto (?:the )?(\w[\w-]*)\s*(?:agent|service|worker|module|team)\b/i,
  /\bforward (?:to )?(\w[\w-]*)\b/i,
  /\bdelegate (?:to )?(\w[\w-]*)\b/i,
  /\bassign (?:to )?(\w[\w-]*)\b/i,
  /\bsend (?:to )?(\w[\w-]*)\s*(?:agent|service|worker)\b/i,
  /@(\w[\w-]*)\b/,
];

function extractAgent(text: string): { agent?: string; remaining: string } {
  for (const pattern of AGENT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const agent = match[1];
      const remaining = text.replace(match[0], " ").trim();
      return { agent, remaining };
    }
  }
  return { remaining: text };
}

// ---------- Filler Word Stripping ----------

const FILLER_PHRASES = [
  "i need you to",
  "could you please",
  "would you please",
  "would you mind",
  "i would like to",
  "i would like you to",
  "make sure that",
  "ensure that",
  "in order to",
  "could you",
  "would you",
  "i need",
  "please",
  "that are",
  "that is",
  "which is",
  "which are",
  "with the",
  "from the",
  "to the",
  "for the",
  "on the",
  "in the",
  "of the",
  "and the",
  "the following",
  "following",
  "there are",
  "there is",
  "has been",
  "have been",
  "will be",
  "as well as",
  "in order to",
  "according to",
  "such as",
];

const FILLER_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "it", "its", "this", "that", "these", "those",
  "also", "just", "then", "so", "very", "really",
  "basically", "actually", "currently",
  "of", "with", "if", "no", "not", "there", "and", "or", "but",
  "to", "for", "from", "by", "at", "in", "on", "up",
  "has", "have", "had", "do", "does", "did",
  "can", "could", "would", "should", "may", "might",
  "i", "you", "we", "they", "he", "she",
  "send", "sent", "get", "got",
  "data", "them", "into", "need", "needs",
  "gone", "down", "across", "when", "now", "due",
  "back", "been", "next", "step", "while",
  "where", "what", "which", "how",
  "my", "your", "our", "their",
  "any", "some", "each", "every", "all",
  "here", "below", "above",
  "please", "kindly",
  "than", "more", "most", "less",
  "like", "such", "only",
  "about", "over", "under", "between",
  "other", "another", "rest",
]);

function stripFillers(text: string): string {
  let result = text;

  // Strip multi-word filler phrases first (longest first)
  for (const phrase of FILLER_PHRASES) {
    result = result.replace(new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi"), " ");
  }

  // Strip single filler words
  const words = result.split(/\s+/).filter(Boolean);
  const filtered = words.filter((w) => !FILLER_WORDS.has(w.toLowerCase()));
  return filtered.join(" ");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- Phrase → Symbol Mapping ----------

const PHRASE_MAP: Array<[RegExp, string | ((m: string) => string)]> = [
  // Multi-word phrases first (longer matches first)
  [/\bpull request(?:s)?\b/gi,          "PR"],
  [/\ball tests?\b/gi,                  "tst.∀"],
  [/\breport back\b/gi,                 "→rpt"],
  [/\bnot found\b/gi,                   "∅"],
  [/\bhealth check(?:s)?\b/gi,          "health"],
  [/\berror occurred?\b/gi,             "⊗"],
  [/\bexponential backoff\b/gi,         "exp.bak"],
  [/\bcode review\b/gi,                 "rev"],
  [/\bcode structure\b/gi,              "struct"],
  [/\bbatch operation\b/gi,             "⊞"],
  [/\btop \d+/gi,                       (m: string) => `top${m.match(/\d+/)?.[0]}`],

  // Single word → symbol/abbreviation
  [/\bpassing\b/gi,                     "pass"],
  [/\bsummar(?:y|ize|izing)\b/gi,       "∑"],
  [/\borchestrator\b/gi,                "orch"],
  [/\bretry(?:ing)?\b/gi,               "⟳"],
  [/\bdeployment\b/gi,                  "depl"],
  [/\bdeploy(?:ed|s|ing)?\b/gi,          "depl"],
  [/\bdatabase\b/gi,                    "db"],
  [/\bfilter(?:ed|ing|s)?\b/gi,         "⊂"],
  [/\bvalidat(?:e|ed|ion|ing)\b/gi,     "valid"],
  [/\baggregate[ds]?\b/gi,              "∑"],
  [/\breport(?:s|ed|ing)?\b/gi,          "rpt"],
  [/\bstructured?\b/gi,                 "struct"],
  [/\bsecurity\b/gi,                    "sec"],
  [/\btimeout(?:ed|s)?\b/gi,            "⌛"],
  [/\bconfiguration\b/gi,               "cfg"],
  [/\bapplication(?:s)?\b/gi,           "app"],
  [/\bperformance\b/gi,                 "perf"],
  [/\benvironment(?:s)?\b/gi,           "env"],
  [/\bnotification(?:s)?\b/gi,          "notif"],
  [/\bauthentication\b/gi,              "auth"],
  [/\bauthorization\b/gi,               "authz"],
  [/\bresponse(?:s)?\b/gi,              "rsp"],
  [/\brequests?\b/gi,                   "req"],
  [/\bservices?\b/gi,                   "svc"],
  [/\bconnection(?:s)?\b/gi,            "conn"],
  [/\bpipeline(?:s)?\b/gi,              "pipe"],
  [/\bprocessing\b/gi,                  "proc"],
  [/\bexecution\b/gi,                   "exec"],
  [/\bscheduled?\b/gi,                  "sched"],
  [/\boperations?\b/gi,                 "ops"],
  [/\bmonitor(?:ing)?\b/gi,             "mon"],
  [/\bcomplete(?:d|ly)?\b/gi,           "done"],
  [/\bfinished\b/gi,                    "done"],
  [/\bsuccessful(?:ly)?\b/gi,           "ok"],
  [/\bfailed?\b/gi,                     "fail"],
  [/\bfailure\b/gi,                     "fail"],
  [/\berrors?\b/gi,                      "⊗"],
  [/\bimmediately\b/gi,                 "⚡"],
  [/\burgent(?:ly)?\b/gi,               "⚡"],
  [/\bresults?\b/gi,                    "res"],
  [/\binformation\b/gi,                 "info"],
  [/\bavailable\b/gi,                   "avail"],
  [/\brequired?\b/gi,                   "req'd"],
  [/\bprevious(?:ly)?\b/gi,             "prev"],
  [/\bgenerat(?:e|ed|ing)\b/gi,         "gen"],
  [/\brecords?\b/gi,                    "rec"],
  [/\breview(?:ed|ing|s)?\b/gi,         "rev"],
  [/\brunning\b/gi,                     "run"],
  [/\bseconds?\b/gi,                    "s"],
  [/\bminutes?\b/gi,                    "m"],
  [/\bnumber\b/gi,                      "#"],
  [/\bcheck(?:ed|ing|s)?\b/gi,          "chk"],
  [/\bpayment\b/gi,                     "pay"],
  [/\bstandards?\b/gi,                  "std"],
  [/\bassess(?:ment|ing)?\b/gi,         "eval"],
  [/\bkeywords?\b/gi,                   "kw"],
  [/\bextract(?:ed|ing|ion)?\b/gi,      "ext"],
  [/\bscrape[ds]?\b/gi,                 "scrp"],
  [/\bworkers?\b/gi,                    "wkr"],
  [/\bstatus\b/gi,                      "stat"],
  [/\bcurrent(?:ly)?\b/gi,              "cur"],
  [/\bsystem\b/gi,                      "sys"],
  [/\bupdate[ds]?\b/gi,                 "upd"],
  [/\bdownload(?:ed|ing)?\b/gi,         "dl"],
  [/\bupload(?:ed|ing)?\b/gi,           "ul"],
  [/\bcustomer(?:s)?\b/gi,              "cust"],
  [/\banalyz(?:e|ed|ing|is)\b/gi,       "anl"],
  [/\banalysis\b/gi,                    "anl"],
  [/\bpending\b/gi,                     "pend"],
  [/\bprocess(?:ed|ing)?\b/gi,          "proc"],
  [/\bschedule[ds]?\b/gi,               "sched"],
  [/\btransact(?:ion|ions)\b/gi,        "txn"],
  [/\bnotif(?:y|ied|ying)\b/gi,         "notif"],
  [/\bcredentials?\b/gi,                "cred"],
  [/\brendered?\b/gi,                   "rend"],
  [/\bmessage(?:s)?\b/gi,               "msg"],
  [/\binvestigat(?:e|ed|ing|ion)\b/gi,  "inv"],
  [/\bresolution\b/gi,                  "fix"],
  [/\bresolv(?:e|ed|ing)\b/gi,          "fix"],
  [/\bcritical\b/gi,                    "⚡"],
  [/\balert(?:s)?\b/gi,                 "⚡"],
  [/\btransfer(?:red|ring)?\b/gi,       "xfer"],
  [/\btransform(?:ed|ing)?\b/gi,        "xfm"],
  [/\bwarnings?\b/gi,                   "warn"],
  [/\bproduction\b/gi,                  "prod"],
  [/\breplicat(?:e|ed|ing|ion)\b/gi,    "repl"],
  [/\bdiscrep(?:ancy|ancies)\b/gi,      "diff"],
  [/\bmigrat(?:e|ed|ing|ion)\b/gi,      "migr"],
  [/\bincident\b/gi,                    "inc"],
  [/\bdegrad(?:ed|ation|ing)\b/gi,      "deg"],
  [/\bsubset\b/gi,                      "⊂"],
  [/\bfinding(?:s)?\b/gi,              "res"],
  [/\bcluster\b/gi,                     "clu"],
  [/\bverif(?:y|ied|ying|ication)\b/gi, "ver"],
  [/\brespond(?:ing)?\b/gi,             "rsp"],
  [/\bdelivery\b/gi,                    "dlv"],
  [/\bpriority\b/gi,                    "pri"],
  [/\bbroadcast\b/gi,                   "→∀"],
  [/\bdistribut(?:e|ed|ing)\b/gi,       "dist"],
  [/\bworkload\b/gi,                    "load"],
  [/\bsession\b/gi,                     "sess"],
  [/\bretrained?\b/gi,                  "retr"],
  [/\bcontinue\b/gi,                    "cont"],
  [/\bcontinuous\b/gi,                  "cont"],
  [/\bintegration\b/gi,                 "int"],
  [/\bsuites?\b/gi,                     "ste"],
  [/\bwarehous(?:e|ing)\b/gi,           "wh"],
  [/\bassigned?\b/gi,                   "asgn"],
  [/\bissues?\b/gi,                     "iss"],
  [/\bresearch\b/gi,                    "rsch"],
  [/\bpaus(?:e|ed|ing)\b/gi,            "pau"],
  [/\bresum(?:e|ed|ing)\b/gi,           "cont"],
  [/\bready\b/gi,                       "rdy"],
  [/\blatest\b/gi,                      "lat"],
  [/\bmodel\b/gi,                       "mdl"],
  [/\bformat\b/gi,                      "fmt"],
  [/\bnodes?\b/gi,                      "nod"],
  [/\bqueue\b/gi,                       "que"],
  [/\blevel\b/gi,                       "lvl"],
  [/\bscheduling\b/gi,                  "sched"],
  [/\blater\b/gi,                       "lat"],
  [/\bcorrectly\b/gi,                   "ok"],
  [/\bworking\b/gi,                     "wk"],
  [/\bsevere\b/gi,                      "sev"],
  [/\bexperiencing\b/gi,                ""],
  [/\bconfigured?\b/gi,                 "cfg"],
  [/\bfailing\b/gi,                     "fail"],
  [/\bimmediately?\b/gi,                ""],
  [/\bresponse\b/gi,                    "rsp"],
];

function mapPhrases(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PHRASE_MAP) {
    if (typeof replacement === "string") {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement as (match: string) => string);
    }
  }
  return result;
}

// ---------- Stem Compression ----------

function compressStems(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words
    .map((word) => {
      // Don't compress words with symbols, numbers, or already short
      if (word.length <= 4 || /[^a-zA-Z]/.test(word)) {
        return word;
      }
      // Truncate to 3 chars
      return word.slice(0, 3);
    })
    .join(" ");
}

// ---------- Cleanup ----------

function cleanupOutput(text: string): string {
  return text
    .replace(/[,;.!?:]+/g, "")    // strip punctuation
    .replace(/\s+/g, " ")          // collapse whitespace
    .trim();
}

// ---------- Symbol Detection ----------

function detectSymbols(encoded: string): AxonSymbol[] {
  const found: AxonSymbol[] = [];
  for (const entry of CODEBOOK) {
    if (encoded.includes(entry.symbol)) {
      found.push(entry);
    }
  }
  return found;
}

// ---------- Main Encoder ----------

export interface EncodeOptions {
  /** Use ASCII-safe symbols (1 token each on cl100k_base) instead of Unicode */
  ascii?: boolean;
}

/**
 * Encode a natural language message into AXON format.
 * Pure rule-based — no LLM call needed.
 *
 * @param nl Natural language input
 * @param options.ascii If true, use ASCII-safe symbols for better tokenization
 */
export function encode(nl: string, options?: EncodeOptions): CompressionResult {
  const original = nl.trim();
  const useAscii = options?.ascii ?? false;

  if (!original) {
    return {
      original,
      encoded: "",
      nlTokens: 0,
      axonTokens: 0,
      reductionPct: 0,
      symbols: [],
    };
  }

  // 1. Detect intent
  const { symbol: intentSymbol, remaining: afterIntent } = detectIntent(original);

  // 2. Extract agent
  const { agent, remaining: afterAgent } = extractAgent(afterIntent);

  // 3. Strip fillers
  const stripped = stripFillers(afterAgent);

  // 4. Map phrases to symbols
  const mapped = mapPhrases(stripped);

  // 5. Compress stems
  const compressed = compressStems(mapped);

  // 6. Clean up
  const cleaned = cleanupOutput(compressed);

  // 7. Build AXON format — use ASCII delimiters if requested
  let finalIntent = intentSymbol;
  if (useAscii) {
    const entry = SYMBOL_MAP.get(intentSymbol);
    if (entry?.ascii) finalIntent = entry.ascii;
  }

  let encoded = finalIntent;
  if (agent) {
    encoded += `@${agent}`;
  }

  const pOpen = useAscii ? "[[" : "⟦";
  const pClose = useAscii ? "]]" : "⟧";

  if (cleaned) {
    let payload = cleaned;
    if (useAscii) {
      // Replace Unicode symbols with ASCII alternatives in payload
      for (const entry of CODEBOOK) {
        if (entry.ascii && payload.includes(entry.symbol)) {
          payload = payload.replaceAll(entry.symbol, entry.ascii);
        }
      }
    }
    encoded += `${pOpen}${payload}${pClose}`;
  }

  // 8. Token counts — real tokenizer
  const nlTokens = estimateNLTokens(original);
  const axonTokens = estimateAxonTokens(encoded);
  const reductionPct =
    nlTokens > 0 ? Math.round((1 - axonTokens / nlTokens) * 100) : 0;

  return {
    original,
    encoded,
    nlTokens,
    axonTokens,
    reductionPct,
    symbols: detectSymbols(encoded),
  };
}
