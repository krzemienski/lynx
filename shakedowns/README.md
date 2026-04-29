# lynx — Shakedown Corpus

Real-target validation runs that exercise the lynx skills against intentionally-defective synthetic apps. Each shakedown is the **system under test** — defects are documented as ground truth, then the audit runs and is graded against the inventory.

## Why shakedowns

Skill quality is empirical, not theoretical. A skill that *describes* what to look for in a checklist might still **miss** that defect when run against a real DOM. Shakedowns prove the checklist rows fire on production-shape code.

## Corpus

| Shakedown | Target | Defects | Audit outcome | Detection rate | Status |
|---|---|---|---|---|---|
| **WAM** (Whac-A-Mole) | `/tmp/whac-a-mole-app/` | 9 entangled defects (cycle-1 fix unmasks cycle-2 mole) | FAIL (CYCLE-CAP REACHED) — by design | 9/9 | shipped iter-16 |
| **synth-2** | [`./synth-2/`](./synth-2/) | 5 independent defects | PASS at cycle 2 | 5/5 | shipped 2026-04-29 |
| **Combined** | — | 14 distinct defect classes | — | **14/14 (100%)** | — |

WAM evidence lives outside this repo (in the original `iteration-16/` archive at `/Users/nick/Desktop/full-ui-experience-audit-iter-9/`); synth-2 is fully self-contained here.

## Defect-class coverage

Across both shakedowns, the corpus exercises:

- Modal failure modes — opacity ≈ 0 (WAM), trap with no close + no Esc (synth-2)
- Form/input semantics — disabled-but-clickable button (WAM), unlabeled inputs (synth-2)
- Color & contrast — design-token cascade (WAM), color-only error / APCA fail (synth-2)
- Affordance — whitespace-only label (WAM), false `cursor:pointer` no-handler (synth-2)
- Latent contracts — response-shape fetch mismatch (WAM)
- Visual rhythm — fixed-px font that breaks zoom (synth-2)
- Convergence behavior — cycle-cap reached (WAM), 2-cycle PASS (synth-2)

## What's still uncovered

Future shakedowns could close these gaps:

- **iOS HIG checklist** — needs a SwiftUI app + idb harness; no iOS shakedown exists yet
- **Shared-token cascade** (iter-17 reference edit) — neither WAM nor synth-2 fully exercise this
- **Public real target** — both shakedowns are local synthetics; a known-defective public site would prove the skills handle real-world load + arbitrary HTML

See [`synth-2/SUMMARY.md`](./synth-2/SUMMARY.md) § "Next-shakedown candidates" for proposals.

## Iron Rule

Across all shakedowns: **zero test files, zero mocks, zero stubs, zero fakes, zero fixtures**. Each shakedown's `SUMMARY.md` carries an Iron Rule check that re-verifies this claim with a `find` invocation.
