---
name: audit-screen
description: Run a UI experience audit on a single screen by ID using the lynx ui-experience-audit skill. Captures screenshot, accessibility snapshot, and design-token evidence for that screen only.
allowed-tools: Bash, Read, Write, mcp__stitch__get_project, mcp__stitch__get_screen, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__take_snapshot, mcp__chrome-devtools__lighthouse_audit
argument-hint: <screen-id>
---

# `/lynx:audit-screen` — Single-Screen UI Experience Audit

Invoke the `lynx:ui-experience-audit` skill against a single screen identified by `<screen-id>`. Use this for targeted investigation after a full `/lynx:audit` surfaces a FAIL on a specific screen, or when iterating on a single screen during design review.

## Usage

```
/lynx:audit-screen <screen-id>
```

`<screen-id>` is the bare screen UUID (without the `screens/` prefix), for example:

```
/lynx:audit-screen 98b50e2ddc9943efb387052637738f61
```

To list all available screen IDs in the current project, run `/lynx:status` or use:

```bash
mcp__stitch__list_screens projectId=<project-id>
```

## What It Does

The single-screen audit pipeline runs these stages:

| Stage | Description |
|-------|-------------|
| **Preflight** | Confirms the screen ID exists in the active Stitch project |
| **Screenshot** | Takes a full-page screenshot of the target screen |
| **A11y snapshot** | Captures the accessibility tree (roles, labels, states) |
| **Design-token check** | Inspects color, typography, and spacing against design system tokens |
| **Lighthouse scan** | Runs accessibility + best-practice checks in desktop mode |
| **Verdict** | Writes per-criterion PASS/FAIL to `verdict.md` |

## Evidence Layout

```
e2e-evidence/
  <run-id>/
    screen-<screen-id>/
      step-01-screenshot.png
      step-02-a11y-snapshot.json
      step-03-lighthouse.json
      step-04-token-audit.json
    verdict.md
    evidence-inventory.txt
```

`<run-id>` format: `YYYYMMDDTHHMMSSZ` (e.g., `20260429T183000Z`).

## PASS Criteria

- Screenshot is non-empty (> 0 bytes) and shows the expected screen content
- Accessibility snapshot contains at least one landmark role (`main`, `nav`, `banner`, etc.)
- Lighthouse accessibility score >= 70
- No design-token violations of severity `critical` (hardcoded values that bypass the token system)

## Error Cases

| Condition | Behavior |
|-----------|----------|
| Screen ID not found in project | Emits error and exits — no evidence written |
| No active Stitch project | Emits "No active Stitch project detected" and exits |
| Screenshot times out | Marks step-01 as FAIL; remaining steps still run |
| Lighthouse unavailable | Step-03 marked INCONCLUSIVE; audit continues |

## Related Commands

- `/lynx:audit` — run the full audit across all screens
- `/lynx:status` — view the most recent audit verdict (includes per-screen breakdown)
- `/lynx:report` — generate a human-readable report from the most recent run

## Skill Reference

This command invokes the `lynx:ui-experience-audit` skill. See `skills/ui-experience-audit/SKILL.md` for the complete PASS criteria specification, evidence-capture protocol, and design-token audit rules.
