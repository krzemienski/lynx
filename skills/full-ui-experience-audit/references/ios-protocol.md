# iOS Protocol — Simulator Discipline

This skill leans on `ios-validation-runner` for the heavy lifting on iOS.
Read its SKILL.md before your first iOS run; it covers the SETUP → RECORD →
ACT → COLLECT → VERIFY protocol that drives Phase 3 here. This file covers
the bits specific to running that protocol inside the audit loop.

## Preflight order (don't double up)

iOS Phase 0 has two preflight steps that must run in this order:

1. **Generic `preflight` skill** (per SKILL.md Phase 0b) — disk space,
   git state, build green on main, broad dev-tool sanity. Runs first.
2. **iOS-specific Phase 0 setup** (the section below) — UDID
   selection, status bar override, fresh install, status of any required
   backend.

The two don't overlap; both are required. Skip neither.

## Phase 0 — Environment setup

Before the loop, confirm all of these:

```bash
# Pick a deterministic UDID, NOT "booted"
xcrun simctl list devices | grep -i "iphone 15 pro"
UDID=<copy-the-uuid>

# Boot if not already booted
xcrun simctl boot "$UDID" 2>/dev/null || true
sleep 5

# Override status bar so screenshots are reproducible across cycles
xcrun simctl status_bar "$UDID" override \
  --time "9:41" \
  --dataNetwork wifi \
  --wifiBars 3 \
  --batteryState charged \
  --batteryLevel 100

# Build the app fresh
xcodebuild -workspace App.xcworkspace -scheme App \
  -destination "platform=iOS Simulator,id=$UDID" build

# Find the .app bundle (NOT in build/ — Xcode uses DerivedData)
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "*.app" \
  -path "*/Debug-iphonesimulator/*" | head -1)
xcrun simctl install "$UDID" "$APP_PATH"

# Confirm backend (if any) is healthy
curl -sf http://localhost:<PORT>/health
```

If the user has multiple Claude sessions running, **never use `booted` as
UDID** — it picks a random simulator. Always reference the explicit UUID.

## The simulator is an exclusive resource

Across the entire loop:

- Only one agent at a time can capture from or interact with the simulator
- In team mode, the **lead** holds the simulator mutex and grants short windows
  to subagents on demand
- "Short" means: capture screenshot → release. Don't hold the lock through
  analysis or report writing — release, analyze, then request again if you
  need another capture

This is the single most common source of false-FAILs in iOS team-mode runs.
Hold the lock briefly, release immediately.

## Phase 1 — iOS-specific discovery

Beyond the generic inventory protocol, grep for these iOS signals:

| Signal | Pattern |
|--------|---------|
| Top-level views | `struct .*: View` with `@main`-adjacent or `TabView`/`NavigationStack` parents |
| Navigation | `.navigationDestination`, `NavigationLink`, `.sheet`, `.fullScreenCover`, `.popover` |
| Alerts/dialogs | `.alert(`, `.confirmationDialog(` |
| Tap targets | `Button(`, `.onTapGesture`, `.contextMenu`, `.swipeActions` |
| Deep links | URL scheme handlers, `onOpenURL`, scene delegate URL handlers |
| API clients | `URLSession`, `apiClient.`, `Alamofire`, custom `NetworkService` patterns |

Write the inventory in the same format as web — the per-screen rows include
the iOS-specific trigger path (e.g., `tab=Settings → row=Account` or `deep
link: myapp://account/edit`).

## Phase 2 — Per-screen UX audit

Capture pattern per screen:

```bash
# Navigate (deep links are usually faster than driving the UI)
xcrun simctl openurl "$UDID" "myapp://path/to/screen"
sleep 3   # SwiftUI onAppear + data load + animation

# Capture light mode
xcrun simctl io "$UDID" screenshot \
  audit-evidence/cycle-NN/ux-reports/<screen>-light.png

# If dark mode is in coverage:
xcrun simctl ui "$UDID" appearance dark
sleep 1
xcrun simctl io "$UDID" screenshot \
  audit-evidence/cycle-NN/ux-reports/<screen>-dark.png
xcrun simctl ui "$UDID" appearance light   # restore
```

Then invoke `ui-experience-audit` against the captures, using
`drive-interaction` mode if you have `idb` for taps, otherwise
`identify-and-delegate`.

### Deep link gotchas (carried from `ios-validation-runner`)

- UUIDs in URLs must be **lowercase** — uppercase silently fails
- App must be foregrounded; otherwise the OS shows "Open in App?" first
- URL scheme must be registered in `Info.plist`
- After `openurl`, sleep ≥ 3s before screenshotting; SwiftUI navigation
  animations + data load are not instantaneous

## Phase 3 — Functional validation

For each interaction, run the SETUP → RECORD → ACT → COLLECT → VERIFY
protocol from `ios-validation-runner`. The summary, adapted for the loop:

```bash
# (Lead) Acquire simulator mutex
# (Lead grants window to functional-validator subagent, OR solo agent proceeds)

# Start log streaming BEFORE the action — start AFTER misses launch logs
xcrun simctl spawn "$UDID" log stream \
  --predicate "subsystem == \"$BUNDLE_ID\"" \
  --info --debug \
  --style compact \
  > cycle-NN/functional-evidence/<id>-logs.txt 2>/dev/null &
LOG_PID=$!

# Optional: video recording for non-trivial flows
xcrun simctl io "$UDID" recordVideo --codec=h264 --force \
  cycle-NN/functional-evidence/<id>.mov &
RECORD_PID=$!

# Pre-state screenshot
xcrun simctl io "$UDID" screenshot cycle-NN/functional-evidence/<id>-pre.png

# Trigger the interaction (deep link, tap via idb, or programmatic)
# ... action ...
sleep 3

# Post-state screenshot
xcrun simctl io "$UDID" screenshot cycle-NN/functional-evidence/<id>-post.png

# Stop log stream
kill $LOG_PID
wait $LOG_PID 2>/dev/null

# Stop video — SIGINT, NOT SIGKILL
kill -SIGINT $RECORD_PID
wait $RECORD_PID

# (Lead) Release simulator mutex

# Belt-and-suspenders: pull last 120s of logs in case the stream missed boundaries
xcrun simctl spawn "$UDID" log show --last 120s \
  --predicate "subsystem == \"$BUNDLE_ID\"" \
  > cycle-NN/functional-evidence/<id>-logs-archive.txt

# Verify backend dep (if any)
curl -s <api_url> | tee cycle-NN/functional-evidence/<id>-api.json | jq .
```

### Three classes of failure to check for

After the action:

1. **Visual** — read the post-screenshot. Does it match expected? Wrong
   screen, error dialog, blank view, loading spinner stuck on?
2. **Logs** — `grep -ci "error\|fault\|exception" <id>-logs.txt`. Errors
   in the logs are a finding even if the screenshot looks fine.
3. **Crash reports** — new `.ips` files in `~/Library/Logs/DiagnosticReports/`?
   ```bash
   ls -t ~/Library/Logs/DiagnosticReports/*.ips 2>/dev/null | head -5
   ```
   New crash since the last cycle = CRITICAL finding.

## Phase 4 — iOS-specific fix discipline

After fixing iOS code:

1. Rebuild — `xcodebuild ... build` must exit 0 cleanly
2. Reinstall — `xcrun simctl install "$UDID" "$APP_PATH"` (DerivedData,
   not local `build/`)
3. Terminate any running instance — `xcrun simctl terminate "$UDID" "$BUNDLE_ID"`
4. Launch fresh — `xcrun simctl launch "$UDID" "$BUNDLE_ID"`
5. Re-run the specific Phase 3 sequence that failed

If a fix changes navigation structure or a deep link scheme, the inventory
in cycle N+1 must reflect that — re-run Phase 1's iOS-specific grep so the
new screen / link is audited next cycle.

## Phase 6 — iOS confirmation pass

For the clean confirmation pass:

1. Erase and re-install the app to flush all local state:
   ```bash
   xcrun simctl uninstall "$UDID" "$BUNDLE_ID"
   xcrun simctl install "$UDID" "$APP_PATH"
   ```
2. Run the full Phase 1 → 2 → 3 cycle from a clean app state
3. A first-launch onboarding flow that you skipped in earlier cycles will
   now appear — that's the point. Audit it.

## NEVER list (carried from `ios-validation-runner`, restated for the loop)

- **NEVER use `kill -9` on video recording** — produces a corrupt MOV. Use
  `kill -SIGINT` and `wait`.
- **NEVER omit `--info --debug` from log streaming** — without them, only
  Error/Fault are captured. Most app logging is at Info level.
- **NEVER screenshot without checking the screen first** — a loading
  spinner or onboarding flow is evidence of a problem, not a PASS.
- **NEVER claim PASS without reading every screenshot** — file existence is
  not verification. This applies doubly to subagent reports.
- **NEVER start log streaming AFTER app launch** — you miss the
  launch-time logs which often contain the actual error.
- **NEVER use `booted` as UDID in multi-session environments** — explicit
  UUID always.
- **NEVER use the local `build/` directory for the .app path** — Xcode
  outputs to `~/Library/Developer/Xcode/DerivedData/`.

## Cleanup at end of each cycle

Reset state to keep cycles comparable:

```bash
# Clear status bar override before next cycle
xcrun simctl status_bar "$UDID" clear

# Re-apply at start of next cycle
xcrun simctl status_bar "$UDID" override --time "9:41" ...
```

For the final cycle, also clear the override so the simulator is left in a
normal state for the user.
