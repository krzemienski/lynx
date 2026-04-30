# Lynx — Usage Guide

Lynx injects UI/UX audit skills into every Claude Code session. The commands below
are available immediately after `/lynx-setup` completes or after a fresh install.

---

## Commands

| Command | Purpose |
|---------|---------|
| `/lynx-setup` | Health-check, register plugin, verify all skills are wired |
| `/validate` | Audit a single screen or URL attached to the session |
| `/validate-plan` | Generate an audit plan before running fixes |
| `/validate-audit` | Targeted audit of one view or component |
| `/validate-fix <id>` | Apply the fix for a specific finding ID |
| `/validate-ci` | Non-interactive gate, exits 0 (pass) or 1 (fail) for CI |

---

## Recipes

### Recipe 1 — Plugin health check after install

**Trigger phrase:** `/lynx-setup`

**When to use:** After a fresh install, after upgrading, or when `/validate` is not
recognised.

**Invocation:**

```
/lynx-setup
```

**What happens:**

1. Lynx checks the plugin registry (`~/.claude/plugins/installed_plugins.json`).
2. Confirms all skills are loaded and all rule files are present in `~/.claude/rules/`.
3. Prints a status table; any MISSING rows indicate a broken install.

**Evidence path:**

```
e2e-evidence/<run-id>/lynx-setup-stdout.txt
```

**Sample output:**

```
[LYNX] Plugin registry: OK (lynx@lynx found)
[LYNX] Skills directory: OK (6 skills loaded)
[LYNX] Rules directory:  OK (3 rule files)
[LYNX] Setup complete — all systems operational.
```

---

### Recipe 2 — Single-screen audit

**Trigger phrase:** "audit this page" (or "review this screen", "is this UI good",
"QA this view")

**When to use:** You have a screenshot or URL of one specific screen and want a
focused audit report.

**Invocation:**

Attach a screenshot to the message, then type:

```
audit this page
```

**What happens:**

Lynx runs `ui-experience-audit` across 5 phases: Triage → Visual → Interactive →
Content quality → UX heuristics → Synthesis. Findings are graded P0–P3.

**Evidence path:**

```
e2e-evidence/<run-id>/audit-<screen-name>-<YYYYMMDD-HHMM>/00-pre-audit.png
e2e-evidence/<run-id>/audit-<screen-name>-<YYYYMMDD-HHMM>/findings.json
```

**Sample output:**

```
## Audit: LoginScreen — 2025-11-01 14:32

P0 (Critical) — 1 finding
  F-001: Contrast ratio 2.8:1 on "Forgot password" link (WCAG AA min 4.5:1)

P1 (High) — 2 findings
  F-002: No visible focus ring on primary CTA
  F-003: Error state missing role="alert" for screen readers

VERDICT: FAIL — 1 critical issue must be resolved before ship.
```

---

### Recipe 3 — Full app audit loop (critical + high threshold)

**Trigger phrase:** "audit and fix the whole app" (or "find and fix every issue",
"run the full audit until it passes")

**When to use:** Pre-release sweep; you want lynx to audit, fix, re-audit, and
loop until all critical and high findings are resolved.

**Invocation:**

```
audit and fix the whole app
```

**What happens:**

Lynx runs `full-ui-experience-audit` at the default `critical-high` threshold.
Each cycle: audit all screens → triage → apply fixes → re-audit. Continues until
zero P0 and P1 findings remain, or the cycle cap is reached.

**Evidence path:**

```
e2e-evidence/<run-id>/audit-evidence/cycle-01/findings.json
e2e-evidence/<run-id>/audit-evidence/cycle-02/findings.json
...
e2e-evidence/<run-id>/audit-evidence/VERDICT.md
```

**Sample output (cycle summary):**

```
Cycle 01: 12 findings (3 P0, 5 P1, 4 P2) — 8 auto-fixed
Cycle 02:  4 findings (0 P0, 2 P1, 2 P2) — 2 auto-fixed
Cycle 03:  2 findings (0 P0, 0 P1, 2 P2) — threshold reached

VERDICT: PASS at critical-high threshold (0 P0, 0 P1 remaining).
```

---

### Recipe 4 — Zero-defects production-readiness loop

**Trigger phrase:** "production-readiness loop" (or "complete UI/UX + functional sweep",
"make the app pass")

**When to use:** Final gate before production deploy; all findings — including P2
medium — must be resolved.

**Invocation:**

```
production-readiness loop
```

**What happens:**

Lynx runs `full-ui-experience-audit` at `zero-defects` threshold. Loops until the
finding count across all severity levels is zero. Any remaining P2 or P3 finding
blocks the PASS verdict.

**Evidence path:**

```
e2e-evidence/<run-id>/audit-evidence/VERDICT.md
```

**Sample output:**

```
FINAL VERDICT: PASS
Threshold:     zero-defects
Cycles run:    4
Findings remaining: 0 (P0: 0, P1: 0, P2: 0, P3: 0)
Evidence:      e2e-evidence/20251101-1532/audit-evidence/VERDICT.md
```

---

### Recipe 5 — Generate an audit plan before applying fixes

**Trigger phrase:** `/validate-plan`

**When to use:** You want to review what lynx intends to fix before it touches any
code. Useful for large apps or regulated environments where changes need sign-off.

**Invocation:**

```
/validate-plan
```

**What happens:**

Lynx audits all in-scope screens, ranks every finding by severity and fix complexity,
and writes a structured plan to disk. No code is changed. Bring the plan to your team
for review, then run `/validate-fix <id>` per finding or approve the full plan.

**Evidence path:**

```
e2e-evidence/<run-id>/validate-plan.md
```

**Sample output (plan excerpt):**

```
## Validate Plan — 2025-11-01

### Findings scheduled for remediation

| ID    | Screen       | Severity | Fix type          | Estimated effort |
|-------|-------------|----------|-------------------|-----------------|
| F-001 | LoginScreen  | P0       | CSS color update  | < 5 min         |
| F-002 | Dashboard    | P1       | ARIA attribute    | < 5 min         |
| F-003 | OnboardingV2 | P1       | Focus management  | 15–30 min       |

Approve and run: /validate-fix F-001
```

---

### Recipe 6 — Apply the fix for a specific finding

**Trigger phrase:** `/validate-fix <finding-id>`

**When to use:** After `/validate-plan` generates a plan, apply one fix at a time
to review the diff before moving to the next finding.

**Invocation:**

```
/validate-fix F-007
```

**What happens:**

Lynx looks up finding F-007 in the active audit plan, applies the minimal code
change required, re-audits the affected screen, and records the before/after
evidence.

**Evidence path:**

```
e2e-evidence/<run-id>/validate-fix-F-007.md
```

**Sample output:**

```
[F-007] Applying fix: add aria-label to icon-only button on NavBar
  File: src/components/NavBar.tsx line 42
  Change: <button> → <button aria-label="Open menu">
  Re-audit: PASS — F-007 resolved, no regressions detected.
Evidence: e2e-evidence/20251101-1540/validate-fix-F-007.md
```

---

### Recipe 7 — CI gate (non-interactive)

**Trigger phrase:** `/validate-ci`

**When to use:** From a CI pipeline (GitHub Actions, CircleCI, etc.) to block
merges when P0 or P1 issues are present.

**Invocation:**

```
/validate-ci
```

**What happens:**

Lynx runs a full audit in non-interactive mode. No prompts, no auto-fix. Exits
with code 0 if all P0/P1 findings are resolved; exits with code 1 if any remain.
A JSON report is written for downstream consumption.

**Evidence path:**

```
e2e-evidence/<run-id>/validate-ci-report.json
```

**Sample output:**

```json
{
  "verdict": "FAIL",
  "exit_code": 1,
  "findings": {
    "P0": 1,
    "P1": 0,
    "P2": 3,
    "P3": 2
  },
  "blocking_finding": "F-001",
  "report": "e2e-evidence/20251101-1545/validate-ci-report.json"
}
```

---

### Recipe 8 — Multi-platform team audit

**Trigger phrase:** "find and fix every issue" (team mode)

**When to use:** Large apps with iOS and web surfaces; parallel validators audit
each platform simultaneously, then a verdict writer synthesises the results.

**Invocation:**

```
find and fix every issue
```

**What happens:**

Lynx detects multiple platforms (e.g., iOS `.xcodeproj` + web `next.config.js`)
and spawns one validator per platform. Each validator captures evidence to its own
directory; the verdict writer synthesises after all validators complete.

**Evidence paths:**

```
e2e-evidence/<run-id>/ios/audit-evidence/VERDICT.md
e2e-evidence/<run-id>/web/audit-evidence/VERDICT.md
```

**Sample output (synthesised verdict):**

```
## Multi-Platform Verdict — 2025-11-01

iOS:  PASS — 0 P0, 0 P1 (3 P2 deferred)
Web:  FAIL — 1 P0 (F-012: missing keyboard trap on modal)

OVERALL: FAIL — 1 platform has unresolved critical findings.
```

---

### Recipe 9 — Critical-only sweep (fastest)

**Trigger phrase:** "complete UI/UX + functional sweep" (critical-only threshold)

**When to use:** Time-boxed sprint reviews or hotfix windows where only P0 blockers
matter and lower severity findings are explicitly accepted.

**Invocation:**

```
complete UI/UX + functional sweep
```

Then specify the threshold when prompted:

```
Threshold: critical-only
```

**What happens:**

Lynx runs `full-ui-experience-audit` at `critical-only` threshold. Only P0 findings
block the PASS verdict. All P1–P3 findings are recorded but do not trigger fix
cycles.

**Evidence path:**

```
e2e-evidence/<run-id>/audit-evidence/cycle-01/findings.json
```

**Sample output:**

```
Cycle 01: 9 findings (0 P0, 4 P1, 5 P2) — no critical issues found

VERDICT: PASS at critical-only threshold.
Note: 4 high and 5 medium findings recorded — schedule remediation.
Evidence: e2e-evidence/20251101-1550/audit-evidence/cycle-01/findings.json
```

---

## Evidence Directory Layout

```
e2e-evidence/
  <run-id>/
    audit-<screen>-<YYYYMMDD-HHMM>/
      00-pre-audit.png
      findings.json
    audit-evidence/
      cycle-NN/
        findings.json
      VERDICT.md
    validate-plan.md
    validate-fix-<id>.md
    validate-ci-report.json
    lynx-setup-stdout.txt
```

---

## Threshold Reference

| Threshold | Blocks on | Use case |
|-----------|-----------|---------|
| `critical-only` | P0 only | Hotfix windows, sprint reviews |
| `critical-high` | P0, P1 | Default; pre-release gates |
| `critical-high-medium` | P0, P1, P2 | Quality-focused releases |
| `zero-defects` | All findings | Production-readiness, regulated apps |
