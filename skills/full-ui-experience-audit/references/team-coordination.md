# Team Coordination — Parallel Execution

**Read this only if the user chose team mode at run start AND subagents are
actually available in this environment.** Solo runs don't need any of this;
team-mode-without-subagents is invalid (the lead falls back to solo per
SKILL.md's mode-selection note).

In team mode, you are the **lead agent**. You don't do the per-screen work
yourself — you dispatch subagents, hold the resource mutexes, verify
evidence, and decide when each phase exits. Your job is coordination, not
execution.

## Subagent naming convention

Names appear in the manifest, the cycle report, and the lock ledger, so
they have to be predictable. Pattern: `<role>-<index>` where index is
1-based and assigned in dispatch order within a phase.

```
explorer            (Phase 1, exactly one)
ux-validator-1, ux-validator-2, ...        (Phase 2, one per screen group)
functional-validator                        (Phase 3 iOS, one — simulator-bound)
page-validator-1, page-validator-2, ...    (Phase 3 web, one per browser tab)
api-validator-1, api-validator-2, ...      (Phase 3 backend, parallel-safe)
integration-validator                       (Phase 3 full-stack cross-layer)
fixer-1, fixer-2, ...                       (Phase 4 disjoint-file fixers)
```

Indices reset per phase — Phase 2's `ux-validator-1` and Phase 3's
`api-validator-1` are unrelated agents.

## Team composition by platform

The platform you detected in Phase 0 determines the team shape.

### iOS / macOS team

| Role | Count | Resources held | Phase responsibility |
|------|-------|----------------|----------------------|
| **lead** | 1 | simulator mutex, code-edit mutex, evidence ledger, **`.pbxproj` mutex** | overall orchestration, fix application, gate verification |
| **explorer** | 1 | none (read-only) | Phase 1 inventory build |
| **ux-validator** | up to N (one per screen group) | shared simulator (serial capture, parallel analysis) | Phase 2 per-screen UX audit |
| **functional-validator** | 1 (simulator-bound) | simulator mutex (delegated by lead) | Phase 3 interaction validation |
| **api-validator** | up to N | none (curl-only) | Phase 3 backend endpoint validation in parallel |

**iOS gotcha — the `.pbxproj` collision risk**: even when two fixer
subagents edit completely disjoint Swift files, both edits often touch
the Xcode project file (`*.xcodeproj/project.pbxproj`) to register the
new file or change build phases. Concurrent `.pbxproj` edits produce
nonsensical merge conflicts that look like random binary noise. The lead
is the **only** agent allowed to edit `.pbxproj`; fixer subagents prepare
the source-file edits and hand them to the lead, who applies them and
updates the project file in a single serialized step.

### Web / full-stack team

| Role | Count | Resources held | Phase responsibility |
|------|-------|----------------|----------------------|
| **lead** | 1 | code-edit mutex, browser-tab ledger, evidence ledger | overall orchestration, fix application, gate verification |
| **explorer** | 1 | none (read-only) | Phase 1 inventory build |
| **ux-validator** | up to N | one browser tab each (separate `agent-browser` sessions) | Phase 2 per-screen UX audit |
| **page-validator** | up to N | one browser tab each | Phase 3 interaction validation |
| **api-validator** | up to N | none (curl-only) | Phase 3 backend endpoint validation in parallel |
| **integration-validator** | 1 | one browser tab + curl | Phase 3 cross-layer checks (UI action → backend state) |

### Cross-platform mobile

Use both teams' patterns. Run iOS + web targets in separate sub-teams with no
shared resources. Don't try to share the simulator between an iOS and a web
target — they don't overlap, and the coordination overhead isn't worth it.

## Subagent prompt templates

Each subagent gets a focused, single-purpose prompt. The lead never delegates
"audit the app" — that's the lead's whole job. Delegate per-screen, per-
interaction, or per-endpoint work only.

### Explorer (Phase 1)

```
You are the explorer subagent for a full-ui-experience-audit run.
Your job is to produce the cycle inventory — nothing else.

INPUT:
- Repomix XML at: <path>
- Cycle directory: audit-evidence/cycle-NN/
- Previous cycle inventory (if any): <path or "none">

OUTPUT:
- Write audit-evidence/cycle-NN/inventory.md following the format in
  full-ui-experience-audit/references/inventory-template.md
- Each row: id | screen | interaction | trigger | backend_dep | priority

DO NOT:
- Audit any screen yourself
- Tap, click, or navigate anything
- Edit any code
- Make completion claims about UX or functional correctness

When done, return the inventory path. The lead will verify it.
```

### UX-validator (Phase 2)

```
You are a ux-validator subagent for full-ui-experience-audit cycle <N>.
Your job is to run ui-experience-audit on these specific screens, using
drive-interaction mode if a live system is reachable.

ASSIGNED SCREENS: <list of screen IDs from inventory>
LIVE SYSTEM:
  - Web: agent-browser tab @<id> (already open at <url>) — yours exclusively
  - iOS: simulator capture window — request from lead via ledger before each
    screenshot, release immediately after
EVIDENCE DIRECTORY: audit-evidence/cycle-NN/ux-reports/

For each assigned screen:
1. Capture evidence per platform (agent-browser screenshot, or xcrun simctl
   io screenshot via the lead-coordinated capture window)
2. Invoke ui-experience-audit (run all 5 phases — triage, visual,
   interactive, content, heuristics)
3. Save the per-screen report as <screen-slug>.md
4. Append findings to ../findings.json with phase: "ux"

DO NOT:
- Edit code
- Trigger destructive interactions (delete, send, purchase)
- Audit screens not in your assigned list
- Cross over into other tabs

Return when all assigned screens are done.
```

### Functional-validator / page-validator (Phase 3)

```
You are a functional-validator subagent for full-ui-experience-audit cycle <N>.
Your job is to validate that specific interactions actually work, using
functional-validation's Iron Rule (no mocks, real system, capture evidence).

ASSIGNED INTERACTIONS: <list of interaction IDs from inventory>
LIVE SYSTEM:
  - Web: agent-browser tab @<id> (yours exclusively)
  - iOS: request simulator from lead before each interaction, release after

For each interaction:
1. Navigate to the screen via the trigger path in the inventory
2. Wait for data load (3s minimum, more if heavy)
3. Capture pre-interaction evidence (screenshot)
4. Trigger the interaction
5. Capture post-interaction evidence (screenshot + curl on backend dep, if any)
6. Verify post-state matches what the inventory's "expected_result" says
7. Write PASS or FAIL with cited evidence to
   audit-evidence/cycle-NN/functional-evidence/<interaction-id>.md

DO NOT:
- Trigger interactions outside your assigned list
- Trigger destructive actions without explicit user approval (escalate to lead)
- Edit code
- "Log and continue" on a FAIL — record it and move on; the lead applies fixes

Return when all assigned interactions are done.
```

### API-validator (Phase 3, backend endpoints)

```
You are an api-validator subagent. Your job is read-only curl checks against
backend endpoints.

ASSIGNED ENDPOINTS: <list>
BASE URL: <url>

For each endpoint:
1. Construct an appropriate curl command (use sample data from the inventory)
2. Capture the response body, status code, and timing
3. Verify response matches the expected schema
4. Save to audit-evidence/cycle-NN/functional-evidence/api-<endpoint>.json
5. Record PASS / FAIL in findings.json

DO NOT:
- Hit endpoints outside your list
- Hit write/delete endpoints unless the inventory marks them safe
- Try to fix anything yourself
```

## Resource mutex enforcement

The lead is the source of truth for who holds what. Enforce via a simple
ledger file at `audit-evidence/locks.json`:

```json
{
  "simulator": { "holder": "functional-validator-3", "since": "2025-04-28T14:32:11Z" },
  "browser_tab_1": { "holder": "ux-validator-1", "since": "2025-04-28T14:30:02Z" },
  "browser_tab_2": { "holder": "page-validator-2", "since": "2025-04-28T14:31:45Z" },
  "code_edit:src/auth.ts": { "holder": "lead", "since": "2025-04-28T14:35:00Z" }
}
```

Subagents request a lock before claiming a resource; the lead grants or
queues. If a subagent reports done, release the lock immediately. Locks held
> 5 minutes without progress are stale — investigate.

## Common parallelization patterns

### Pattern A: Phase 2 fan-out (UX audits)

```
Lead:
  - Partition screens into N groups (N = subagent count, typically 3-5)
  - Spawn N ux-validator subagents in the same turn
  - Wait for all to return
  - Read every per-screen report personally
  - Aggregate findings.json
```

This works well because UX audit analysis is mostly read-only. The capture
step serializes on the simulator/browser, but the analysis after capture
parallelizes cleanly.

### Pattern B: Phase 3 split (functional vs api)

```
Lead:
  - Spawn 1 functional-validator (simulator-bound, serial through interactions)
  - Spawn N api-validators in parallel (curl-only, fully independent)
  - The api-validators usually finish far ahead of the functional-validator
  - Lead can start triaging api findings into Phase 4 fixes while
    functional-validation continues
```

### Pattern C: Phase 4 fan-out for disjoint fixes

```
Lead:
  - Group findings by file / module
  - For findings in disjoint modules, spawn fixer subagents in parallel
  - For findings in the same file, serialize
  - After each fix subagent returns, lead applies the patch and re-runs
    the specific Phase 3 step that failed
```

**Be conservative with Phase 4 parallelism.** A fix that touches shared
infrastructure (auth, theming, routing) is rarely actually disjoint from
other "unrelated" fixes. When unsure, serialize.

## Evidence ledger discipline

The lead maintains `audit-evidence/manifest.json` — every artifact every
subagent produces is logged here with its path and a one-line description.
This is your audit trail.

```json
{
  "cycle": 2,
  "started_at": "...",
  "artifacts": [
    {
      "agent": "ux-validator-1",
      "phase": "ux",
      "screen": "settings",
      "path": "cycle-02/ux-reports/settings.md",
      "findings": 3
    },
    {
      "agent": "functional-validator",
      "phase": "functional",
      "interaction": "settings.save",
      "path": "cycle-02/functional-evidence/settings-save.md",
      "verdict": "FAIL",
      "evidence_screenshot": "cycle-02/functional-evidence/settings-save-post.png"
    }
  ]
}
```

Without this, parallel runs become indistinguishable from chaos. With it,
you can replay any cycle's history.

## Lead-only checks (the things subagents can't do)

- **Reading evidence content**: subagents capture; the lead reads. Per
  `gate-validation-discipline`, file existence is not evidence.
- **Severity classification on contested findings**: subagents propose,
  lead decides. Two subagents reporting different severity for the same
  finding always escalates to the lead.
- **Cycle-exit decision (Phase 5)**: only the lead has the full
  findings.json. Subagents see slices.
- **Fix application**: subagents may diagnose and propose patches, but
  applying them is lead-only — this is the code-edit mutex in practice.
- **Final verdict (Phase 6)**: only the lead writes VERDICT.md.
- **Destructive-interaction escalation**: subagents flag; lead asks user.

## Destructive-interaction escalation language

When a subagent reports a destructive interaction (delete, send, post,
purchase, irreversible state change) it cannot drive without user
approval, the lead asks the user in chat. Use this template — concise
enough not to interrupt flow, specific enough to make the consequence
clear:

```
Phase 3 reached an interaction marked DESTRUCTIVE in the inventory:

  Interaction:  I005 — "Confirm delete account"
  Screen:       Settings → Account → Delete dialog
  Effect:       DELETE /api/user — irreversible; account and all linked
                sessions/data are removed
  Backend dep:  DELETE /api/user (per inventory)

Drive it? (yes / no / use a test account)
- yes:           proceed; treat as a real delete
- no:            skip and mark verification needed (manual)
- test account:  swap to a test account first (give me the credentials)
```

If the user picks "test account" they should provide credentials in chat;
don't hardcode test credentials into the inventory or run-config. The
lead handles credential input and immediately scrubs them from any saved
artifact.

## Stuck-state detection

If a cycle's open findings match the previous cycle's open findings exactly
(same IDs), that's a stuck state. Don't loop blindly. Stop and report:

```
STUCK STATE DETECTED at cycle <N>.

Open findings unchanged from cycle <N-1>:
- <id>: <title> (severity: <S>)
- <id>: <title> (severity: <S>)

Possible causes:
1. The fix is harder than expected (root cause is upstream)
2. The threshold is wrong (these findings are below what the user cares about)
3. There's a third-party / infrastructure dependency outside our control

Escalating to user. Recommend: <option>.
```

Three options for the user: relax threshold (one-time), continue trying,
or escalate to a human owner of the stuck area.

## When team mode is the wrong choice mid-run

If you started in team mode and find yourself constantly arbitrating mutex
contention with no actual parallel work happening, you're paying coordination
cost without speedup. Symptoms:
- Most subagents waiting on simulator/browser lock
- Lead spending more time in ledger updates than in fix application
- Wall-clock per cycle longer than your earlier solo estimates

It's fine to convert to solo mid-run. Tell the user, finish the current cycle's
remaining work yourself, and proceed solo from the next cycle. No shame in it.
