---
name: report
description: Generate a human-readable Markdown report from the most recent lynx audit run. Reads e2e-evidence/<run-id>/verdict.md and per-screen evidence, then prints a structured summary to the session.
allowed-tools: Bash, Read
---

# `/lynx:report` — Audit Report Generator

Produce a human-readable Markdown summary of the most recent `/lynx:audit` or `/lynx:audit-screen` run. The command reads all evidence from the newest `e2e-evidence/<run-id>/` directory and formats it into a structured, scannable report.

## Usage

```
/lynx:report
```

No arguments. Always reports on the most recent run, selected by directory modification time.

## Sample Output

```markdown
# lynx Audit Report
Generated : 2026-04-29T18:30:00Z
Run ID    : 20260429T183000Z
Project   : My Stitch Project

## Summary

| Metric       | Value                |
|--------------|----------------------|
| Screens      | 5 audited            |
| Overall      | PASS                 |
| Passed       | 4                    |
| Failed       | 1                    |
| Duration     | ~4m 12s (estimated)  |

## Per-Screen Results

### screen-98b50e2ddc9943efb387052637738f61 — PASS

| Check                      | Result | Notes                        |
|----------------------------|--------|------------------------------|
| Screenshot captured        | PASS   | 284 KB, non-empty            |
| A11y landmark roles found  | PASS   | main, nav, banner detected   |
| Lighthouse accessibility   | PASS   | Score: 92 (threshold: 70)    |
| Design-token violations    | PASS   | No critical violations found |

### screen-00000000aaaabbbbccccddddeeeeffff — FAIL

| Check                      | Result | Notes                              |
|----------------------------|--------|------------------------------------|
| Screenshot captured        | PASS   | 201 KB, non-empty                  |
| A11y landmark roles found  | PASS   | main, footer detected              |
| Lighthouse accessibility   | FAIL   | Score: 58 (threshold: 70)          |
| Design-token violations    | PASS   | No critical violations found       |

Failure reason: Lighthouse accessibility score 58 is below the required threshold of 70.
Evidence: e2e-evidence/20260429T183000Z/screen-00000000aaaabbbbccccddddeeeeffff/step-03-lighthouse.json

## Evidence Inventory

All evidence files are stored under:
  e2e-evidence/20260429T183000Z/

Run the following to list captured artifacts:
  cat e2e-evidence/20260429T183000Z/evidence-inventory.txt

## Next Steps

To re-audit the failing screen:
  /lynx:audit-screen 00000000aaaabbbbccccddddeeeeffff

To check current status without regenerating the report:
  /lynx:status
```

## How the Most Recent Run Is Selected

```bash
ls -td e2e-evidence/[0-9]* | head -1
```

Run directories use the `YYYYMMDDTHHMMSSZ` timestamp slug format. Lexicographic sort equals chronological order, so the newest directory is always first.

## Evidence Read

| File | Purpose |
|------|---------|
| `e2e-evidence/<run-id>/verdict.md` | Per-screen PASS/FAIL verdicts and failure reasons |
| `e2e-evidence/<run-id>/evidence-inventory.txt` | File list with byte counts for each screen |
| `e2e-evidence/<run-id>/screen-*/step-03-lighthouse.json` | Lighthouse scores per screen (read for FAIL details) |

No files are written by `/lynx:report`.

## Graceful Degradation

| Condition | Behavior |
|-----------|----------|
| No `e2e-evidence/` directory | "No prior lynx audit run found. Run /lynx:audit first." |
| Directory exists but no run subdirs | "No prior lynx audit run found. Run /lynx:audit first." |
| `verdict.md` missing from latest run | "Run appears incomplete — verdict.md not found. Re-run /lynx:audit." |
| `verdict.md` present but empty | "Verdict file is empty — run may have been interrupted. Re-run /lynx:audit." |
| Screen evidence subdir missing | Screen listed as INCONCLUSIVE in report with note: "Evidence directory not found." |

## Differences from `/lynx:status`

| Feature | `/lynx:status` | `/lynx:report` |
|---------|---------------|----------------|
| Output length | Compact (1 screen per line) | Full table per screen |
| Per-check detail | No | Yes (each criterion shown) |
| Evidence file links | Key files only | Full inventory reference |
| Failure analysis | Single-line reason | Expanded notes + evidence path |
| Use case | Quick pass/fail check | Deep review and sharing |

## Related Commands

- `/lynx:audit` — run a full project audit
- `/lynx:audit-screen <screen-id>` — audit a single screen
- `/lynx:status` — view a compact verdict from the most recent run
