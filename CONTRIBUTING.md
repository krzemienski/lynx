# Contributing to Lynx

Lynx is an evidence-gated UI audit plugin for Claude Code. Contributions are welcome — provided they honor the **Iron Rule** and the **shakedown protocol** below. PRs that violate either are rejected at the gate, not at review.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be kind. Surface confusion explicitly. Cite sources. Never dunk on people for asking questions.

---

## Dev Setup

### Prerequisites

- macOS or Linux (Windows via WSL2 unverified)
- Claude Code v1.0+ (`claude --version`)
- Node 20+ (`node --version`) — required for hooks
- Python 3.10+ — required for any helper scripts
- `jq` — required for plugin manifest validation
- `git` — for normal contribution workflow

### Clone + bootstrap

```bash
git clone https://github.com/<your-org>/lynx.git
cd lynx
bash install.sh   # registers lynx in ~/.claude/plugins/installed_plugins.json
claude plugin list | grep lynx   # verify
```

### Activate `agent-browser` MCP

`agent-browser` is a hard runtime dependency. Without it, no audit phase will start. Configure it via your CC session's `.claude/mcp.json` or your global MCP config.

### Run the existing skills against synth-2

Before any change, sanity-check that the baseline still passes:

```bash
# In a fresh CC session at lynx repo root:
/lynx:audit-screen synth-2
# Expected: 5/5 detection, all 5 ground-truth defects flagged
```

If this fails before you've made any change, fix your environment (likely `agent-browser` not connected, or evidence dir not writable) before continuing.

---

## Branch + commit conventions

### Branches

- `main` — protected; ships only after evidence-gated review
- `feat/<short-description>` — feature branches
- `fix/<issue-id>-<short>` — bug fixes
- `docs/<area>` — doc-only changes
- `chore/<area>` — refactors, dep bumps, tooling

### Commits

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
feat: add evidence-quality-check hook
fix: handle agent-browser disconnect mid-audit
docs: expand USAGE.md with cycle-cap examples
chore: bump @astrojs/starlight to 0.38.4
```

No emoji. No multi-line subject. Body explains *why*, not *what*.

---

## Hook test loop

Hooks are stdin-driven Node scripts. Test loop:

```bash
# Trigger payload
echo '{"tool_name":"Write","tool_input":{"file_path":"/tmp/x.test.ts","content":""}}' \
  | node hooks/block-test-files.js
echo "exit=$?"
# Expected: exit=0 with hookSpecificOutput.permissionDecision="deny" OR exit=2 with stderr message

# Benign payload
echo '{"tool_name":"Write","tool_input":{"file_path":"/tmp/x.ts","content":""}}' \
  | node hooks/block-test-files.js
echo "exit=$?"
# Expected: exit=0 with no output
```

Run BOTH cases for every hook on every PR that touches `hooks/`. The test loop output goes into `e2e-evidence/phase-01-plugin/hook-fire-log.txt` as the merge gate.

---

## Agent test loop

The `verdict-writer` agent is exercised against the synth-2 corpus:

```bash
# In a fresh CC session at lynx repo root, after install:
# (this is the real Phase 6 regression — DO NOT use a mocked or hand-printed verdict)
Task(subagent_type="lynx:verdict-writer", prompt="Walk shakedowns/synth-2/, emit run-verdict.md with ≥5 evidence: lines and overall PASS row")
```

The agent must reproduce ≥5 `evidence:` citations and 1 overall verdict row. Compare against `e2e-evidence/phase-01-plugin/agent-run-verdict.md` (manual rehearsal) for format match.

---

## Skill change protocol — MANDATORY

The two lynx skills (`full-ui-experience-audit`, `ui-experience-audit`) are locked at **14/14 detection accuracy** (Whac-A-Mole 9/9 + synth-2 5/5). This is the load-bearing empirical claim for the entire plugin.

**Rule: every skill change re-runs shakedowns.**

PR template requires:

```
- [ ] I changed skills/. I have re-run BOTH shakedowns:
      - shakedowns/whac-a-mole/  result: __ / 9
      - shakedowns/synth-2/      result: __ / 5
- [ ] Total detection remains 14/14
- [ ] If detection regresses, this PR is reverted, not merged
```

If detection regresses on ANY corpus, the PR is closed without merge. The skill change is the wrong direction. Investigate WHY the regression occurred — that's the actual learning.

---

## Evidence discipline (per the Iron Rule)

Every PR that adds a feature MUST include real evidence:

- Hook PRs → `e2e-evidence/phase-01-plugin/hook-fire-log.txt` updated with new entries
- Command PRs → fresh `command-register.txt` showing autocomplete coverage
- Agent PRs → live `agent-run-verdict.md` (not rehearsal) from a real corpus run
- Skill PRs → BOTH shakedown verdicts attached

PRs without evidence are deferred until evidence is supplied. There is no `--force` flag.

---

## PR checklist (10 boxes)

Before requesting review:

- [ ] No `*.test.*`, `*.spec.*`, `tests/`, `__tests__/` files added
- [ ] No mock objects, stubs, fixtures, or test doubles in any new code
- [ ] No `TEST_MODE=true`, `DRY_RUN=1`, or similar bypass flags
- [ ] Real evidence file(s) cited in PR description with relative path
- [ ] If skill changed: BOTH shakedowns re-run, results in PR description
- [ ] Hook changes accompanied by updated `hook-fire-log.txt`
- [ ] Command changes accompanied by autocomplete capture
- [ ] Agent changes accompanied by live run-verdict.md (not rehearsal)
- [ ] `claude plugin validate /path/to/lynx` exits 0
- [ ] `CHANGELOG.md` updated under `[Unreleased]`

PRs that miss any box are sent back with the unchecked box(es) cited.

---

## Filing issues

- Reproduction steps (real CC session, not theoretical)
- Expected vs actual evidence
- Attached: screenshot, log tail, or verdict.md showing the defect
- Lynx + Claude Code + agent-browser versions

Issues without reproductions are tagged `needs-repro` and parked until reproducible.

---

## License

MIT. See [LICENSE](./LICENSE).

---

## Reference

- `CLAUDE.md` — agent operating directives
- `AGENTS.md` — same content for non-Claude agents
- `ARCHITECTURE.md` — system design
- `INSTALL.md` — install paths + verification
- `USAGE.md` — 9 worked examples
- `TECHNICAL-DEBT.md` — known limitations + v1.2 backlog
