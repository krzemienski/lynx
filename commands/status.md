---
name: status
description: Report the verdict from the most recent lynx audit run. Reads e2e-evidence/<run-id>/verdict.md and prints a summary. Returns a clear "no prior run" message if no audit has been executed yet.
allowed-tools: Bash, Read
---

# `/lynx:status` — Most Recent Audit Verdict

Display the verdict from the most recent `/lynx:audit` or `/lynx:audit-screen` run. The command scans `e2e-evidence/` for the newest run directory, reads its `verdict.md`, and prints a structured summary to the session.

## Usage

```
/lynx:status
```

No arguments. Always reports on the most recent run by directory modification time.

## Output — When a Prior Run Exists

```
lynx audit status
=================
Run ID   : 20260429T183000Z
Screens  : 5 audited
Overall  : PASS (4 PASS, 1 FAIL)

Per-screen breakdown:
  screen-98b50e2ddc9943efb387052637738f61  PASS
  screen-a1b2c3d4e5f6789012345678abcdef01  PASS
  screen-deadbeef000000001111111122222222  PASS
  screen-cafebabe111111112222222233333333  PASS
  screen-00000000aaaabbbbccccddddeeeeffff  FAIL
    Reason: Lighthouse accessibility score 58 (threshold 70)
    Evidence: e2e-evidence/20260429T183000Z/screen-00000000aaaabbbbccccddddeeeeffff/step-03-lighthouse.json

Re-audit failed screen:
  /lynx:audit-screen 00000000aaaabbbbccccddddeeeeffff

Full report:
  /lynx:report
```

## Output — When No Prior Run Exists

```
No prior lynx audit run found.

Run /lynx:audit to perform a full project audit, or
run /lynx:audit-screen <screen-id> for a single-screen audit.
```

## How the Most Recent Run Is Selected

The command resolves the most recent run using the following logic:

```bash
ls -td e2e-evidence/[0-9]* | head -1
```

Directories named with the `YYYYMMDDTHHMMSSZ` timestamp format are sorted lexicographically (which equals chronological order). The newest directory is always selected.

## Evidence Read

| File | Purpose |
|------|---------|
| `e2e-evidence/<run-id>/verdict.md` | Primary source of PASS/FAIL verdicts per screen |
| `e2e-evidence/<run-id>/evidence-inventory.txt` | Used to count evidence files and detect empty/missing artifacts |

No files are written by `/lynx:status`.

## Graceful Degradation

| Condition | Behavior |
|-----------|----------|
| No `e2e-evidence/` directory | "No prior lynx audit run found." message |
| Directory exists but no run subdirs | "No prior lynx audit run found." message |
| `verdict.md` missing from latest run | "Run appears incomplete — verdict.md not found. Re-run /lynx:audit." |
| `verdict.md` present but empty | "Verdict file is empty — run may have been interrupted. Re-run /lynx:audit." |

## Related Commands

- `/lynx:audit` — run a full project audit
- `/lynx:audit-screen <screen-id>` — audit a single screen
- `/lynx:report` — generate a human-readable HTML/Markdown report from the most recent run
