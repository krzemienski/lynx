# Live Install Verification — lynx v1.0.0

**Driven via tmux** by spawning a fresh `claude` CLI session, running the install commands, and capturing the pane output as evidence.

## Result: PASS

Plugin installed cleanly. Both skills loaded into the fresh session's available-skills set on first reload.

## Environment

- **CC version:** Claude Code v2.1.123
- **tmux version:** 3.6a
- **Test session:** `tmux new-session -s lynx-install`, working dir `/private/tmp`
- **Driver:** parent CC session (this one) sending `tmux send-keys` to the spawned session
- **Date:** 2026-04-29

## Commands run + outcomes

```
❯ /plugin marketplace add krzemienski/lynx
  ⎿ Successfully added marketplace: lynx-dev

❯ /plugin install lynx@lynx-dev
  ⎿ ✓ Installed lynx. Run /reload-plugins to apply.

❯ /reload-plugins
  ⎿ Reloaded: 57 plugins · 227 skills · 140 agents · 97 hooks · 9 plugin MCP servers · 1 plugin LSP server
```

(Marketplace name resolves to `lynx-dev` because that's the literal `name` field in `.claude-plugin/marketplace.json`.)

## Skill activation verification

Sent prompt to fresh session: *"what skills do you have available that contain 'audit' or 'experience' in their description?"*

Response listed both lynx skills under "top-level / standalone (no plugin prefix)":

- `full-ui-experience-audit`
- `ui-experience-audit`

Both skills are discoverable to the fresh session immediately after `/reload-plugins`. No restart of the CC process required.

## Filesystem confirmation

Plugin cache populated at:

```
/Users/nick/.claude/plugins/cache/lynx-dev/lynx/1.0.0/
├── .claude-plugin/{plugin.json, marketplace.json, README.md}
├── skills/full-ui-experience-audit/{SKILL.md, references/, scripts/, assets/}
├── skills/ui-experience-audit/{SKILL.md, references/}
├── brand/, shakedowns/, marketplace-submissions/
├── README.md, LICENSE
```

Verified via `find /Users/nick/.claude/plugins/cache/lynx-dev -maxdepth 5` — full tree present.

## Evidence files

- [`tmux-session-full.txt`](./tmux-session-full.txt) — full tmux pane scrollback from the install run (50 lines)

## How to reproduce

```bash
tmux new-session -d -s lynx-install -x 200 -y 50
tmux send-keys -t lynx-install "claude" Enter
sleep 8
# trust prompt
tmux send-keys -t lynx-install Enter
sleep 4
tmux send-keys -t lynx-install "/plugin marketplace add krzemienski/lynx" Enter
sleep 6
tmux send-keys -t lynx-install "/plugin install lynx@lynx-dev" Enter
sleep 6
tmux send-keys -t lynx-install Enter        # confirm user-scope install
sleep 4
tmux send-keys -t lynx-install "/reload-plugins" Enter
sleep 5
tmux capture-pane -t lynx-install -p -S -200
```

## Iron Rule

This live install run created NO test files, NO mocks, NO stubs. The only artifact is the tmux pane capture — a real-system observation, not synthesized output.
