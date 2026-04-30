---
name: audit
description: Run a full UI experience audit on the current project using the lynx full-ui-experience-audit skill. Captures screenshots, accessibility snapshots, and design-token evidence under e2e-evidence/<run-id>/.
allowed-tools: Bash, Read, Write, mcp__stitch__get_project, mcp__stitch__list_screens, mcp__stitch__get_screen, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__take_snapshot, mcp__chrome-devtools__lighthouse_audit
---

# `/lynx:audit` — Full UI Experience Audit

Invoke the `lynx:full-ui-experience-audit` skill to run a comprehensive audit across all screens in the current project. Evidence is captured under `e2e-evidence/<run-id>/` and a verdict is written to `e2e-evidence/<run-id>/verdict.md`.

## Usage

```
/lynx:audit
```

No arguments required. The skill auto-detects the active Stitch project and enumerates all screens.

## What It Does

The audit pipeline executes the following stages in order:

| Stage | Description |
|-------|-------------|
| **Preflight** | Verifies the active Stitch project is reachable and at least one screen exists |
| **Screen enumeration** | Lists all screens via `mcp__stitch__list_screens` |
| **Screenshot capture** | Takes a full-page screenshot of each screen |
| **Accessibility snapshot** | Captures the a11y tree for each screen |
| **Design-token audit** | Checks color, typography, and spacing token usage against the project design system |
| **Lighthouse audit** | Runs accessibility, SEO, and best-practice checks (desktop mode) |
| **Verdict synthesis** | Aggregates per-screen results into a single `verdict.md` |

## Evidence Layout

```
e2e-evidence/
  <run-id>/
    screen-<id>/
      step-01-screenshot.png
      step-02-a11y-snapshot.json
      step-03-lighthouse.json
    verdict.md
    evidence-inventory.txt
```

`<run-id>` is a timestamp slug (`YYYYMMDDTHHMMSSZ`) generated at run start.

## PASS Criteria

- All screens produce a non-empty screenshot (> 0 bytes)
- Accessibility snapshot contains at least one landmark role
- No Lighthouse accessibility score below 70
- Design-token audit finds no critical violations (undefined tokens used in production)

## Graceful Degradation

If no Stitch project is active, the skill emits:

```
No active Stitch project detected. Open a project in Stitch and re-run /lynx:audit.
```

If a single screen fails to load, that screen is marked `FAIL` in the verdict and the audit continues for remaining screens.

## Related Commands

- `/lynx:audit-screen <screen-id>` — audit a single screen
- `/lynx:status` — view the verdict from the most recent run
- `/lynx:report` — generate a human-readable report

## Skill Reference

This command invokes the `lynx:full-ui-experience-audit` skill. See `skills/full-ui-experience-audit/SKILL.md` for the full skill specification including all PASS criteria definitions and evidence-capture protocols.
