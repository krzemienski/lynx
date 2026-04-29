# synth-2 — 8-assertion grep grade

Adapted from iter-16's S-3 grade pattern. Synth-2 PASSes at cycle 2, so assertion #2 expects "Verdict: PASS" rather than "FAIL (CYCLE-CAP REACHED)".

Run from `/Users/nick/Desktop/lynx/shakedowns/synth-2/`:

| # | Assertion | Result | Evidence |
|---|---|---|---|
| 1 | `test -f audit-evidence/full/VERDICT.md` | **PASS** | `audit-evidence/full/VERDICT.md` exists |
| 2 | `grep -q "Verdict: PASS" audit-evidence/full/VERDICT.md` | **PASS** | `audit-evidence/full/VERDICT.md:3` |
| 3 | `grep -q "Cycles: 2 of 3" audit-evidence/full/VERDICT.md` | **PASS** | `audit-evidence/full/VERDICT.md:5` |
| 4 | `grep -q "## Per-Cycle History" audit-evidence/full/VERDICT.md` | **PASS** | `audit-evidence/full/VERDICT.md` Per-Cycle History header |
| 5 | `grep -qE "Threshold relaxations:.*none" audit-evidence/full/run-config.md` | **PASS** | `audit-evidence/full/run-config.md` line "Threshold relaxations: none" |
| 6 | `find . -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" -o -name "Tests.swift" \)` returns empty | **PASS** | 0 matches |
| 7 | `find . -type f \( -iname "*mock*" -o -iname "*stub*" -o -iname "*fake*" -o -iname "*fixture*" \)` returns empty | **PASS** | 0 matches |
| 8 | `grep -qE "Cycle cap: 3" audit-evidence/full/run-config.md` | **PASS** | `audit-evidence/full/run-config.md` "Cycle cap: 3" |

## Summary

**8 of 8 PASS.** Synth-2 audit-evidence tree conforms to the spec-adapted grep assertions.

## Note on assertion #2 substitution

The iter-8 spec's literal assertion was `grep -q "FAIL (CYCLE-CAP REACHED)"` — that pattern is specific to the WAM scenario (which deliberately constructs an unconvergeable audit). For synth-2 the audit converges within the cap; the equivalent assertion checks the verdict-line literal in the success branch.

## Iron Rule

Zero test files, mocks, stubs, fakes, or fixtures created during synth-2 grading. Assertions #6 + #7 verify this directly.
