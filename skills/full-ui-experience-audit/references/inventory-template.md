# Inventory Template — Phase 1 Output Format

The inventory is the single source of truth for what later phases will
audit and validate. Every screen, every interaction, every endpoint goes
in. If it's not in the inventory, it doesn't get audited — which means
gaps in the inventory become gaps in the verdict.

## File location

`audit-evidence/cycle-NN/inventory.md`

On cycles 2+, copy the previous cycle's inventory and update in place;
don't rebuild from scratch. Mark added rows with `+`, removed rows with
`-`, changed rows with `~`. The diff between cycles becomes a useful
artifact for the verdict.

**Finding/interaction ID stability**: once an ID is assigned (`I001`,
`E03`, `S05`), it never changes. Cycle 5 may add `I042`; `I001`–`I041`
keep their numbers across all cycles. Removed rows keep their ID in the
diff section; the ID is retired, not reassigned. This is what makes
stuck-state detection work — the lead compares finding ID sets across
cycles.

## Top-of-file metadata

```markdown
# Inventory — cycle <N>
Project: <name>
Platform: ios | web | fullstack | cross-platform
Generated: <ISO timestamp>
Source: repomix XML at <path>
Previous cycle: cycle-<N-1> (added: <count>, removed: <count>, changed: <count>)
```

## Section 1 — Screens / views

```markdown
## Screens

| ID | Name | Source file | Trigger path | Priority | Notes |
|----|------|-------------|--------------|----------|-------|
| S01 | Home | src/screens/Home.tsx | / | P0 | landing |
| S02 | Settings | src/screens/Settings.tsx | sidebar → Settings | P0 | |
| S03 | Account profile | src/screens/Account/Profile.tsx | Settings → Account → Profile | P1 | |
| S04 | Empty inbox state | src/screens/Inbox.tsx (state=empty) | Inbox tab, no items | P1 | edge state |
| S05 | Inbox error state | src/screens/Inbox.tsx (state=error) | Inbox tab, API error | P2 | edge state |
```

**Priority guidance:**

| Priority | Meaning | Audit cadence |
|----------|---------|---------------|
| P0 | Core flow — every user hits this | Every cycle |
| P1 | Secondary — most users hit this | Every cycle |
| P2 | Edge case / rare state | Every cycle if budget allows; final cycle minimum |

Don't downgrade P0 to "save cycle time". The whole reason to enter the
loop is that we're certifying the app — P0 surfaces are exactly the ones
that have to converge.

## Section 2 — In-screen interactions

```markdown
## Interactions

| ID | Screen | Element | Trigger | Expected result | Backend dep | States to capture | Destructive? | Priority |
|----|--------|---------|---------|-----------------|-------------|-------------------|--------------|----------|
| I001 | S01 | Sign in button | tap | navigate to /signin | none | default, hover, focus, active, disabled | no | P0 |
| I002 | S01 | Hero CTA "Get started" | tap | open onboarding sheet | none | default, hover, focus | no | P0 |
| I003 | S02 | Save profile button | tap | PATCH /api/user, success toast | PATCH /api/user | default, hover, focus, active, disabled, loading, success, error | no | P0 |
| I004 | S02 | Delete account button | tap | confirmation dialog | none | default, hover, focus, disabled | YES | P1 |
| I005 | S02 (delete dialog) | Confirm delete | tap | DELETE /api/user, navigate to / | DELETE /api/user | default, focus, loading, error | YES | P1 |
| I006 | S03 | Avatar upload field | drag-drop | preview shown, POST /api/avatar | POST /api/avatar | default, hover, focus, drag-active, loading, success, error | no | P1 |
```

**Required columns:**

- **ID** — unique, stable across cycles. Use a prefix (`I` for interaction)
  and zero-padded counter. New interactions in later cycles get the next
  available number — don't renumber.
- **Screen** — references a row from the Screens section
- **Element** — short human-readable name (`Save profile button`, not
  `<Button id="save-btn">`)
- **Trigger** — `tap`, `click`, `swipe-left`, `long-press`, `keyboard:cmd-s`,
  `drag-drop`, `hover`, etc.
- **Expected result** — the observable outcome. Specific. Not "form is
  submitted" — `PATCH /api/user, success toast appears, profile data
  refreshes`.
- **Backend dep** — the specific endpoint(s) called. Use the format
  `<METHOD> <path>` (e.g., `GET /api/sessions/:id`). `none` if pure
  client-side.
- **States to capture** — the visual states Phase 2 will exercise per
  `references/visual-experience-audit.md`. Defaults to the canonical
  set per element type — see below; trim only if a state genuinely
  doesn't apply (e.g., a static text link has no `disabled`). Adding
  this column to the inventory turns Phase 2 from "capture a screenshot"
  into a checklist with an explicit per-element coverage target.
- **Destructive?** — `YES` if it deletes data, charges money, sends
  external messages, or otherwise can't be undone. Phase 3 escalates these
  to the user before driving them.
- **Priority** — same scale as screens

### Default state sets by element type

Use these as the starting `States to capture` values; remove only what
genuinely doesn't apply:

| Element type | States |
|--------------|--------|
| Button — async (calls API) | default, hover, focus, active, disabled, loading, success, error |
| Button — sync (client-only) | default, hover, focus, active, disabled |
| Text link / nav link | default, hover, focus, visited |
| Form input (text, email, etc.) | default, focus, filled, invalid, disabled, readonly |
| Checkbox / radio | default, hover, focus, checked, disabled |
| Toggle / switch | default, hover, focus, on, off, disabled |
| Dropdown / select | default, hover, focus, open, selected, disabled |
| Card-as-tap-target | default, hover, focus, active |
| Drag handle / drop zone | default, hover, focus, drag-active, drop-valid, drop-invalid |
| Slider | default, hover, focus, dragging, disabled |
| Tab | default, hover, focus, active (selected) |

A button with only `default` captured is a button whose hover, focus,
active, and disabled states could all be broken — and you wouldn't know.

## Section 3 — Backend endpoints (full-stack and API-only)

```markdown
## Backend endpoints

| ID | Method | Path | Handler | Called by (frontend) | Auth | Priority |
|----|--------|------|---------|----------------------|------|----------|
| E01 | GET | /api/user | handlers/user.ts:getUser | I003, S02 | bearer | P0 |
| E02 | PATCH | /api/user | handlers/user.ts:updateUser | I003 | bearer | P0 |
| E03 | DELETE | /api/user | handlers/user.ts:deleteUser | I005 | bearer | P1 |
| E04 | GET | /api/sessions | handlers/sessions.ts:list | S01, multiple | bearer | P0 |
| E05 | POST | /api/avatar | handlers/avatar.ts:upload | I006 | bearer | P1 |
```

**Cross-reference rule:** every endpoint registered in the backend must
appear here, AND every endpoint called from the frontend must appear here.
Mismatches go straight into Phase 4 as HIGH findings:

- Frontend calls an endpoint that the backend doesn't register → 404 finding
- Backend registers an endpoint that no frontend calls → dead code or
  missing client integration
- Method mismatch (frontend POSTs where backend expects PUT) → endpoint
  contract bug

## Section 4 — Coverage axes

Declare what coverage axes the cycle will produce evidence for:

```markdown
## Coverage axes (cycle <N>)

- [x] Light mode (desktop)
- [x] Dark mode (desktop)
- [x] Mobile viewport (375×812)
- [ ] Tablet viewport (768×1024) — deferred to cycle 2
- [x] Empty state per screen (where applicable)
- [x] Error state per screen (where applicable)
- [x] Overflow / long-content state (where applicable)
- [x] First-launch state (re-tested in Phase 6 confirmation pass)
```

A cycle that only checked `[x]` Light mode + desktop can at best produce
`PASS (LIMITED COVERAGE)` in the verdict. The user knew this when they
chose the threshold; the verdict has to honor it.

## Section 5 — Inventory diff (cycles 2+)

```markdown
## Diff vs cycle <N-1>

### Added
+ I007 | S03 | "Reset password" link | tap | navigate to /reset | GET /api/auth/reset | no | P1
+ E06 | GET | /api/auth/reset | … | new endpoint added by cycle-1 fix

### Removed
- I004 | S02 | "Old delete button" — deprecated in cycle-1 fix

### Changed
~ I003 | S02 | Save profile button | now also calls POST /api/user/track-save (added per cycle-1 fix)
```

This diff section is the only thing the cycle-2+ inventory needs to
regenerate; everything else carries forward.

## Validation: completeness checklist

Before declaring the inventory done for the cycle:

- [ ] Every navigable screen / route in the codebase appears in Screens
- [ ] Every state variant for each screen (empty, populated, error,
  overflow) is represented either as a separate row or as a "Notes"
  callout that Phase 2 will hit
- [ ] Every button / link / form field / gesture handler in each screen
  appears in Interactions
- [ ] Every API call from the frontend has a matching Backend endpoint row
- [ ] Every registered backend route has a Backend endpoint row
- [ ] Cross-reference column is populated for every endpoint
- [ ] No row has a blank "Expected result"
- [ ] No row has a blank "Trigger"
- [ ] Coverage axes are explicitly listed

A blank in any of these = silent gap in the audit. Phase 2 / 3 will skip
it, the verdict will look clean, and the bug will reach production. Don't
let blanks survive Phase 1.

## `findings.json` — Canonical schema

Phase 1 opens `cycle-NN/findings.json`. Phases 2 and 3 append; Phase 4
mutates `status` as findings get fixed. Subagents write their slice; the
lead reads the full file when deciding cycle exit.

```json
[
  {
    "id": "F001",
    "cycle": 1,
    "phase": "discovery",
    "screen": null,
    "interaction": null,
    "endpoint": "E99",
    "severity": "HIGH",
    "title": "Route mismatch: frontend calls /api/sessions, backend registers /api/agent-sessions",
    "evidence": [
      "cycle-01/inventory.md#endpoints",
      "public/dashboard.html:46",
      "server.js:routes"
    ],
    "suggested_fix": "Either rename frontend fetch path to /api/agent-sessions OR rename backend route to /api/sessions; pick whichever is more disruptive to other callers.",
    "status": "open",
    "introduced_by": null,
    "fixed_in_commit": null
  },
  {
    "id": "F004",
    "cycle": 1,
    "phase": "ux",
    "screen": "S01",
    "interaction": null,
    "endpoint": null,
    "severity": "HIGH",
    "title": "Low-contrast caption on home (#b8b8b8 ≈ 2.5:1)",
    "evidence": ["cycle-01/ux-reports/S01-home.md", "public/home.html:21"],
    "suggested_fix": "Replace inline style with a semantic muted-text token (slate-600 or darker).",
    "status": "open",
    "introduced_by": null,
    "fixed_in_commit": null
  }
]
```

**Field reference:**

| Field | Type | Values |
|-------|------|--------|
| `id` | string | `F` + zero-padded sequence; never reassigned across cycles |
| `cycle` | int | the cycle in which the finding was first entered |
| `phase` | string | `"discovery"` / `"ux"` / `"functional"` / `"regression"` |
| `screen` | string \| null | screen ID from inventory (e.g., `"S02"`) — null for endpoint-only findings |
| `interaction` | string \| null | interaction ID (e.g., `"I007"`) when the finding is about a specific interaction |
| `endpoint` | string \| null | endpoint ID (e.g., `"E99"`) when the finding is about a specific endpoint |
| `severity` | string | `"CRITICAL"` / `"HIGH"` / `"MEDIUM"` / `"LOW"` |
| `title` | string | one-line human-readable summary |
| `evidence` | string[] | paths to artifacts that demonstrate the finding (screenshots, curl JSONs, source-line refs) |
| `suggested_fix` | string | human-readable proposed remediation; not a patch |
| `status` | string | `"open"` / `"fixed"` / `"escape-hatch"` / `"duplicate"` |
| `introduced_by` | string \| null | commit hash if this is a regression introduced by an earlier cycle's fix |
| `fixed_in_commit` | string \| null | commit hash that closed it (Phase 4 sets this) |

**Stable IDs across cycles**: once `F001` is assigned, it never gets
reused. Cycle 5 may add `F042` even if `F001` was fixed in cycle 1 —
the sequence is global to the run, not per-cycle. This is what lets
stuck-state detection in Phase 5 compare ID sets across cycles
meaningfully.
