# synth-2 — Shakedown SUMMARY

**Status:** SHIP
**Date:** 2026-04-29
**Skills validated:** `full-ui-experience-audit` + `ui-experience-audit`
**Detection rate:** 5/5 (100%) across both skills

## What this shakedown proved

Both skills detect 5 defect classes that **were not exercised by Whac-A-Mole**:

1. Modal trap (Esc + close-button absent) — distinct from WAM's modal-opacity defect
2. Form inputs without `<label>` — distinct from WAM's disabled-but-clickable button
3. Color-only error / APCA Lc fail — directly exercises the iter-17 APCA worked example
4. Fixed `font-size: 11px` caption — exercises the visual-experience-audit fixed-px row never tested by WAM
5. `cursor:pointer` no-handler false affordance — directly exercises the iter-17 concrete cursor probe

Combined with WAM's 9/9, the corpus is now **14/14 = 100%** detection.

## What this shakedown did NOT prove

- **Multi-screen discovery** — synth-2 is single-screen. WAM tested 3-screen discovery + index.
- **Entangled fixes (cycle-cap reach)** — synth-2's defects are independent; audit converges at cycle 2. WAM's were entangled, reaching cycle cap. Both modes are now validated.
- **iOS HIG checklist** — synth-2 is web-only. iOS protocol remains validated only via skill-internal review (no iOS shakedown app exists).
- **Response-shape contract validation** (iter-17 web-protocol section) — synth-2 has no API. WAM's 2A defect was the live exercise.
- **Shared-token cascade** — neither WAM nor synth-2 exercise this; iter-17 reference edit unvalidated against a real target. Future shakedown opportunity.

## Files

- [`DEFECT-INVENTORY.md`](./DEFECT-INVENTORY.md) — 5 ground-truth defects + design rationale
- [`app/index.html`](./app/index.html) — cycle-1 baseline (5 defects intact)
- [`app/index-after-fixes.html`](./app/index-after-fixes.html) — cycle-2 input (D1, D2, D3, D5 fixed; D4 left)
- [`audit-evidence/probes/baseline.png`](./audit-evidence/probes/baseline.png) — pre-fix screenshot
- [`audit-evidence/probes/after-fixes.png`](./audit-evidence/probes/after-fixes.png) — post-fix screenshot
- [`audit-evidence/probes/probe-evidence.md`](./audit-evidence/probes/probe-evidence.md) — DOM probe JSON + APCA calc
- [`audit-evidence/full/run-config.md`](./audit-evidence/full/run-config.md) — full audit config
- [`audit-evidence/full/cycle-1/findings.md`](./audit-evidence/full/cycle-1/findings.md) — 5 defects flagged
- [`audit-evidence/full/cycle-2/findings.md`](./audit-evidence/full/cycle-2/findings.md) — 0 critical-high, PASS
- [`audit-evidence/full/VERDICT.md`](./audit-evidence/full/VERDICT.md) — full verdict
- [`audit-evidence/per-screen/index/audit-report.md`](./audit-evidence/per-screen/index/audit-report.md) — 5-phase per-screen
- [`findings.md`](./findings.md) — HIT/MISS/FP table
- [`s3-grade.md`](./s3-grade.md) — 8-assertion grep grade (8/8 PASS)

## Iron Rule

Zero test files, mocks, stubs, fakes, or fixtures across the full synth-2 tree. The synthetic IS the system under test. The audit is the validation. Verdicts cite specific evidence paths.

## Next-shakedown candidates

To widen the corpus toward 20+ distinct defect classes:

- **Shakedown 3 — multi-screen + iOS** — small SwiftUI app or static iOS HIG-violating mock with idb-driven validation
- **Shakedown 4 — shared-token cascade** — design-system-driven app where one token change cascades regressions
- **Shakedown 5 — public real target** — a known-defective public site (e.g. an old docs portal); zero-trust real audit
