You are an AXON decoder. AXON codebook:

PROTOCOL:AXON — agent msgs in this format only.
! req ? query == info -> delegate OK confirm NO reject ERR error DONE complete RPT retry !! urgent +> merge
@agent [[payload]] <<ctx>> | pipe : assign # ref && and || or >= gte <= lte <: filter SUM agg [] batch T/O timeout
FORMAT: INTENT[@AGENT][[PAYLOAD]]<<CTX>>
! @orch [[rev PR#42 | ? tst pass -> SUM rpt]]
ERR pay.svc:T/O<<30s>> -> RPT expbkf
DONE [[svc#12:run && hchk:pass && ERR:_]]
All agent msgs in AXON. NL for humans only.

You will receive a list of AXON inputs. Some are MALFORMED, AMBIGUOUS, or
PATHOLOGICAL. For each, you must decide:

  - "decoded": if the input can be confidently expanded to natural English,
    output the expansion. If not, output "REFUSE".
  - "confidence": 0–10 (10 = certain unambiguous meaning, 0 = nothing to
    decode).
  - "issue": brief tag explaining the issue if any, else "" (empty).

Do NOT invent meaning. If the input is broken, prefer REFUSE.

Output ONLY a JSON array of {"id", "decoded", "confidence", "issue"}.

PAYLOAD:
[
  {
    "id": "ad-01",
    "axon": "⊗ ⟦pay.svc:timeout"
  },
  {
    "id": "ad-02",
    "axon": "?@inv ⟦status⟩ ⌛5s"
  },
  {
    "id": "ad-03",
    "axon": "🜨 ⟦deploy v2⟧"
  },
  {
    "id": "ad-04",
    "axon": "! ⊗ ⟦pay.svc fail⟧"
  },
  {
    "id": "ad-05",
    "axon": "≡ ⟦⟧"
  },
  {
    "id": "ad-06",
    "axon": "∀ ∃ ∅ ⊂ ⊕"
  },
  {
    "id": "ad-07",
    "axon": "∎ ⟦depl fail | depl ok⟧"
  },
  {
    "id": "ad-08",
    "axon": "→@ ⟦rev PR#42⟧"
  },
  {
    "id": "ad-09",
    "axon": "¬⊗ ⟦pay.svc:timeout⟧"
  },
  {
    "id": "ad-10",
    "axon": "@a → @b → @a ⟦loop⟧"
  },
  {
    "id": "ad-11",
    "axon": ""
  },
  {
    "id": "ad-12",
    "axon": "   \n\t  "
  },
  {
    "id": "ad-13",
    "axon": "Please review pull request 42"
  },
  {
    "id": "ad-14",
    "axon": "≡ ⟦records:NaN⟧"
  },
  {
    "id": "ad-15",
    "axon": "? @tomorrow.weather ⟦?⟧"
  }
]