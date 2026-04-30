# Lynx — Agents Operating Guide

Behavioral and operational directives for autonomous agents (Claude Code subagents, OpenAI assistants, custom orchestrators) working inside the **lynx** plugin repository. These rules override default agent behavior. Read this file before any task that touches plugin skills, hooks, commands, or evidence directories.

This file is **content-equivalent** to `CLAUDE.md` (lynx project context, Iron Rule, 4-phase pipeline, evidence discipline). The header differs because some platforms read `AGENTS.md` and not `CLAUDE.md`. If you've already read CLAUDE.md, you may skip this file.

---

## Philosophy

1. **Audit live systems, never mock them.** Every verdict must come from a real browser session driven by `agent-browser` MCP. No stubs, no hand-written "expected" HTML, no fixture responses.

2. **Evidence gates verdicts.** A PASS verdict without a cited screenshot path, a11y JSON path, and console-log path is invalid. The burden of proof is on the auditor, not the reviewer.

3. **Skills are frozen after shakedown.** The two lynx skills — `full-ui-experience-audit` and `ui-experience-audit` — were locked at 14/14 detection rate (WAM 9/9 + synth-2 5/5). **Do not modify skills without re-running shakedowns.** Any skill edit that breaks the 14/14 gate must be reverted before merge.

4. **Smallest viable audit scope.** Use `ui-experience-audit` (single-screen) for targeted re-runs. Reserve `full-ui-experience-audit` for full sweeps.

5. **Fix loops are bounded.** Maximum 3 fix attempts per failing screen. After 3 attempts mark the screen `UNFIXABLE` and continue.

6. **Cycle cap is 2.** WAM-class entanglement requires cycle-2 reach to trigger; synth-2-class requires cycle-1 reach.

7. **One source of truth per run.** All evidence for a run lives under `e2e-evidence/<run-id>/`. No evidence is fabricated after the fact or retroactively timestamped.

---

## Quick Start

```
/lynx:audit              Full audit sweep across all registered screens
/lynx:audit-screen <id>  Single-screen targeted audit
/lynx:status             Show current run state and per-screen verdicts
/lynx:report             Render run-verdict.md as a human-readable summary
```

The `agent-browser` MCP must be active before invoking any audit command. A missing `agent-browser` is a hard blocker; no audit phase will start.

---

## The 4-Phase Audit Pipeline

```
Phase 0  PREFLIGHT   Verify agent-browser reachable, screen list non-empty
Phase 1  AUDIT       Per-screen loop: screenshot → a11y tree → console → interact
Phase 2  SYNTHESIS   verdict-writer reads all screen-*-verdict.md → run-verdict.md
Phase 3  SHIP GATE   run-verdict.md PASS → eligible for evidence cleanup
                     run-verdict.md FAIL → fix loop, evidence preserved
```

### Phase 0 — Preflight

Before spawning any audit agent:
- Confirm `agent-browser` MCP responds to a health ping
- Confirm at least one screen URL is registered
- Confirm `e2e-evidence/` is writable

Abort with a structured error on any preflight failure.

### Phase 1 — Per-screen audit loop

For each registered screen:
1. Navigate via `agent-browser`
2. Capture screenshot → `e2e-evidence/<run-id>/<screen-id>/screenshot.png`
3. Capture a11y tree → `<screen-id>/a11y.json`
4. Capture console log → `<screen-id>/console.txt`
5. Run interaction probes per skill checklist
6. Emit `<screen-id>/verdict.md` with per-finding evidence citations

### Phase 2 — Synthesis

The `verdict-writer` agent reads all per-screen verdicts and emits `run-verdict.md` at run root. Refuses to emit overall PASS without ≥1 cited evidence file path per finding (RL-2 cite-or-refuse).

### Phase 3 — Ship gate

If `run-verdict.md` overall is PASS, the run is eligible for the cleanup retention policy (default 30-day TTL). FAIL verdicts preserve all evidence indefinitely until the issue is resolved.

---

## Iron Rule (verbatim)

```
IF the real system does not work, FIX THE REAL SYSTEM.
NEVER create mocks, stubs, test doubles, or test files.
NEVER write .test.ts, _test.go, Tests.swift, test_*.py, or any test harness.
ALWAYS validate through the same interfaces real users experience.
ALWAYS capture evidence. ALWAYS review evidence. ALWAYS write verdicts.
```

---

## Evidence Discipline

| Phase | Evidence type | Path |
|-------|---------------|------|
| Per-screen audit | screenshot.png | `e2e-evidence/<run-id>/<screen-id>/` |
| Per-screen audit | a11y.json | same |
| Per-screen audit | console.txt | same |
| Per-screen audit | verdict.md | same (cite ≥1 evidence path per finding) |
| Run-level | run-verdict.md | `e2e-evidence/<run-id>/` |
| Shakedown | findings.md | `shakedowns/<corpus>/findings.md` |

All evidence files MUST be non-empty. Zero-byte files are invalid evidence. Timestamps must match the execution timeline (no retroactive editing).

---

## Skill Change Protocol

**Skills are frozen.** If you must modify `skills/full-ui-experience-audit/SKILL.md` or `skills/ui-experience-audit/SKILL.md`:

1. Re-run BOTH shakedowns (`shakedowns/whac-a-mole/` 9/9 + `shakedowns/synth-2/` 5/5)
2. Verify total detection remains 14/14
3. If detection regresses on ANY corpus: revert before merge

Skill changes that break 14/14 are not eligible for review — they're rejected at the gate.

---

## Sub-agent invocation patterns

Lynx ships one sub-agent: `verdict-writer` (read-only). Spawn pattern:

```
Task(
  subagent_type="lynx:verdict-writer",
  prompt="Read e2e-evidence/<run-id>/, emit run-verdict.md citing each finding's evidence path. Refuse PASS without citation."
)
```

The `verdict-writer` has Read, Glob, Grep, Bash. NO Write outside its evidence dir. NO Edit on skills/ or hooks/.

---

## What lynx is NOT

- NOT a unit-test runner (use existing test frameworks)
- NOT a static analyzer (use ESLint, ruff, etc.)
- NOT a load tester (use k6, artillery)
- NOT a CI runner (use GitHub Actions, CircleCI)

Lynx audits **live UIs through real browser sessions** for entanglement defects (visual regressions, a11y violations, false affordances, modal traps, etc.). Reach for it when "does this UI actually work for users" is the question.

---

## Reference

- `CLAUDE.md` — same content, addressed to the Claude Code reader
- `ARCHITECTURE.md` — system design + data flow + sibling comparison
- `PRD.md` — vision, goals, acceptance metrics, roadmap
- `INSTALL.md` — install paths + verification + troubleshooting
- `USAGE.md` — 9 worked examples / recipes
- `CONTRIBUTING.md` — dev setup + skill change protocol + PR checklist
- `TECHNICAL-DEBT.md` — known limitations + v1.2 backlog
- `COMPETITIVE-ANALYSIS.md` — alternatives + feature matrix + positioning
- `CHANGELOG.md` — release history
