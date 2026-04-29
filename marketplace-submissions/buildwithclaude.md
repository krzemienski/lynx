# Submission: buildwithclaude

**Target repo:** https://github.com/davepoon/buildwithclaude
**Submission type:** Issue → PR (after maintainer ack)
**Issue title:** `Plugin submission: lynx — sharp-eyed visual-audit suite (2 skills)`

---

## Issue body

Hi davepoon — submitting **lynx** for community marketplace inclusion.

**What it is:** Two coupled audit skills that find UI/UX defects through real-system probes. No mocks, no test files, evidence-cited verdicts.

- `full-ui-experience-audit` — app-wide audit-and-remediate loop (3-cycle convergence, critical-high threshold)
- `ui-experience-audit` — per-screen deep audit (5-phase: triage → visual → interactive → content → heuristics)

**Track record:** 9/9 defect detection on a known-mole synthetic with entangled fixes (cycle-1 fix unmasks cycle-2 mole). 26/26 strict bundle PASS.

**Standards covered:** WCAG 2.2 AA + APCA Lc ≥ 60, Nielsen's 10 heuristics, native iOS HIG, web protocol with response-shape contract validation.

**Repo:** https://github.com/krzemienski/lynx
**Release:** https://github.com/krzemienski/lynx/releases/tag/v1.0.0
**License:** MIT

Suggested category: `design` or `quality-assurance`.

If accepted, the plugin entry to drop into `marketplace.json` is below.

```json
{
  "name": "lynx",
  "description": "Sharp-eyed visual-audit suite for Claude Code — two coupled skills find UI/UX defects through real-system probes (contrast failures, false affordances, modal opacity, latent contract mismatches). No mocks, no test files, evidence-cited verdicts. 9/9 detection accuracy on a known-mole synthetic.",
  "version": "1.0.0",
  "author": {
    "name": "Nick Krzemienski",
    "url": "https://github.com/krzemienski"
  },
  "repository": "https://github.com/krzemienski/lynx",
  "license": "MIT",
  "keywords": [
    "audit",
    "ui",
    "ux",
    "design",
    "accessibility",
    "wcag",
    "apca",
    "nielsen",
    "agent-browser",
    "ios",
    "web",
    "fullstack"
  ],
  "category": "design",
  "source": "./plugins/lynx"
}
```

Happy to adjust shape/category to match your conventions. Thanks for considering.
