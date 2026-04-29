# synth-2 — Defect Inventory (ground truth)

5 distinct UX defects. Different code paths from the Whac-A-Mole synthetic.

| ID | Defect | Where | Skill checklist row that should catch it |
|---|---|---|---|
| **D1** | Modal trap — no close button, esc disabled | `app/index.html` `<dialog#trap-modal>` + JS `cancel`-prevent | `interactive-element-audit.md` → "modal lacks dismiss path"; `web-protocol.md` → keyboard trap |
| **D2** | Form inputs without `<label for>` association | `app/index.html` `<form>` placeholder-only inputs | `web-wcag-checklist.md` → 1.3.1 Info & Relationships, 3.3.2 Labels or Instructions |
| **D3** | Color-only error (red on green bg) — APCA Lc fails | `app/index.html` `.error-msg` class | `web-wcag-checklist.md` → 1.4.1 Use of Color, APCA Lc ≥ 60 worked-example match |
| **D4** | Fixed `font-size: 11px` caption — breaks at 200% zoom + ignores user prefs | `app/index.html` `.caption` class | `web-wcag-checklist.md` → 1.4.4 Resize Text, 1.4.12 Text Spacing; `visual-experience-audit.md` → fixed-px font fail |
| **D5** | `cursor:pointer` on span with no click handler — false affordance | `app/index.html` `.clickable-looking` span | `interactive-element-audit.md` → cursor:pointer no-handler probe (concrete check added in iter-17) |

## Why these 5

Whac-A-Mole tested:
- Response-shape contract mismatch (latent fetch bug)
- Modal opacity ≈ 0 (visual)
- Disabled-but-clickable button (state)
- Shared design-token cascade
- Whitespace-only label
- Phase-1 fixes that unmask phase-2 moles (entangled)

synth-2 tests **complementary code paths**:
- D1 covers a *different* modal failure mode (escape-trap, not opacity)
- D2 covers form semantics (different from disabled-button state)
- D3 covers the APCA worked-example shipped in iter-17
- D4 covers the fixed-px-font row in `visual-experience-audit` (untested in WAM)
- D5 covers the concrete cursor:pointer probe added to `interactive-element-audit` in iter-17

If the iter-17 reference edits were correct, D3 + D5 should be HIT confidently. D1, D2, D4 cover well-trodden checklists.

## Iron Rule

This synthetic is the **system under test**, not a test double. It's a real HTML page served by a real `http.server`. The audit skills run against it as they would against any live target.

Zero `*.test.*`, zero `*.spec.*`, zero mocks. The defects are intentional production-shape code, not stubs.
