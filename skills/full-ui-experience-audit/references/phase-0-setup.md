# Phase 0 Setup — Detailed Reference

SKILL.md's Phase 0 lists the 6 steps; this file provides the canonical
templates, commands, and rules. Read this on first cycle of every run.

## 0a. Run-config block

Write `audit-evidence/run-config.md` first. Every later phase reads from
this file. If a value isn't known yet, leave a placeholder and fill in
during the rest of Phase 0.

```markdown
# Run config
- App name:               <e.g., SessionForge>
- Platform:               ios | web | fullstack | cross-platform
- Mode:                   solo | team
- Threshold:              critical-only | critical-high | critical-high-medium | zero-defects
- Max cycles:             10   (hard cap; user-configurable)
- Coverage axes:
  - Light mode:           yes | no | not-supported
  - Dark mode:            yes | no | not-supported
  - Mobile viewport:      yes | no | n/a
  - Tablet viewport:      yes | no | n/a
  - Desktop viewport:     yes | no | n/a
  - State variants:       empty | populated | error | overflow | first-launch
- Web base URL:           <e.g., http://localhost:3000>     (web/full-stack only)
- Backend health URL:     <e.g., http://localhost:3000/api/health>  (full-stack/api only)
- iOS sim UDID:           <UUID>                            (iOS only — never "booted")
- iOS bundle ID:          <e.g., com.example.codetales>     (iOS only)
- iOS .app path:          <DerivedData path>                (iOS only)
- Repomix output:         repomix-output.xml | manual-grep  (see step 0d)
- Started at:             <ISO timestamp>
- Threshold relaxations:  none   (appended if user relaxes during a stuck-state escalation)
- Degraded mode:          no | yes (set automatically if `agent-browser` is missing — see step 0d)
```

When `degraded_mode: yes`:
- Phase 2 runs in `identify-and-delegate` against static HTML + CSS reads
- Phase 3 covers backend endpoints via curl; UI interactions are
  inferred from code (event handlers, fetch paths) rather than driven
- Phase 6's clean confirmation pass is partial — no fresh-tab re-drive
- Verdict caps at `PASS (LIMITED COVERAGE)` regardless of finding counts

## 0b. Generic preflight (run first)

If the `preflight` skill is available, invoke it. It catches:

- Disk space
- Git state (no uncommitted noise; clean enough to bisect later)
- Build green on `main`
- Broad dev-tool sanity (Node version, Python version, etc.)
- Project-type detection (matches the platform you wrote in `run-config.md`)

A failing generic preflight is a stop-the-world. Don't enter the loop until
it's clean.

## 0c. Platform-specific preflight

After generic preflight, run platform-specific setup:

| Platform | Reference | What it covers |
|----------|-----------|----------------|
| iOS / cross-platform | `references/ios-protocol.md` Phase 0 | UDID selection, status bar override, fresh install, backend health |
| Web / full-stack | `references/web-protocol.md` Phase 0 | `agent-browser` daemon health, base URL reachable, dark-mode flag verified |

Generic and platform-specific preflights don't overlap; both run, in order.

## 0d. Tool availability check

Verify each tool you'll need exists. Don't enter the loop with a missing
tool — the failure mode is silent skipping, not loud crashing.

```bash
# Required for all platforms
git --version            # version control (hard-fail)
which curl               # API checks (hard-fail)

# JSON inspection — jq preferred, python3 -m json.tool as fallback
which jq || echo "fallback: use python3 -m json.tool"

# Web / full-stack
agent-browser --version  # browser automation (soft-fall to degraded mode)

# iOS
xcrun simctl help        # simulator control (hard-fail)
which xcodebuild         # build (hard-fail)

# Standing instruction (optional, with fallback)
which repomix            # codebase compression (soft-fall to manual-grep)
```

**Per-tool fallback policy:**

| Tool | If missing | Action |
|------|-----------|--------|
| `git`, `curl` | hard fail | install before continuing; tell user |
| `jq` | soft fall | use `python3 -m json.tool` (universally available with Python) for JSON pretty-printing/inspection; functionally equivalent for evidence review |
| `agent-browser` (web run) | **soft fall to degraded mode** | Phase 2 runs in `ui-experience-audit`'s `identify-and-delegate` mode against static HTML + CSS reads (no live driving); Phase 3 runs curl-only on backend endpoints; Phase 6's confirmation pass is partial (no fresh-tab re-driving). Verdict caps at `PASS (LIMITED COVERAGE)`. Set `degraded_mode: yes` in `run-config.md`. |
| `xcrun simctl`, `xcodebuild` (iOS run) | hard fail | install Xcode + command-line tools before continuing; static iOS code review is too thin to substitute for simulator runs |
| `repomix` | soft fall back | skip step 0e's compression; note `manual-grep` in `run-config.md` and use `grep`/`find` directly in Phase 1 |

**Why agent-browser soft-falls but xcrun does not**: a static HTML+CSS
read genuinely catches contrast bugs, false affordances, structural
issues, and route mismatches — the web's interrogability lets you do
real work without live driving. iOS apps compile to binaries; without
a running simulator there's no equivalent way to inspect rendered state,
test gestures, or surface runtime crashes. So iOS is hard-fail, web
degrades.

**Long-running services note**: Phases 0, 3, and 6 all expect the
backend (and any other dependency services) to be reachable. If your
environment uses short-lived shells (sandboxed bash invocations,
ephemeral CI), keep the service running externally — don't rely on a
nohup'd background process from one phase to survive into the next.

## 0e. Build the codebase index (repomix or fallback)

When repomix is available:

```bash
repomix --style xml --compress     # writes repomix-output.xml in cwd
```

Read the output before Phase 1 starts. This dramatically reduces the
re-grepping cost across cycles.

If repomix isn't available, skip and work directly from the source tree
(use `find`, `grep -r`, `rg`). Every phase still works; you just pay the
re-grep cost on each cycle. Note `manual-grep` in `run-config.md`.

## 0f. Establish a baseline + create evidence directory

Capture what the app looks like RIGHT NOW. This is the "before" picture —
findings that exist before the audit started won't be misattributed to the
loop later. Capture:

- A baseline screenshot of the home/landing screen
- A baseline `curl` of any health endpoints
- For iOS: the current build's bundle version and a screenshot of the app
  cold-launch state

Save these to `audit-evidence/baseline/`.

Then lay out the rest of the evidence directory:

```
audit-evidence/
├── run-config.md           # the block from 0a
├── baseline/               # initial-state captures
├── cycle-01/
│   ├── inventory.md
│   ├── ux-reports/
│   ├── functional-evidence/
│   ├── findings.json
│   └── REPORT.md
├── cycle-02/...
├── manifest.json           # evidence index (lead-maintained in team mode)
└── VERDICT.md              # written in Phase 6
```

## 0g. Coverage axes — only audit what the app supports

Don't fail an app for not having dark mode if it doesn't support dark
mode. The coverage axes in `run-config.md` distinguish three states:

| Value | Meaning | Effect on verdict |
|-------|---------|-------------------|
| `yes` | App supports it AND will be audited this run | Counts toward full coverage |
| `no` | App supports it but the user is opting out for this run | Caps verdict at `PASS (LIMITED COVERAGE)` |
| `not-supported` | App genuinely doesn't have this feature | Doesn't count against coverage; the axis is absent, not skipped |

Examples:

- A web app with no dark-mode toggle → dark mode is `not-supported`. The
  audit doesn't try to capture dark-mode screenshots; the verdict isn't
  capped because of it.
- The same app, but with dark mode shipped — user wants to skip it this
  run because they only changed light-mode CSS → dark mode is `no`.
  Verdict caps at `PASS (LIMITED COVERAGE)`.
- A Mac/iOS app — mobile viewport is `n/a` (doesn't apply); state
  variants like first-launch still apply.

## 0h. Detect complementary skills

The audit composes well with several public skills (AccessLint,
ui-ux-pro-max, bencium refactoring-ui, identify-ux-problems, etc.).
When these are installed in the user's environment, this skill should
delegate the corresponding sub-checks rather than re-running the same
analysis. Detection runs once per Phase 0; the result lives in
`audit-evidence/complementary-skills.json` and is read by every
subsequent phase that has a delegation candidate.

### How detection works

Filesystem scan, not `tool_search`. `tool_search` is environment-
specific (Cowork has it; Claude Code's local API differs; Claude Desktop
exposes neither). Filesystem inspection works the same in every
environment, which is what the audit needs to be portable.

The script searches:

```
$HOME/.claude/skills/<name>/                              # user-installed skills
$HOME/.claude/plugins/<plugin>/skills/<name>/             # plugin-bundled skills
$HOME/Library/Application\ Support/Claude/.../skills/...  # Claude Desktop sessions
.claude/skills/<name>/                                    # project-scoped skills
```

For each entry in a known catalog (~22 entries — the full set of skills
this audit can delegate to), it records found-at path, the audit phase
that benefits, and the role to delegate.

### Run it

```bash
bash full-ui-experience-audit/scripts/complementary-skill-detection.sh \
  --out audit-evidence/complementary-skills.json
```

The script always exits 0 — discovery is best-effort and informational.
The audit loop runs whether or not complementary skills are present.

### Output shape

```json
{
  "schema_version": 1,
  "generated_by": "phase-0h complementary-skill-detection.sh",
  "search_roots": ["/Users/you/.claude/skills", ".claude/skills"],
  "detected_count": 4,
  "detected": {
    "accesslint": {
      "found_at": "/Users/you/.claude/skills/accesslint",
      "phase": "phase-2",
      "role": "Delegate contrast checking — call accesslint:contrast-checker instead of computing Lc ourselves",
      "delegate": true
    },
    "ui-experience-audit": {
      "found_at": "/Users/you/.claude/skills/ui-experience-audit",
      "phase": "phase-2",
      "role": "Per-screen 5-phase protocol — primary delegate from Phase 2",
      "delegate": true
    }
  },
  "available_roles_by_phase": ["phase-2", "phase-3"]
}
```

### How later phases use the report

Every phase that has potential delegates checks the report at the start
of its work:

```bash
HAVE_ACCESSLINT=$(jq -r '.detected.accesslint.delegate // false' \
  audit-evidence/complementary-skills.json 2>/dev/null)

if [[ "$HAVE_ACCESSLINT" == "true" ]]; then
  # Delegate contrast checks to AccessLint instead of inline computation
  echo "Phase 2: delegating contrast checks to AccessLint"
  # ... invoke accesslint:contrast-checker per screen ...
else
  # Fall back to the inline APCA/WCAG calc described in
  # references/visual-experience-audit.md § Contrast
  echo "Phase 2: running inline contrast computation"
fi
```

Per-phase delegation map (the canonical one — duplicated from the
catalog inside the detection script for documentation purposes):

| Phase | Skill | Role when delegated |
|-------|-------|---------------------|
| 0 | `preflight` | Generic environment sanity (already documented in 0b) |
| 1 | `full-functional-audit` | Inventory protocol (Phase 1 EXPLORE) |
| 2 | `ui-experience-audit` | Per-screen 5-phase protocol — primary delegate |
| 2 | `accesslint` | Contrast checking (replaces inline APCA/WCAG calc) |
| 2 | `bencium-refactoring-ui` | Visual-hierarchy / spacing / palette tactical pass |
| 2 | `ui-ux-pro-max` | Cross-reference findings against 99 UX guidelines |
| 2 | `identify-ux-problems` | Heuristic-evaluation overlay |
| 2 | `vercel-web-guidelines` | Cross-reference findings against canonical 100+ rule list |
| 2 | `ux-writing` | Voice/copy tone (mechanical pass cannot catch this) |
| 2 | `visual-inspection` | Per-screenshot QA — invoked from inside Phase 2 |
| 2 (iOS) | `ios-hig-design` | Apple-specific: safe areas, Dynamic Type, semantic colors |
| 3 | `functional-validation` | Iron Rule + platform-specific validation |
| 3 (iOS) | `ios-validation-runner` | iOS evidence capture protocol |
| 4 | `no-mocking-validation-gates` | Anti-mocking guard |
| 5, 6 | `gate-validation-discipline` | Evidence-cited completion gate |
| 6 | `verification-before-completion` | Pre-claim discipline for the verdict |
| 6 | `e2e-validate` | Optional final-pass execution engine |

### When detection finds zero skills

The audit runs entirely on its own protocols — that's the case for the
first 7 iterations of this skill, where no complementary skills were
assumed. There's no degradation; detection is purely additive.

### Refreshing detection mid-run

Skills installed mid-run aren't picked up automatically. If the user
installs a complementary skill while the loop is running and wants the
audit to delegate to it from the next cycle, re-run the detection
script and reload its report at the start of the next cycle's Phase 1:

```bash
bash full-ui-experience-audit/scripts/complementary-skill-detection.sh
```

This is the expected pattern for "I installed AccessLint mid-audit
because the contrast findings were getting tedious to verify." The
report is regenerated; the next cycle delegates.

## When Phase 0 is "done"

Before entering the loop:

- [ ] `run-config.md` written, every value either filled or explicitly
  marked `not-supported` / `n/a`
- [ ] Generic preflight passed (or skipped with reason)
- [ ] Platform-specific preflight passed
- [ ] All required tools verified present
- [ ] Repomix output produced OR fallback noted
- [ ] Baseline captures saved to `audit-evidence/baseline/`
- [ ] Evidence directory laid out (cycle-01/ created and empty, ready to
  fill)
- [ ] Complementary-skill detection ran; report at `audit-evidence/complementary-skills.json`
- [ ] User confirmed threshold + mode (from SKILL.md run-start questions)

If any of these aren't true, you're not ready for Phase 1.
