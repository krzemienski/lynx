# Cycle Report — `audit-evidence/cycle-NN/REPORT.md`

Copy this template into each cycle directory and fill it in as the cycle
runs. The lead writes this; subagents contribute via `findings.json` and
the per-screen / per-interaction reports they save into the cycle directory.

---

```markdown
# Full UI Experience Audit — Cycle <N>

Started: <ISO timestamp>
Completed: <ISO timestamp>
Duration: <human-readable>

## Run configuration (carried from Phase 0)
- App: <name>
- Platform: ios | web | fullstack | cross-platform
- Mode: solo | team
- Threshold: critical-only | critical-high | critical-high-medium | zero-defects
- Cycle counter: <N>

## Coverage axes audited this cycle
- [ ] Light mode
- [ ] Dark mode
- [ ] Mobile viewport
- [ ] Tablet viewport
- [ ] Desktop viewport
- [ ] Empty / loading / populated / error / overflow states

(Mark only what was actually audited. Don't aspirationally check boxes.)

## Phase 1 — Discovery
- Screens inventoried: <N>
- Interactions inventoried: <N>
- Backend endpoints inventoried: <N>
- Diff vs previous cycle: +<added> / -<removed> / ~<changed>
- Inventory file: cycle-<N>/inventory.md

## Phase 2 — Per-screen UX audit
- Screens audited: <N> / <total>
- Findings entered: <N>
  - CRITICAL: <count>
  - HIGH: <count>
  - MEDIUM: <count>
  - LOW: <count>
- Per-screen reports: cycle-<N>/ux-reports/

### Top UX findings this cycle
| ID | Screen | Severity | Title | Status at cycle exit |
|----|--------|----------|-------|----------------------|
| F101 | Settings | HIGH | Dark mode contrast fails on muted text | fixed |
| F102 | Inbox (empty state) | HIGH | False affordance: "Get started" tile not wired | fixed |
| F103 | Account profile | MEDIUM | Avatar upload missing focus indicator | open (below threshold) |

## Phase 3 — Functional validation
- Interactions validated: <N> / <total>
- Backend endpoints validated: <N> / <total>
- Findings entered: <N>
  - CRITICAL: <count>
  - HIGH: <count>
  - MEDIUM: <count>
  - LOW: <count>
- Per-interaction evidence: cycle-<N>/functional-evidence/

### Top functional findings this cycle
| ID | Interaction | Severity | Symptom | Status at cycle exit |
|----|-------------|----------|---------|----------------------|
| F201 | I003 Save profile | HIGH | PATCH returns 200 but UI shows "save failed" toast | fixed |
| F202 | I006 Avatar upload | HIGH | POST /api/avatar returns 404 (route mismatch) | fixed |
| F203 | E04 GET /api/sessions | MEDIUM | Response includes deprecated "userId" field | open (below threshold) |

## Phase 4 — Remediation
- Findings remediated this cycle: <N>
- Average diagnose-to-fix-to-verify time: <minutes>
- Fixes by class:
  - Crash: <N>
  - Backend: <N>
  - Navigation: <N>
  - Data: <N>
  - Visual: <N>
  - UX: <N>
- Commits this cycle:
  - <commit hash> fix(settings): correct dark-mode muted contrast
  - <commit hash> fix(avatar): align frontend POST path with backend route
  - …

### Stuck / escape-hatch findings (if any)
| ID | Reason | Disposition |
|----|--------|-------------|
| F203 | Below threshold; documented for follow-up | Open |
| F104 | Third-party library issue (react-virtual) | Routed upstream |

## Phase 5 — Convergence check
- Findings entered total: <N>
- Findings remediated total: <N>
- Findings still open at cycle exit: <N>
- Open findings above threshold: <N> → <continue> | <proceed-to-phase-6>

(If above threshold, the loop continues to cycle <N+1>. If at or below
threshold, the next phase is Phase 6 confirmation pass.)

### Regression check vs cycle <N-1>
- New findings introduced by cycle-<N-1> fixes: <list of IDs, or "none">
- Previous open findings still present: <list of IDs, or "none">
- Stuck-state risk: low | medium | high

## Subagent contribution log (team mode only)
| Agent role | Tasks | Findings produced | Notes |
|-----------|-------|-------------------|-------|
| explorer | inventory generation | — | one-shot |
| ux-validator-1 | screens S01, S02, S04 | 7 (1H, 4M, 2L) | |
| ux-validator-2 | screens S03, S05 | 4 (1C, 2H, 1M) | one screen escalated for destructive interaction |
| functional-validator | interactions I001-I006 | 5 (1C, 3H, 1M) | |
| api-validator-1 | endpoints E01-E04 | 2 (1H, 1M) | parallel; finished ahead of functional-validator |
| api-validator-2 | endpoints E05-E06 | 1 (0H, 1M) | |

## Evidence ledger this cycle
Total artifacts: <N>
- ux-reports/*.md: <N>
- ux-reports/*.png: <N>
- functional-evidence/*.png: <N>
- functional-evidence/*.json: <N> (curl responses)
- functional-evidence/*-logs.txt: <N> (iOS only)
- manifest.json updated: yes/no

## Cycle verdict
PROCEED TO CYCLE <N+1>  |  PROCEED TO PHASE 6 (CONFIRMATION PASS)

Reason: <one paragraph summary>

## Notes for next cycle (if proceeding)
- <e.g., "Phase 4 introduced new auth path; cycle <N+1> Phase 1 must re-grep
  for routes">
- <e.g., "Mobile viewport coverage deferred — pick up in cycle <N+1>">
- <e.g., "F203 watching for stuck-state pattern; if still open after cycle
  <N+1>, escalate">
```

---

## Filling instructions

- **Numbers must come from `findings.json`**, not from memory. The
  per-cycle counts at the top of the report should match the count of
  rows in `findings.json` filtered by cycle and severity.
- **Don't aspirationally claim coverage.** If only light mode was audited
  this cycle, only check `[x] Light mode`. The verdict in Phase 6 reads
  the union of all cycles' coverage and downgrades to `PASS (LIMITED
  COVERAGE)` if anything's missing.
- **Status at cycle exit** is `open` or `fixed`. Don't invent intermediate
  states like "in progress" — Phase 4 is non-deferrable, so cycle exit
  means "Phase 4 closed everything it could".
- **Subagent contribution log is team mode only.** Skip in solo runs.
- **Cycle verdict is decisional.** Choosing PROCEED TO PHASE 6 commits to
  the confirmation pass next; choosing PROCEED TO CYCLE N+1 means the
  loop continues. Don't write both.
