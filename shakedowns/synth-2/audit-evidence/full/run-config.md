# Run Configuration — synth-2 full audit

Skill: `full-ui-experience-audit`
Mode: solo (no parent orchestrator)
Threshold: critical-high
Cycle cap: 3
Threshold relaxations: none

**Target:** `http://localhost:8002/index.html` (synth-2 baseline)
**Server:** `python3 -m http.server 8002` from `app/`
**Browser tool:** `agent-browser` 0.26.0
**Date:** 2026-04-29

**Discovery method:** single-screen synthetic — root `/index.html` is the only screen. Phase-0 screen-discovery returns `["/index.html"]`.

**Per-screen skill:** `ui-experience-audit` dispatched once on `/index.html`.

**Fix loop:** enabled. After each cycle, defects above critical-high threshold receive remediation patches; re-audit on the patched HTML.

**Iron Rule check:** `find /Users/nick/Desktop/lynx/shakedowns/synth-2 -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.py" -o -name "__tests__" \)` → 0 matches. The synthetic itself is the system-under-test, not a test double.
