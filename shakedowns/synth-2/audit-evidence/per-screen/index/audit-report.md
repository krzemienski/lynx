# Per-Screen Audit — `/index.html` (synth-2 baseline)

**Skill:** `ui-experience-audit`
**Target:** `http://localhost:8002/index.html`
**Mode:** drive-interaction
**Captured:** 2026-04-29 via `agent-browser` 0.26.0
**Screenshot:** [`audit-evidence/probes/baseline.png`](../../probes/baseline.png)

The 5-phase per-screen protocol from `ui-experience-audit/SKILL.md`, applied to the synth-2 baseline.

---

## Phase 1 — Triage (visual scan, pre-attentive saliency)

Visual outliers from the screenshot:

- **Red text on green-tinged background** (`.error-msg`) — pre-attentive pop-out (color-discordant) — flagged for Phase 2 contrast check
- **Caption below error msg is conspicuously small** — pre-attentive size-outlier — flagged for Phase 2 zoom check
- **Two raw input boxes with only placeholder text** — affordance ambiguity — flagged for Phase 4 content check
- **"View detailed log" looks link-shaped but isn't visually adjacent to a clear navigation target** — affordance ambiguity — flagged for Phase 3 interactive check

No layout-shift, no z-index conflict, no overflow visible above the fold.

## Phase 2 — Visual experience (contrast, hierarchy, spacing)

| Check | Outcome | Evidence |
|---|---|---|
| `.error-msg` foreground/background contrast | **FAIL** — `#dd3333` on `#cfe9c9`, APCA Lc ≈ 50–55 (< 60 body-text floor); WCAG 2 ratio 3.74:1 (< 4.5:1 AA) | probe `D3_error`; APCA worked-example match in `web-wcag-checklist.md` |
| `.caption` font-size | **FAIL** — `11px` fixed unit. Sub-12. Breaks at 200% zoom (the spec stop). Ignores user font-size preference. | probe `D4_caption.fontSize: "11px"`; `visual-experience-audit.md` fixed-px row |
| Spacing rhythm | Pass — sections have consistent vertical rhythm; padding 1.5rem matches across cards | screenshot |
| Type scale | Pass — h1 → h2 → body → caption forms clear hierarchy | screenshot |

## Phase 3 — Interactive elements

| Check | Outcome | Evidence |
|---|---|---|
| Modal dismissable (close button) | **FAIL** — no `[aria-label*=close]`, no `data-close`, no visible close button inside `<dialog>` | probe `D1_modal.hasCloseButton: false` |
| Modal dismissable (Esc key) | **FAIL** — `cancel` handler calls `preventDefault()` | source `app/index.html:81-83` |
| `cursor:pointer` no-handler probe (iter-17 row) | **FAIL** — `<span class="clickable-looking">` has cursor pointer + underline + blue color but `onclick: null`, `hasHref: false`, `role: null` | probe `D5_clickable` |
| Form input keyboard navigation | Pass — Tab order natural; both inputs reachable | manual probe (browser focus loop) |
| Submit button affordance | Pass — `<button type="submit">` with clear "Continue" label, blue primary style | screenshot + DOM |

## Phase 4 — Content quality

| Check | Outcome | Evidence |
|---|---|---|
| Form label association | **FAIL** — both inputs lack `<label>` (placeholder-only); screen reader announces "edit blank" for each | probe `D2_inputs[*]` |
| Error message clarity | Partial — text is clear ("Connection failed. Retry below.") but lacks `role="alert"`, lacks icon — relies on color alone for severity signal | probe `D3_error.role: null` |
| Heading hierarchy | Pass — h1 → h2 sequential, no skips | DOM |
| Link text quality | N/A on baseline — no real links present (D5 fake-link is non-functional) | probe |

## Phase 5 — UX heuristics (Nielsen 10)

| Heuristic | Outcome | Notes |
|---|---|---|
| H1 — Visibility of system status | Partial — error message present but degraded by D3 (low contrast, no icon) |
| H2 — Match real world | Pass |
| H3 — User control & freedom | **FAIL** — modal trap (D1) violates "always provide an exit" |
| H4 — Consistency & standards | **FAIL** — D5 violates "make it look the way it acts": underlined blue ≡ link, but isn't |
| H5 — Error prevention | Pass — form has type="email"/"password" |
| H6 — Recognition vs recall | **FAIL** — D2 (placeholder-only labels) — placeholder disappears on focus, forces user to remember field purpose |
| H7 — Flexibility & efficiency | N/A — single-screen synthetic |
| H8 — Aesthetic & minimalist | Pass — no clutter |
| H9 — Help users recognize/recover from errors | **FAIL** — D3 (color-only error) leaves color-blind users with no error signal |
| H10 — Help & documentation | N/A — no tooltips or help present, none required at this scope |

## Per-screen verdict

5 distinct defects detected. 4 are critical-high (D1, D2, D3, D5). 1 is medium (D4). The screen fails at threshold `critical-high` until cycle-1 fix-loop (which the full skill dispatches).

This per-screen output is what the full skill consumes as its phase-1 input for the audit-and-remediate loop.
