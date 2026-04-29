# Submission: oh-my-claudecode (OMC)

**Target repo:** https://github.com/Yeachan-Heo/oh-my-claudecode
**Submission type:** Issue (single-author marketplace; cross-listing is maintainer's call)
**Issue title:** `Cross-listing request: lynx — sharp-eyed visual-audit suite`

---

## Issue body

Hi Yeachan — your `oh-my-claudecode` ecosystem inspired the design of a couple of skills I've shipped, and I'd love to know if you'd consider cross-listing **lynx** in OMC's marketplace.

**What it is:** Two coupled audit skills:
- `full-ui-experience-audit` — full app audit-and-remediate loop with 3-cycle convergence
- `ui-experience-audit` — per-screen deep audit covering visual, interactive, content, heuristics

**Why cross-listing:** OMC's strength is multi-agent orchestration; lynx is what an OMC user would dispatch when their app needs a UI audit. The two are complementary — OMC users can chain `executor → ui-experience-audit → fix-loop` without leaving OMC.

**Repo:** https://github.com/krzemienski/lynx
**Release:** https://github.com/krzemienski/lynx/releases/tag/v1.0.0
**License:** MIT
**Standards:** WCAG 2.2 AA + APCA, Nielsen's heuristics, iOS HIG, real-system validation (no mocks)

If you'd rather keep OMC as a single-plugin manifest, totally understand — happy to know either way. If yes, here's a plugin entry shaped for OMC's `marketplace.json`:

```json
{
  "name": "lynx",
  "description": "Sharp-eyed visual-audit suite — two coupled skills for app-wide and per-screen UI/UX audits. Real-system validation, no mocks. Pairs with OMC's executor + verifier agents.",
  "version": "1.0.0",
  "author": {
    "name": "Nick Krzemienski",
    "email": "krzemienski@gmail.com"
  },
  "source": "https://github.com/krzemienski/lynx",
  "category": "quality-assurance",
  "homepage": "https://github.com/krzemienski/lynx",
  "tags": [
    "audit",
    "ui",
    "ux",
    "design",
    "accessibility",
    "wcag",
    "apca",
    "nielsen"
  ]
}
```

Open to whatever shape works. Thanks.
