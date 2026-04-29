# Cycle 1 Findings — synth-2

**Cycle 1 of 3** (cap=3) — initial audit against unmodified baseline.

**Input artifact:** `app/index.html` (baseline)
**Screenshot:** [`audit-evidence/probes/baseline.png`](../../probes/baseline.png)
**Probes:** [`audit-evidence/probes/probe-evidence.md`](../../probes/probe-evidence.md)

## Defects detected

| ID | Severity | Defect | Citation |
|---|---|---|---|
| C1-D1 | **HIGH** | Modal trap — no close button + Esc handler `preventDefault()`. Keyboard-only users cannot dismiss; refresh required. | `app/index.html:60-68` (dialog markup), `app/index.html:81-83` (`cancel` preventDefault) |
| C1-D2 | **HIGH** | Two `<input>` elements without `<label for>` — placeholder is the only visible cue. Screen reader announces "edit blank". | `app/index.html:46-47` (form inputs) |
| C1-D3 | **HIGH** | `.error-msg` foreground `#dd3333` on background `#cfe9c9` — APCA Lc ≈ 50–55 (< 60 body-text floor). WCAG 2 ratio 3.74:1 (< 4.5:1 AA). Color is the only error signal — no icon, no `role="alert"`. | `app/index.html:23-29` (CSS), `app/index.html:54` (markup) |
| C1-D4 | **MEDIUM** | `.caption` font-size fixed at `11px` — breaks at 200% zoom + ignores user font-size preference. | `app/index.html:31-34` (CSS), `app/index.html:55` (markup) |
| C1-D5 | **HIGH** | `<span class="clickable-looking">` has `cursor: pointer` + blue underlined styling but no click handler, no `href`, no `role="button"`. False affordance — cursor lies. | `app/index.html:36-40` (CSS), `app/index.html:56` (markup) |

## Critical-high count

**4 critical-high** (C1-D1, C1-D2, C1-D3, C1-D5) + 1 medium (C1-D4).

Critical-high > 0 → audit does not converge at cycle 1. Proceeding to fix-loop.

## Fix-loop output (between cycle 1 and cycle 2)

Patches applied to a working copy `app/index-after-fixes.html`:

| Defect | Fix |
|---|---|
| C1-D1 | Add `<button type="button" id="close-trap">Close</button>` inside dialog; remove `cancel.preventDefault()`; wire close button to `dlg.close()`. |
| C1-D2 | Wrap each input in `<label>Email <input ...></label>` (or add `id` + `<label for>`). |
| C1-D3 | Change `.error-msg` color to `#a01818` (darker red, Lc ≥ 60); add `role="alert"`; prefix text with `⚠ ` icon. |
| C1-D5 | Replace `<span class="clickable-looking">` with `<a href="/log">View detailed log</a>` (real link semantics). |

C1-D4 left as-is — medium severity, below critical-high threshold; flagged for follow-up but does not block convergence.

Re-audit input: `app/index-after-fixes.html` → cycle 2.
