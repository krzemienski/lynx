# Cycle 2 Findings — synth-2

**Cycle 2 of 3** (cap=3) — re-audit after cycle-1 fix-loop applied to D1, D2, D3, D5.

**Input artifact:** `app/index-after-fixes.html`
**Screenshot:** [`audit-evidence/probes/after-fixes.png`](../../probes/after-fixes.png)
**Probes:** raw JSON inline below

## Re-probe output

Captured live via `agent-browser eval` against `http://localhost:8002/index-after-fixes.html`:

```json
{
  "D1_modal": {
    "hasCloseButton": true,
    "hasCancelHandler": false
  },
  "D2_inputs": [
    {"type": "email",    "hasLabel": true,  "inLabel": true,  "id": "signup-email"},
    {"type": "password", "hasLabel": true,  "inLabel": true,  "id": "signup-password"}
  ],
  "D3_error": {
    "color":      "rgb(160, 24, 24)",
    "background": "rgb(255, 245, 245)",
    "text":       "⚠ Connection failed. Retry below.",
    "role":       "alert"
  },
  "D4_caption": {"fontSize": "11px"},
  "D5": {
    "ghostSpanGone": true,
    "realLink": {"href": "/log", "text": "View detailed log"}
  }
}
```

## Per-defect verdict

| ID | Status | Verdict | Citation |
|---|---|---|---|
| C1-D1 | **RESOLVED** | Modal has explicit close button (`#close-trap`), `cancel.preventDefault()` removed. Esc dismisses normally. | probe `D1_modal.hasCloseButton: true`; `app/index-after-fixes.html:88-90, 100-102` |
| C1-D2 | **RESOLVED** | Both inputs wrapped in `<label>` with `for` association + visible label text. Probe shows `hasLabel: true, inLabel: true` for both. | probe `D2_inputs[*]`; `app/index-after-fixes.html:64-69` |
| C1-D3 | **RESOLVED** | Color changed `#dd3333 → #a01818` on `#fff5f5`. APCA Lc now ~70 (passes ≥ 60 floor). `role="alert"` added. ⚠ icon prefix added — color no longer the only signal. | probe `D3_error`; `app/index-after-fixes.html:25-31, 75` |
| C1-D4 | **UNCHANGED** | Still 11px fixed — left intentional per cycle-1 fix-loop scope (medium severity, below critical-high threshold). | probe `D4_caption.fontSize: "11px"`; `app/index-after-fixes.html:34-37` |
| C1-D5 | **RESOLVED** | `<span class="clickable-looking">` removed. Replaced with `<a class="detail-link" href="/log">` — real link semantics, real focusable element, real navigation target. | probe `D5.ghostSpanGone: true, D5.realLink.href: "/log"`; `app/index-after-fixes.html:77` |

## Critical-high count

**0 critical-high** + 1 medium (D4 unchanged).

Critical-high = 0 → audit converges at cycle 2. **PASS** at threshold critical-high.

D4 logged for follow-up but does not block ship.
