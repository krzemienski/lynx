# Web Protocol — `agent-browser` Only

This skill uses **`agent-browser`** for every web interaction across Phases
2, 3, and 6. Not Playwright, not Chrome DevTools MCP, not Puppeteer — even
when other skills (`functional-validation`, `e2e-validate`) reference those
tools, translate their patterns to `agent-browser` before executing.

## Why `agent-browser` specifically

- It's the standardized tool across this user's ecosystem
- The `@e1`-style refs from `agent-browser snapshot -i` survive minor DOM
  changes better than CSS selectors picked on the fly
- The daemon model means the browser session persists between commands —
  cycle 2 doesn't have to log back in
- Chained commands with `&&` work cleanly when you don't need to read
  intermediate output

## The canonical command shape

Every interaction in this skill follows the same pattern:

```bash
# 1. Navigate
agent-browser open <url>

# 2. Wait for load
agent-browser wait --load networkidle

# 3. Snapshot to discover refs (READ this output before continuing)
agent-browser snapshot -i

# 4. Interact using @refs from snapshot
agent-browser fill @e1 "..."
agent-browser click @e2

# 5. Re-snapshot if DOM changed
agent-browser snapshot -i

# 6. Capture evidence
agent-browser screenshot evidence.png
```

The snapshot → interact → re-snapshot rhythm is non-negotiable. Stale refs
are the #1 cause of false-FAILs in web functional validation.

## Phase 0 — Environment setup

Before the loop, verify `agent-browser` itself is healthy:

```bash
agent-browser --version          # confirm CLI installed
agent-browser open about:blank   # confirm daemon starts
agent-browser close              # clean state
```

If the daemon doesn't start, fix that before entering the loop. Don't
proceed with a half-broken browser tool.

## Phase 1 — Discovery (web-specific notes)

Beyond the generic inventory protocol, web has these signals to grep for:

| Signal | What to grep |
|--------|--------------|
| Routes | `pages/`, `app/`, `routes/`, `<Route path=`, `useRouter`, `<Link href=` |
| Page-level components | exports under `pages/` or `app/` directories |
| In-page interactions | `onClick`, `onSubmit`, `onChange`, `useMutation`, `fetch(`, `axios.`, dialog/modal/sheet imports |
| API calls | `fetch(`, `axios`, `useQuery`, `useSWR`, `tRPC`, `apolloClient` |
| Form fields | `<input`, `<select`, `<textarea`, react-hook-form patterns |

Cross-reference frontend `fetch` paths against backend route registrations.
Mismatches go straight into Phase 4 as HIGH findings.

## Phase 2 — Per-screen UX audit

For each screen in the inventory:

```bash
# Light mode (default)
agent-browser open <base_url>/<route>
agent-browser wait --load networkidle
agent-browser screenshot audit-evidence/cycle-NN/ux-reports/<screen>-light-desktop.png

# Dark mode (only if the app supports it — see SKILL.md Phase 0 coverage axes)
# Restart with --color-scheme dark; this is the proper agent-browser flag,
# not an `eval` hack against document.documentElement.
agent-browser close
agent-browser --color-scheme dark open <base_url>/<route>
agent-browser wait --load networkidle
agent-browser screenshot audit-evidence/cycle-NN/ux-reports/<screen>-dark-desktop.png

# Mobile audit (only if mobile is in your coverage axes).
# agent-browser does NOT have a desktop-Chrome viewport-resize subcommand.
# Mobile audits go through the iOS Safari profile — a separate browser session:
agent-browser -p ios --device "iPhone 16 Pro" open <base_url>/<route>
agent-browser -p ios wait --load networkidle
agent-browser -p ios screenshot audit-evidence/cycle-NN/ux-reports/<screen>-light-mobile.png
agent-browser -p ios close
```

Then invoke `ui-experience-audit` against the captured screenshots, in
`drive-interaction` mode (since the live page is reachable). Save the
per-screen audit report. Findings flow into `cycle-NN/findings.json`.

### Element inventory per screen

`agent-browser snapshot -i` is the source of truth for what's on the page.
Capture it once per screen and save to
`cycle-NN/ux-reports/<screen>-snapshot.txt`. This becomes the input for
Phase 3.

```bash
agent-browser snapshot -i > cycle-NN/ux-reports/<screen>-snapshot.txt
agent-browser snapshot -i -C >> cycle-NN/ux-reports/<screen>-snapshot.txt
# -C also catches cursor:pointer divs that look interactive but aren't real buttons
```

## Phase 3 — Functional validation

For each interaction in the inventory, the canonical sequence:

```bash
# Navigate to the screen
agent-browser open <base_url>/<route>
agent-browser wait --load networkidle

# Capture pre-interaction state
agent-browser screenshot cycle-NN/functional-evidence/<id>-pre.png

# Get fresh refs (DOM may have changed since the snapshot in Phase 2)
agent-browser snapshot -i
# READ the output — find the element by visible label/role, not by guessing @eN

# Trigger the interaction
agent-browser click @eN
# (or fill, select, type, hover, etc.)

# Wait for any side effects (navigation, API call, modal open)
agent-browser wait --load networkidle
# OR: agent-browser wait --selector ".modal-content"
# OR: sleep 2  (last resort)

# Capture post-interaction state
agent-browser screenshot cycle-NN/functional-evidence/<id>-post.png

# If there's a backend dependency, validate the API too
curl -s <api_url> | tee cycle-NN/functional-evidence/<id>-api.json | jq .

# Verify
# 1. Read both screenshots — does the post-state match expected_result?
# 2. Read the curl response — does the JSON match expected schema?
# 3. Cross-check: if UI shows "41 items" but API returned {"total": 12}, that's a HIGH finding
```

### Response-shape contract validation

A common HIGH defect is a silent contract mismatch between client and server: the client reads `data.settings.name`, but the server returns `{saved: true}`. The runtime symptom is a `TypeError: Cannot read properties of undefined (reading 'name')` at the moment the user expects success — i.e. the worst possible time. This is latent until the rest of the save flow works (handler bound, route reachable), so a Phase 1 audit will miss it. Phase 3 must catch it.

Recipe:

```bash
# 1. grep the client for response-access patterns
agent-browser open <base_url>/<route>
grep -n "data\.[a-zA-Z]\+\.[a-zA-Z]" /path/to/client/app.js
# Records every "data.X.Y" access — these are the contract claims

# 2. Capture the actual server response shape
curl -s -X PATCH "<base_url>/api/<route>" -d '<sample-body>' \
  | jq '.' > cycle-NN/functional-evidence/<id>-server-shape.json

# 3. Diff: every grepped client access pattern MUST exist as a path in the server JSON
# Example: client reads `data.settings.name` → server JSON must contain {settings: {name: ...}}
# If grep finds N access patterns and only M exist in the response: (N-M) findings, severity HIGH each
```

The recipe survives because it does NOT assume the contract is documented anywhere. It derives the contract from the live client + live server and reports any mismatch. iter-16 finding F-3A (`/tmp/whac-a-mole-app/app.js:21` reads `data.settings.name` against an undocumented server response of `{saved: true}`) is the canonical example.

### Console & network monitoring

`agent-browser` does **not** have a streaming `console --log` subcommand.
Capture console errors after the interaction by reading them from the
runtime:

```bash
# After the interaction completes, read accumulated console errors:
agent-browser eval "JSON.stringify((window.__capturedErrors || []).slice(-50))"

# To enable capture, inject this once on the page (e.g., as a setup step
# in Phase 0 if your app doesn't already wire its own error capture):
agent-browser eval --stdin <<'EVALEOF'
if (!window.__capturedErrors) {
  window.__capturedErrors = [];
  const orig = console.error.bind(console);
  console.error = (...a) => { window.__capturedErrors.push(a.map(String).join(" ")); orig(...a); };
  window.addEventListener("error", e => window.__capturedErrors.push(e.message));
  window.addEventListener("unhandledrejection", e => window.__capturedErrors.push("unhandledrejection: " + (e.reason && e.reason.message || e.reason)));
}
EVALEOF
```

For deeper instrumentation (network, performance, DOM mutation),
`agent-browser profiler start` / `profiler stop trace.json` produces a
Chrome DevTools trace you can inspect. Use it sparingly — it's expensive.

A clean screenshot with red console errors is a FAIL, not a PASS.

### Forms — destructive vs safe

| Interaction | Safe to drive | Requires user approval |
|-------------|---------------|------------------------|
| Read-only navigation | yes | no |
| Filter, sort, search | yes | no |
| Form fills (no submit) | yes | no |
| Submit on contact / signup forms with test data | yes | escalate first if real emails could fire |
| Submit on payment / purchase | NEVER without explicit approval | always |
| Delete | NEVER without explicit approval | always |
| Send / publish / post | NEVER without explicit approval | always |

When the inventory marks an interaction as destructive, the subagent records
it as `verification needed — destructive` and the lead escalates to the user
before driving it.

## Phase 4 — Re-validation after fixes

When a fix has been applied, the re-validation step is just the Phase 3
sequence again, but only for the specific interaction that failed:

```bash
# Force-refresh in case the fix involves frontend code
agent-browser open <base_url>/<route>
agent-browser eval "location.reload(true)"
agent-browser wait --load networkidle

# Re-run the failing interaction's sequence
# ... screenshot, snapshot, click, screenshot, curl ...

# Compare post-fix screenshot against pre-fix (the original FAIL evidence)
# to confirm the actual symptom is gone
```

## Phase 6 — Clean confirmation pass

The confirmation pass is a full Phase 1 → 2 → 3 cycle without remediation.
Web-specific note: re-open every screen from a clean tab (`agent-browser
close && agent-browser open <url>`) to flush any session state that might be
masking issues a fresh user would see. Cached auth, lingering local storage,
warmed-up service workers — they all hide bugs.

## Common `agent-browser` commands cheat sheet

```bash
# Navigation
agent-browser open <url>
agent-browser back
agent-browser forward
agent-browser reload
agent-browser close

# Snapshot & inspection
agent-browser snapshot -i              # interactive elements with @refs
agent-browser snapshot -i -C           # include cursor-pointer divs
agent-browser snapshot -s "#main"      # scope to selector

# Interaction (after snapshot)
agent-browser click @e1
agent-browser fill @e1 "text"          # clear and type
agent-browser type @e1 "text"          # type without clearing
agent-browser select @e1 "option-value"
agent-browser check @e1                # checkbox
agent-browser press Enter              # key press
agent-browser keyboard type "raw"      # type at current focus
agent-browser scroll down 500
agent-browser get text @e1
agent-browser get url
agent-browser get title

# Waits
agent-browser wait --load networkidle
agent-browser wait @e1                 # ref or selector
agent-browser wait --url "**/dashboard"
agent-browser wait 2000                # ms

# Capture
agent-browser screenshot path.png
agent-browser screenshot --full path.png   # full page (NOT --full-page)
agent-browser screenshot --annotate        # numbered labels overlaid
agent-browser pdf path.pdf

# Color scheme (for dark-mode audits — set on launch, not via eval)
agent-browser --color-scheme dark open <url>
agent-browser set media dark           # toggle prefers-color-scheme mid-session without re-navigation (verified iter-9)

# Mobile (separate profile, NOT a desktop viewport resize)
agent-browser device list                              # list iOS sims
agent-browser -p ios --device "iPhone 16 Pro" open <url>
agent-browser -p ios snapshot -i
agent-browser -p ios tap @e1                           # alias for click
agent-browser -p ios swipe up
agent-browser -p ios screenshot mobile.png

# Eval (use sparingly — prefer real interactions)
agent-browser eval "document.title"
agent-browser eval --stdin <<'EVALEOF'
  /* multi-line script */
EVALEOF
```

## Anti-patterns specific to web in this skill

| Pattern | Why it fails | Do this instead |
|---------|-------------|-----------------|
| Reusing @refs from a previous Phase | DOM mutates after every navigation; refs go stale | Re-snapshot at the start of every interaction |
| Using `eval` to simulate user actions | `eval` bypasses event handlers; the bug you're "testing" may only manifest under real input | Use `click`, `fill`, `type` — the user-equivalent commands |
| Skipping `wait --load networkidle` | Screenshot captures pre-render state; interaction fails on not-yet-mounted elements | Always wait after navigation, before interacting |
| Driving destructive interactions without escalation | Real emails sent, real charges made, real users affected | Inventory marks destructive; lead escalates to user |
| Capturing screenshots without reading them | "screenshot exists" ≠ "screen looks right" | READ every screenshot in the verification step |
| Falling back to Playwright "for this one tricky case" | Inconsistency in tooling makes evidence non-comparable across cycles | Stay in `agent-browser`; if it can't do something, that's a finding to fix the tool, not a reason to switch |
