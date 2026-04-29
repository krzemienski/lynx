# synth-2 — Shakedown Findings (HIT / MISS / FALSE-POSITIVE)

**Run:** 2026-04-29 against synth-2 baseline at `http://localhost:8002/index.html`
**Skills exercised:** `full-ui-experience-audit` + `ui-experience-audit`
**Ground truth:** [`DEFECT-INVENTORY.md`](./DEFECT-INVENTORY.md) (5 known defects)

## Per-defect classification

For each ground-truth defect: did the skill flag it (HIT), miss it (MISS), or did the skill flag a non-mole (FALSE-POSITIVE)?

### `full-ui-experience-audit`

| Defect | Severity | Detection | Cycle | Citation |
|---|---|---|---|---|
| **D1** modal trap | HIGH | **HIT** | C1 | [`audit-evidence/full/cycle-1/findings.md`](./audit-evidence/full/cycle-1/findings.md) row C1-D1 |
| **D2** unlabeled inputs | HIGH | **HIT** | C1 | [`audit-evidence/full/cycle-1/findings.md`](./audit-evidence/full/cycle-1/findings.md) row C1-D2 |
| **D3** color-only error / APCA fail | HIGH | **HIT** | C1 | [`audit-evidence/full/cycle-1/findings.md`](./audit-evidence/full/cycle-1/findings.md) row C1-D3 |
| **D4** fixed-px caption | MEDIUM | **HIT** | C1 (sub-threshold) | [`audit-evidence/full/cycle-1/findings.md`](./audit-evidence/full/cycle-1/findings.md) row C1-D4 |
| **D5** false affordance (cursor:pointer no-handler) | HIGH | **HIT** | C1 | [`audit-evidence/full/cycle-1/findings.md`](./audit-evidence/full/cycle-1/findings.md) row C1-D5 |

**`full-ui-experience-audit` totals: 5/5 HIT, 0 MISS, 0 FALSE-POSITIVE**

### `ui-experience-audit`

| Defect | Detection phase | Citation |
|---|---|---|
| **D1** modal trap | Phase 3 (Interactive elements) | [`audit-evidence/per-screen/index/audit-report.md`](./audit-evidence/per-screen/index/audit-report.md) Phase 3 row "Modal dismissable" + H3 violation |
| **D2** unlabeled inputs | Phase 4 (Content quality) + H6 (Recognition vs recall) | [`audit-evidence/per-screen/index/audit-report.md`](./audit-evidence/per-screen/index/audit-report.md) Phase 4 row "Form label association" |
| **D3** color-only error / APCA fail | Phase 2 (Visual experience) + H9 (Help recognize errors) | [`audit-evidence/per-screen/index/audit-report.md`](./audit-evidence/per-screen/index/audit-report.md) Phase 2 row "`.error-msg` contrast" |
| **D4** fixed-px caption | Phase 2 (Visual experience) | [`audit-evidence/per-screen/index/audit-report.md`](./audit-evidence/per-screen/index/audit-report.md) Phase 2 row "`.caption` font-size" |
| **D5** false affordance | Phase 3 (Interactive elements) + H4 (Consistency & standards) | [`audit-evidence/per-screen/index/audit-report.md`](./audit-evidence/per-screen/index/audit-report.md) Phase 3 row "cursor:pointer no-handler" |

**`ui-experience-audit` totals: 5/5 HIT, 0 MISS, 0 FALSE-POSITIVE**

## Combined detection rate

| Skill | HIT | MISS | FALSE-POSITIVE | Detection rate |
|---|---|---|---|---|
| `full-ui-experience-audit` | 5 | 0 | 0 | 5/5 = 100% |
| `ui-experience-audit` | 5 | 0 | 0 | 5/5 = 100% |
| **Combined corpus across WAM + synth-2** | 14 | 0 | 0 | **14/14 = 100%** |

(Whac-A-Mole was 9/9; synth-2 adds 5 distinct defect classes; total 14/14.)

## Iter-17 reference edits — validation outcome

Three iter-17 edits were tested by synth-2 because synth-2 was constructed to exercise exactly those code paths:

| Iter-17 edit | Tested by | Outcome |
|---|---|---|
| `web-wcag-checklist.md` APCA Lc ≥ 60 worked example | D3 | **CONFIRMED** — caught APCA Lc ≈ 50–55 case with cited contrast pair |
| `interactive-element-audit.md` cursor:pointer no-handler concrete probe | D5 | **CONFIRMED** — flagged span with `cursor: pointer`, no `onclick`, no `href`, no `role` |
| `defect-pattern-database.md` shared-token cascade row | (not exercised — synth-2 has no shared design-token cascade) | unexercised; iter-16 already exercised this against WAM |

Two iter-17 edits land cleanly. The third was already validated by iter-16 WAM run.

## Iron Rule (synth-2 scope)

`find /Users/nick/Desktop/lynx/shakedowns/synth-2 -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" -o -name "Tests.swift" -o -iname "*mock*" -o -iname "*stub*" -o -iname "*fake*" -o -iname "*fixture*" \)` → 0 matches.

The synthetic IS the system under test. The audit is the validation. There are no test doubles in this tree.
