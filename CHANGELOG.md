# Changelog

All notable changes to the lynx plugin are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-04-29 — Plugin Surface Expansion

Brings lynx to feature-parity with sibling evidence-gated plugins (anneal, crucible, validationforge). The two existing skills (`full-ui-experience-audit` and `ui-experience-audit`) are **frozen** — their 14/14 detection accuracy across two synthetic shakedowns (WAM 9/9 + synth-2 5/5) remains the load-bearing empirical claim. v1.1 ships the surrounding apparatus that makes those skills production-grade and discoverable: hooks, slash commands, a sub-agent, install/uninstall scripts, and the planning artifacts required for a public site rollout.

### Added

#### Hooks (5)

- **`hooks/block-test-files.js`** — PreToolUse on Write/Edit/MultiEdit. Blocks creation of `*.test.*`, `*.spec.*`, `tests/`, `__tests__/`. Emits `permissionDecision: "deny"` via JSON output protocol with a lynx-branded reminder of the Iron Rule.
- **`hooks/mock-detection.js`** — PreToolUse on Write/Edit/MultiEdit. Scans content being written for mock/stub/fixture/test-double patterns. Exits 2 with stderr message; legacy stderr+exit-2 protocol.
- **`hooks/validation-not-compilation.js`** — PostToolUse on Bash. When stdout signals build/compile success, prints stderr reminder that compilation ≠ validation.
- **`hooks/evidence-gate-reminder.js`** — PreToolUse on TaskUpdate. When `status: "completed"` is set, surfaces an evidence checklist (PERSONALLY examined? VIEWED screenshots? EXAMINED output? CITED evidence?). Modern JSON protocol.
- **`hooks/completion-claim-validator.js`** — PostToolUse on Bash. Catches "succeeded" / "passed" / "complete" in output without a cited evidence path. Modern JSON protocol.
- **`hooks/hooks.json`** — manifest mirroring validationforge's schema; declares matchers + commands for all 5 hooks.

#### Slash commands (4)

- **`commands/audit.md`** — `/lynx:audit` invokes the full-ui-experience-audit skill on the current project, captures evidence under `e2e-evidence/<run-id>/`.
- **`commands/audit-screen.md`** — `/lynx:audit-screen <screen-id>` invokes ui-experience-audit on a single screen.
- **`commands/status.md`** — `/lynx:status` reports the most recent audit's verdict from `e2e-evidence/`, returns "no prior run" gracefully if none.
- **`commands/report.md`** — `/lynx:report` produces a human-readable summary of the most recent audit.

#### Sub-agent (1)

- **`agents/verdict-writer.md`** — read-only sub-agent (Read, Glob, Grep, Bash). Walks per-screen findings under `e2e-evidence/<run-id>/<screen-id>/`, emits per-screen `verdict.md` plus aggregate `run-verdict.md` at run root. Refuses to emit PASS without ≥1 cited evidence file path (literal RL-2). 148 lines.

#### Scripts (2)

- **`install.sh`** — adapted from validationforge's installer. Idempotent JSON manipulation of `~/.claude/plugins/installed_plugins.json`. Sandbox-friendly via `LYNX_ALLOW_TMP_INSTALL` + `LYNX_ALLOW_ALT_SOURCE` env guards.
- **`uninstall.sh`** — symmetric uninstaller. `CLAUDE_CONFIG_DIR`-relative paths throughout. Manifest-based rule removal with `lynx-*.md` glob fallback. `plugin_key = "lynx@lynx"`.

#### Documentation (planned for v1.1.1, partial in v1.1.0)

The DEEPEST-PROMPT.xml plan calls for 10 root docs (ARCHITECTURE.md, INSTALL.md, PRD.md, USAGE.md, CONTRIBUTING.md, TECHNICAL-DEBT.md, COMPETITIVE-ANALYSIS.md, CLAUDE.md, AGENTS.md, README expansion) + an Astro/Starlight site at a custom subdomain + a multi-page blog series. v1.1.0 ships the **plugin surface** + **planning artifacts**. The docs-and-site rollout is sequenced in `evidence/oracle-plan-reviews/20260429T164604Z/plan.md` (43 MSCs) and continues in v1.1.1.

### Changed

- **`.claude-plugin/plugin.json`** — version bumped 1.0.0 → 1.1.0. Added `hooks`, `commands`, `agents` keys referencing their respective dirs. Description expanded to ~176 chars. Added 16 keywords (`audit`, `ui-defects`, `evidence-gated`, `claude-code-plugin`, `lynx`, etc.).
- **`.claude-plugin/marketplace.json`** — version sync to 1.1.0. Description matches plugin.json. 5-element keywords array.
- **README.md** — slated for expansion (Hooks / Commands / Agents / Site+blog / Sibling parity sections) in v1.1.1 sequenced via plan.md MSC-20.

### Iron Rule discipline

- No mocks, no stubs, no fixtures, no test files anywhere in v1.1 changes.
- 5 hooks fire-tested via real `node hook.js < payload.json` invocation; trace at `e2e-evidence/phase-01-plugin/hook-fire-log.txt` (6 exit=2, 7 blocked events, 4 benign silents).
- Install/uninstall scripts round-tripped against a real sandbox `installed_plugins.json` at `/tmp/lynx-install-sandbox-*/` — live `~/.claude/plugins/installed_plugins.json` left untouched. Trace at `e2e-evidence/phase-01-plugin/install-script-trace.txt`.
- Verdict-writer agent format-rehearsed against the real synth-2 shakedown corpus (5 ground-truth defects, all 5 cited as `evidence:` lines). Live agent invocation deferred to v1.1.1's Phase 6 regression after plugin install + reload.
- Plan oracle-reviewed at `evidence/oracle-plan-reviews/20260429T164604Z/oracle-1-verdict-plan.md` (APPROVE).

### Empirical evidence (citations)

| Component | Citation |
|-----------|----------|
| Plugin manifest | `e2e-evidence/phase-01-plugin/manifest-parse.json` + `claude-plugin-validate.txt` (exits 0) |
| Hook fire log | `e2e-evidence/phase-01-plugin/hook-fire-log.txt` |
| Command register | `e2e-evidence/phase-01-plugin/command-register.txt` (45 `/lynx:` matches) |
| Agent rehearsal | `e2e-evidence/phase-01-plugin/agent-run-verdict.md` (5 PASS rows + 6 evidence: lines) |
| Install round-trip | `e2e-evidence/phase-01-plugin/install-script-trace.txt` |
| Phase 0 recon | `e2e-evidence/phase-00-recon/{ref-plugin-inventory.txt, component-decision-matrix.md, diagrams/*.{mmd,svg}}` |
| Plan + oracle | `evidence/oracle-plan-reviews/20260429T164604Z/{plan.md, oracle-1-verdict-plan.md}` |

### What's in the box (delta)

| | v1.0.0 | v1.1.0 |
|---|--------|--------|
| Skills | 2 | 2 (frozen — detection-validated 14/14) |
| Hooks | 0 | 5 |
| Slash commands | 0 | 4 |
| Sub-agents | 0 | 1 |
| Scripts | 0 | 2 (install + uninstall) |
| Plugin manifest | scaffold | hooks + commands + agents declared |
| Brand assets | YES | YES (unchanged) |
| Marketplace stub | YES | YES (description + keywords expanded) |

## [1.0.0] — 2026-04-23 — Initial Release

- Two production skills: `full-ui-experience-audit` (full-app + multi-screen detection) and `ui-experience-audit` (single-screen drill-down).
- Brand assets (logo, badges, swatches).
- Marketplace stub manifest.
- README, LICENSE.
- 14/14 detection accuracy validated across WAM (9/9) + synth-2 (5/5) shakedowns.
