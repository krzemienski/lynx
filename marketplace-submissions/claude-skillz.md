# Submission: claude-skillz

**Target repo:** https://github.com/ntcoding/claude-skillz
**Submission type:** Issue (multi-plugin marketplace under single author; ask before assuming PR is welcome)
**Issue title:** `Cross-listing request: lynx — sharp-eyed visual-audit suite`

---

## Issue body

Hi Nick — claude-skillz's `automatic-code-review` and `track-and-improve` would pair well with **lynx**, a UI/UX audit suite I just shipped. Wondering if you'd consider cross-listing.

**What it is:** Two coupled audit skills:
- `full-ui-experience-audit` — app-wide audit-and-remediate loop
- `ui-experience-audit` — per-screen deep audit (visual / interactive / content / heuristics)

**Pairing:** `automatic-code-review` runs on session stop; lynx fits as the UI-side complement that fires before commit on visual/UX changes.

**Repo:** https://github.com/krzemienski/lynx
**Release:** https://github.com/krzemienski/lynx/releases/tag/v1.0.0
**License:** MIT

Plugin entry for claude-skillz's `marketplace.json`:

```json
{
  "name": "lynx",
  "source": "https://github.com/krzemienski/lynx",
  "description": "Two-skill UI/UX audit suite — app-wide and per-screen deep audits. Real-system validation, no mocks. Pairs with automatic-code-review for visual-side coverage.",
  "version": "1.0.0",
  "category": "design",
  "keywords": ["audit", "ui", "ux", "accessibility", "wcag", "apca", "nielsen"]
}
```

Happy to adjust. Thanks.
