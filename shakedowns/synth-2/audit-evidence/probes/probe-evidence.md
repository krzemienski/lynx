# Probe Evidence — synth-2 baseline

**Captured:** 2026-04-29 via `agent-browser` 0.26.0 against `http://localhost:8002/index.html`
**Visual artifact:** [`baseline.png`](./baseline.png) (34.3 KB)

## Visual confirmation (from screenshot)

The screenshot shows three sections — Sign up, Recent activity, Trapped modal demo. Specific elements visible above the fold:

- Two inputs in **Sign up** with placeholders "Email address" / "Password" and **no visible label text** above them — D2 visible
- "Connection failed. Retry below." in **red text on a light-green background, no icon** — D3 visible
- "Last sync 14:32 UTC. Cached for 60 seconds." in **very small gray text** — D4 visible
- "View detailed log" in **blue underlined text** that *looks* like a link — D5 visible (cursor change requires hover; computed style probe below)

## DOM probe output

Raw JSON returned by `agent-browser eval`:

```json
{
  "D1_modal": {
    "hasCloseButton": false,
    "hasCancelHandler": false
  },
  "D2_inputs": [
    {"type": "email",    "placeholder": "Email address", "hasLabel": false, "inLabel": false, "id": "(no id)"},
    {"type": "password", "placeholder": "Password",      "hasLabel": false, "inLabel": false, "id": "(no id)"}
  ],
  "D3_error": {
    "color":      "rgb(221, 51, 51)",
    "background": "rgb(207, 233, 201)",
    "text":       "Connection failed. Retry below.",
    "role":       null,
    "iconNearby": false
  },
  "D4_caption": {
    "fontSize":     "11px",
    "fontSizeUnit": "computed-px",
    "text":         "Last sync 14:32 UTC. Cached for 60 seconds."
  },
  "D5_clickable": {
    "cursor":  "pointer",
    "onclick": false,
    "hasHref": false,
    "role":    null,
    "text":    "View detailed log"
  }
}
```

> Note on D1's `hasCancelHandler: false`: the `cancel` listener is attached via `addEventListener` (verifiable in `app/index.html:81`) — this only inspects DOM-level `oncancel` and `data-cancel-handler`, both absent. The functional defect (Esc-trap via `preventDefault()`) is confirmed by source inspection. Probe shape matches `interactive-element-audit.md` cursor:pointer probe shape.

## Each defect, mapped to skill checklist row

| Defect | Probe field that confirms it | Skill ref row |
|---|---|---|
| D1 — modal trap | `D1_modal.hasCloseButton: false` + source `index.html:81-83` `cancel.preventDefault()` | `interactive-element-audit.md` → modal dismiss path; keyboard trap |
| D2 — unlabeled inputs | `D2_inputs[*].hasLabel: false`, `inLabel: false`, `id: (no id)` (×2) | `web-wcag-checklist.md` → 1.3.1, 3.3.2 |
| D3 — color-only error | `D3_error.role: null`, `iconNearby: false`, plus contrast pair `(221,51,51) on (207,233,201)` → APCA Lc ≈ 50, < 60 floor | `web-wcag-checklist.md` → 1.4.1; APCA worked-example match |
| D4 — fixed-px font | `D4_caption.fontSize: "11px"` (sub-12, fixed unit) | `web-wcag-checklist.md` → 1.4.4, 1.4.12; `visual-experience-audit.md` → fixed-px font fail |
| D5 — false affordance | `D5_clickable.cursor: pointer`, `onclick: false`, `hasHref: false`, `role: null` | `interactive-element-audit.md` → cursor:pointer no-handler probe (iter-17 concrete check) |

## APCA Lc calculation for D3

Foreground `#dd3333`, background `#cfe9c9`. Using APCA Lc table (iter-17 worked example reference):

- Y_fg ≈ 0.176 (relative luminance)
- Y_bg ≈ 0.794
- Lc magnitude ≈ ~50–55
- WCAG 2 contrast ratio ≈ 3.74:1 (computed from luminance pair) — fails AA 4.5:1 for normal text

**Verdict:** Lc < 60 floor → D3 fails APCA-augmented body text rule shipped in `ui-experience-audit/references/web-wcag-checklist.md`.
