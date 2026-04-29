# Fix Loop Protocol — Phase 4 Remediation

This is the algorithmic core of the audit loop. Every finding from Phase 2
(UX) and Phase 3 (functional) flows through this protocol before the cycle
can exit. **No deferral.** If a finding survives Phase 4 within a cycle, the
cycle is incomplete and the loop can't advance.

## Priority order (work the highest first)

```
1. CRASH       — app crashes, infinite loop, white screen, hung process
2. BACKEND     — endpoint returns 500, schema mismatch, auth broken
3. NAVIGATION  — deep link broken, route 404s, cannot reach a screen
4. DATA        — UI shows wrong values, stale state, missing items
5. VISUAL      — overlapping text, broken layout, contrast fail, dark mode bug
6. UX          — heuristic violations, weak signifiers, false affordances
```

A higher-priority class blocks lower-priority work in the same area —
fixing a visual issue on a screen that crashes is wasted effort.

## The algorithm (per finding)

```
DIAGNOSE → MOCK CHECK → FIX → BUILD → RE-VALIDATE → GATE → COMMIT → NOTIFY
```

### 1. DIAGNOSE — find the actual root cause

For each finding, before changing any code:

- Re-read the evidence (screenshot, logs, curl response, error trace)
- Open the source for the implicated screen / endpoint
- Trace the code path from trigger → render / response
- Identify the exact line(s) where reality diverges from expected

Common diagnostic shortcuts:

| Symptom | First place to look |
|---------|---------------------|
| Screen renders empty list | API client response handling, JSON key mismatch |
| API 500 | Server logs for the exact request, then handler code |
| Deep link 404 | URL scheme registration, route handler registration, parameter parsing |
| Wrong screen renders | Navigation graph, route guards, default redirects |
| Crash on tap | Force-unwrap, missing nil-guard, async lifecycle race |
| Dark mode visual bug | Hardcoded colors instead of semantic tokens |
| Hover-only affordance fails on touch | Missing `:focus` / `aria-` equivalent of hover state |
| Form submit does nothing | Event handler not wired, prevented default, validation silently failing |

### 2. MOCK CHECK — invoke `no-mocking-validation-gates` if tempted

Watch for these thoughts. If any appear, STOP and read
`no-mocking-validation-gates`:

- "Let me add a mock fallback so the audit can pass"
- "I'll stub this endpoint while the real one is being fixed"
- "The real backend is too slow / flaky for the loop, let me fake it"
- "I'll add a test mode flag so this case behaves predictably"
- "Just for this audit run, let me hardcode the response"

Every one of these turns the audit from "did the system work" into "did
our mock work" — which is worthless. Real system, every time. If the real
system is broken, the audit's job is to expose that, not to plaster over it.

### 3. FIX — minimal correct change

Apply the smallest change that addresses the root cause:

- Don't rewrite the file
- Don't refactor adjacent code "while you're in there"
- Don't bundle multiple fixes into one diff
- Do add a comment if the fix is non-obvious (`// fix: race in ...` is fine)

If the fix requires touching shared infrastructure (auth, theming, routing,
DB schema), pause and check with the lead / user. Shared-infra fixes
invalidate other agents' in-flight work.

### 4. BUILD — confirm it compiles

| Platform | Command | What "PASS" looks like |
|----------|---------|------------------------|
| iOS | `xcodebuild ... build` | exit 0, no errors, no new warnings introduced |
| Web (TS) | `tsc --noEmit && <bundler> build` | exit 0, no type errors, no build warnings |
| Web (other) | `<bundler> build` | exit 0, no warnings |
| Backend | language-specific compile / lint | exit 0 |

A build that "passes with warnings" is suspect — read the warnings. Many
real bugs surface as warnings before they surface as failures.

**If the build fails**: don't move on. Loop back to step 1 (DIAGNOSE)
with the build error as the new symptom. Common patterns:

- Type error introduced by the fix → re-examine the type signatures the
  fix touched; the diff has a hole
- Missing import after a refactor → add the import; common after moving
  code between files
- Unrelated upstream breakage in `main` → investigate; the audit didn't
  cause it but you can't proceed past it. May need to revert your fix and
  fix the upstream issue first
- Project file collision in iOS team mode (`.pbxproj` conflict) → only
  one agent at a time edits Xcode project structure (see
  `references/team-coordination.md` and `references/ios-protocol.md`)

If a fix triggers ≥3 build-failure iterations without resolving, that's a
signal the fix is wrong — revert and re-diagnose from scratch rather
than patching the patch.

### 5. RE-VALIDATE — run only the failing step, not the whole cycle

The whole point of cycle re-runs is Phase 5; here you just confirm THIS
finding is gone. Re-run the specific Phase 2 capture or Phase 3 interaction
that produced the finding. Compare the new evidence against the old. If
the symptom is gone, proceed; if not, loop back to DIAGNOSE.

### 6. GATE — invoke `gate-validation-discipline`

Cite specific evidence:

- "Pre-fix screenshot at <path> showed <symptom>. Post-fix screenshot at
  <path> shows <expected state>. Symptom resolved."
- "Pre-fix curl response was `{...}` (status 500). Post-fix response is
  `{...}` (status 200, expected schema). Symptom resolved."

If you can't write that sentence with real paths and real content, the fix
isn't actually verified. Don't proceed.

### 7. COMMIT — one fix, one commit

```
fix(<surface>): <one-line description of what was broken and how>

Refs: cycle-NN/findings.json#<id>
Evidence:
  - cycle-NN/functional-evidence/<id>-pre.png
  - cycle-NN/functional-evidence/<id>-post-fix.png
```

One fix per commit lets the cycle history line up cleanly with the
remediation log, and makes bisecting trivial if a later cycle introduces
a regression.

### 8. NOTIFY — broadcast in team mode

In team mode, after a fix lands, announce it:

```
FIX LANDED — cycle-NN
Finding: <id>
Files changed: <list>
Affected surfaces (potentially): <list of screens / endpoints>
```

Other agents whose work touches those surfaces should re-run their relevant
captures. A subagent that already finished its assigned screens but discovers
overlap with this fix should add a note to the manifest and re-validate.

## Stuck-state detection

After Phase 4 completes for a cycle, before declaring the cycle done,
compare findings to the previous cycle:

| Comparison | Meaning | Action |
|------------|---------|--------|
| Findings entered ≥ previous cycle | Regression introduced by previous fixes | Diagnose what changed; possibly revert |
| Same exact finding IDs as previous cycle | Stuck — no progress | Escalate to user (see SKILL.md Phase 5) |
| Findings entered drops, but same handful keeps re-appearing | Flapping — environment instability | Investigate test environment, not the code |
| Findings entered drops monotonically | Healthy convergence | Continue |

Two consecutive cycles of "stuck" or "flapping" → stop the loop and
report. Don't burn context grinding on a stuck state.

## Regression handling

If a fix in cycle N introduces a new finding in cycle N+1, that's a
regression. Two patterns:

**Pattern A: same surface, different finding**
The fix didn't fully address the underlying problem. Re-diagnose with the
new evidence; the previous fix may need to be expanded or replaced.

**Pattern B: different surface, related code**
The fix had a wider blast radius than expected. Look at what the fix
changed, find every consumer, check each. This is why Phase 4 commits stay
small — bisecting a multi-fix commit is painful.

## Escape hatches (when the loop should stop without converging)

Not every finding can be fixed inside an audit run. Recognize these
explicitly so the loop doesn't grind forever:

| Situation | Why fixing here is wrong | Action |
|-----------|--------------------------|--------|
| Finding is in a third-party library | Not our code; pinning a fix here ships a fork | Document; route to library upstream; mark below threshold for this run |
| Finding requires a design decision | Engineering can't pick "should this button say Save or Submit"; that's a product call | Escalate to user; pause finding until decision lands |
| Finding requires data migration | Schema changes touch production data; not safe inside an audit run | Document; route to schema migration workflow |
| Finding is a duplicate of a tracked issue | Already being worked on elsewhere | Mark as duplicate, link the tracking issue, exclude from cycle counts |
| Finding turns out to be intended behaviour | The audit assumption was wrong | Update the inventory's "expected_result"; remove from findings |

Every escape hatch use must be logged in the cycle's findings.json with
`status: "escape-hatch"` and the reason. The verdict in Phase 6 lists
these explicitly so the user can see what wasn't fixed and why.

### Threshold-relaxation requests at escalation

When you escalate a stuck state to the user, one of the user's options
is "relax threshold." This is the **only** way the threshold changes
during a run — Claude does not relax silently because "we're close." If
the user does relax it:

1. Update `audit-evidence/run-config.md` with the new threshold and a
   timestamp + reason
2. Continue the loop with the new threshold from the next cycle
3. Phase 6's `VERDICT.md` lists "Threshold relaxations during run" so
   the user (and any reviewer) can see the bar moved

The verdict still reads PASS if the relaxed threshold is met — but the
relaxation is visible. No silent grade inflation.

## What "done" looks like for a finding

A finding moves from open → closed only when ALL of these are true:

- [ ] Root cause identified (not just "a fix that makes the symptom go away")
- [ ] Fix applied as one focused diff
- [ ] Build passes cleanly
- [ ] The original symptom is gone in fresh evidence
- [ ] No new symptoms in adjacent surfaces (spot-check 2-3 nearby
  screens / endpoints)
- [ ] `gate-validation-discipline` invoked, specific evidence cited
- [ ] Committed with link back to the finding ID
- [ ] (Team mode) Broadcasted to other agents

If even one of these is missing, the finding is still open. Don't trust
"close enough" — the convergence loop relies on this contract holding.
