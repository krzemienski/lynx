# Submission: everything-claude-code (ECC)

**Target repo:** https://github.com/affaan-m/everything-claude-code
**Submission type:** Issue (single-author marketplace; cross-listing is maintainer's call)
**Issue title:** `Cross-listing request: lynx — sharp-eyed visual-audit suite`

---

## Issue body

Hi Affaan — ECC's depth (38 agents, 156 skills) is the gold standard, and I'd love to know if you'd consider cross-listing **lynx** in ECC's marketplace.

**What it is:** Two coupled audit skills:
- `full-ui-experience-audit` — app-wide audit-and-remediate loop (3-cycle convergence, critical-high threshold)
- `ui-experience-audit` — per-screen deep audit (5-phase protocol)

**Why cross-listing:** ECC's TDD/security/code-review hooks would chain naturally with lynx's UI-side audit. ECC users finishing a feature could trigger `lynx → fix-loop` as the visual-experience gate before security/TDD passes.

**Track record:**
- 14/14 detection accuracy across two synthetic shakedowns: WAM 9/9 (entangled fixes — cycle-1 fix unmasks cycle-2 mole) + synth-2 5/5 (independent defects)
- 26/26 strict bundle PASS
- Iron Rule: zero mocks, zero test files
- Standards: WCAG 2.2 AA + APCA Lc ≥ 60, Nielsen's 10 heuristics, iOS HIG, response-shape contract validation

**Repo:** https://github.com/krzemienski/lynx
**Release:** https://github.com/krzemienski/lynx/releases/tag/v1.0.0
**License:** MIT

If cross-listing fits ECC's curation model, here's a plugin entry shaped for ECC's `marketplace.json`:

```json
{
  "name": "lynx",
  "source": "https://github.com/krzemienski/lynx",
  "description": "Two-skill UI/UX audit suite — app-wide and per-screen deep audits. Real-system validation, no mocks, evidence-cited verdicts. 14/14 detection across two synthetic shakedowns (WAM 9/9 + synth-2 5/5).",
  "version": "1.0.0",
  "author": {
    "name": "Nick Krzemienski"
  },
  "homepage": "https://github.com/krzemienski/lynx",
  "repository": "https://github.com/krzemienski/lynx",
  "license": "MIT",
  "keywords": [
    "audit",
    "ui",
    "ux",
    "accessibility",
    "wcag",
    "apca",
    "nielsen"
  ],
  "category": "quality-assurance",
  "tags": [
    "audit",
    "ui",
    "ux",
    "accessibility",
    "wcag",
    "apca",
    "nielsen"
  ],
  "strict": false
}
```

If single-plugin is the design intent for ECC, totally understand. Either way, thanks for shipping ECC — it's the reference.
