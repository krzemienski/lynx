# Visual Experience Audit — Depth Protocol

The Phase 2 visual depth playbook. The universal 8-item visual checklist
in `ui-experience-audit` catches the obvious — overlapping text, contrast,
spacing, viewport overflow. This file catches what a senior designer
would catch on the second pass and a one-page checklist would never
surface: state coverage, design-system drift, regression, motion quality,
and the rendering details that make an app *feel* finished.

Read this on Phase 2 of the very first cycle. Skim it on later cycles
unless a specific dimension came back open.

## Why this matters (the framing)

A screenshot is one visual moment. The visual *experience* is many
moments — every state of every element on every screen, the consistency
of those states across screens, the continuity from screen to screen,
and the quality of the transitions between. Auditing visuals well means
systematically reaching all of those moments and looking at them with
intent. Most auditing tools produce a single capture per screen and call
it done; this protocol pushes the audit to where the bugs actually live.

## The visual experience taxonomy (what to audit)

### Per interactive element — 5+ visual states

For every button, link, field, toggle, card-as-tap-target, and gesture
area in the inventory, audit ALL of these states:

| State | Trigger | What you're checking |
|-------|---------|----------------------|
| **default** | rest | the resting visual signal — does it look interactive? |
| **hover** | mouse over (web) | does *something* visually change? subtle is fine; invisible is not |
| **focus** | tab key (always) | is the focus ring visible? at sufficient contrast against the background it lands on? |
| **active** | mid-press | does the press register visually? (depressed, color shift, scale, etc.) |
| **disabled** | unavailable | distinguishable from default but not invisible (≥3:1 still applies) |
| **loading** | async in flight | does the user know to wait? spinner, skeleton, progress, disabled+pulse, or just frozen? |
| **success** | post-success | confirmation visible; doesn't disappear before user can read it |
| **error** | post-error | error visible *near* the element that caused it, not in a banner the user has to scan to find |

A button with `:hover` invisible from `:default`, no `:focus` ring, and
identical `:active` is technically working code with a broken visual
experience. This is the most common HIGH finding the depth audit catches.

### Per screen — 6 state variants

For every screen in the inventory, audit each variant the screen can
exhibit:

| Variant | Typical cause | Visual checklist |
|---------|---------------|------------------|
| **empty** | no data yet (new user, cleared filters) | meaningful empty state? CTA toward first action? not just blank? |
| **loading** | data in flight | skeleton matches eventual content shape? spinner placement makes sense? layout doesn't jank when data arrives? |
| **populated** | typical data | normal flow; the screen the designer probably designed |
| **overflow** | huge data, long names, wide tables | does anything truncate without ellipsis? horizontal-scroll trap? text wrap into ugly L-shapes? |
| **error** | API/network failure | error visible? recovery action provided? user knows what happened? |
| **first-launch** | new user, never seen this | onboarding clarity? CTA to populate? doesn't dump user into empty state with no guidance? |

The audit "passes" each screen ONLY when each applicable variant has
been visited and captured. Skipping variants because "the happy path
looks fine" is the #1 source of post-ship visual bugs.

### Per mode — light / dark / motion / contrast

| Mode | When to audit |
|------|---------------|
| **light** | always (the baseline) |
| **dark** | if the app supports dark mode (per `run-config.md` coverage axes) |
| **reduced-motion** | if the app has motion (most apps do — at least loading spinners) |
| **high-contrast** | if the platform/OS supports it AND the app is positioned for accessibility-conscious users |

`prefers-reduced-motion` is often un-implemented; capture by setting it
and confirming animations are minimized or removed. Capture is real
evidence because the "minimized" version is itself a designed state, not
a bug.

### Contrast — measuring against the right yardstick

Two algorithms are in active use; pick the right one for the context:

**WCAG 2.x ratio (4.5:1 / 3:1)** — the legal-compliance baseline. Use it
for everything that has a regulatory requirement. Known weaknesses:
treats contrast as static regardless of font weight/size, badly mismodels
dark-mode pairs (4.5:1 on dark backgrounds is often functionally
unreadable; the algorithm overstates contrast at low luminances).

**APCA (Lightness Contrast / `Lc`)** — the WCAG 3 candidate, perceptually
calibrated. Use it as a *second* check, especially for dark mode, and
specifically for non-text contrast where WCAG 2.x is known to fail. APCA
thresholds (reference font Helvetica/Arial):

| Lc threshold | Use case |
|--------------|----------|
| **Lc 90** | preferred for fluent body text (≥14px @400 weight or ≥18px @300) |
| **Lc 75** | minimum for body text (≥18px @400, ≥16px @500, ≥14px @700) |
| **Lc 60** | minimum for large non-body text (≥24px @400) |
| **Lc 45** | minimum for large bold (≥36px bold) |
| **Lc 30** | minimum for icon strokes / borders / non-text UI elements |
| **Lc 15** | invisibility threshold — below this, content is unreadable for many users |

When a pair passes WCAG 2.x AA but fails APCA Lc 75, that's almost
always a dark-mode pair; flag it as MEDIUM with a note "perceptually
substandard despite WCAG compliance — consider APCA alongside."

**Tools that compute both** (use whichever is on hand):
- `axe DevTools` browser extension — flags WCAG failures with cited rules
- `Lighthouse` accessibility audit — bundled with Chrome DevTools
- `WAVE` (WebAIM) — visual annotation of issues on the page
- Atmos contrast checker — paste foreground/background, get both values
- `@weable/a11y-color-utils` — programmatic API for both algorithms
- `pa11y` CLI — automatable in CI

### Cross-screen — design-system integrity

After per-screen audits, do a dedicated comparison pass:

| Dimension | Question | How to detect |
|-----------|----------|---------------|
| Color tokens | Are "primary", "background", "text" the same hex everywhere? | grep / diff a sample of computed colors across screen captures |
| Type scale | Same H1 size on every screen? Same body line-height? | Pull computed font-size + line-height per screen via DevTools or via grep on CSS |
| Component shape | Same corner radius on cards? Same shadow on modals? | Visual scan of cropped components side-by-side |
| Spacing rhythm | Same gap between hero and content on every screen? | Measure baseline grid adherence via overlay |
| Iconography | Same stroke weight, same set, same scale? | Pull all icons used onto a single contact-sheet canvas |
| Nav continuity | Active-state treatment identical across nav items? Breadcrumb visible where expected? | Side-by-side of two nav-active screens |
| Modal/sheet style | Same animation, same backdrop, same dismiss affordance across modals? Backdrop opacity ≥ 0.3 (Nielsen #1 — visibility of system status; backdrops at 0.1 silently fail to communicate "you are in a modal"). | Open multiple modals; `agent-browser eval "getComputedStyle(document.querySelector('.modal-backdrop, [data-modal-backdrop]')).backgroundColor"` per modal — confirm the alpha channel ≥ 0.3 |

Token / scale / shape drift across screens is what makes apps feel
"assembled" rather than "designed." It's also a predictor of fragility:
an app with 4 near-blue primaries usually has 4 sets of dependent
components downstream of each.

### Shared-token cascade — predict cycle-2 unmasks before applying cycle-1 fixes

Before applying any color/spacing/sizing fix, run the cascade audit:

```bash
# 1. List every CSS custom property used by selectors involved in the fix
grep -n "var(--color-X)" /path/to/styles.css

# 2. Group consumers by VISUAL ROLE (caption, badge, heading, nav-active, etc.)
#    NOT by selector name — selectors lie about role; visual usage doesn't.

# 3. Predict: any consumer whose role is DIFFERENT from the role that motivated the fix
#    is a probable cycle-2 unmask. Split the token first; THEN change the value.
```

iter-16 finding F-1D (caption-muted #777 fails APCA on #222) shared `--color-text-muted` with `.badge.verified` text. Fixing F-1D by lightening the token would have unmasked F-2D-latent (badge text on success-green) in cycle 2 — and the source comment at `styles.css:44-49` of the iter-8 fixture cites the round-3D substandard outcome. The cascade audit catches this BEFORE the fix lands, allowing the cycle-1 plan to ship a token split alongside the value change.

This pattern generalizes beyond color tokens — any CSS custom property used across more than one visual role is a cascade-fragile dependency. Shadow tokens, spacing tokens, radius tokens, and z-index ladders all show the same pathology.

### Cross-cycle — regression diff

After Phase 4 fixes in cycle N, before Phase 2 in cycle N+1: compare
each screen's current capture against its baseline (or against the
prior-cycle capture). Anything visually different that wasn't part of
the fix's intended scope is a finding.

`agent-browser diff screenshot --baseline cycle-01/.../screen.png` is
the canonical command. iOS uses `compare` from ImageMagick or a similar
pixel-diff. Differences less than ~1% of pixels can be noise (font
rendering jitter, sub-pixel anti-aliasing); larger differences need
explanation.

## Multi-state capture protocol

For each element in the cycle's inventory:

1. Navigate to the screen
2. Snapshot to get the element's reference (`agent-browser snapshot -i`)
3. Capture default state
4. Hover (web): `agent-browser hover @eN` then screenshot
5. Focus: `agent-browser focus @eN` then screenshot — watch for invisible focus ring
6. Active: there is no perfect way to capture mid-press programmatically;
   inspect the `:active` CSS rules statically and confirm something
   non-trivial is set
7. Disabled: if the element has a disabled state in the codebase, force
   it (toggle a feature flag, mock a precondition, or capture a
   different instance of the same element type that is in disabled
   state on another screen)
8. Loading / success / error: trigger via state-forcing recipes (next
   section)

Save each capture with descriptive names:
`<screen>-<element-id>-<state>.png` — e.g.,
`dashboard-save-btn-default.png`, `dashboard-save-btn-hover.png`,
`dashboard-save-btn-focus.png`. The lead reads each in turn.

In degraded mode (no `agent-browser`), substitute static-analysis: read
the CSS for `:hover`, `:focus`, `:active`, `:disabled`, and
`@media (prefers-reduced-motion)` rules. Missing rules ARE findings.
Specifically:

- No `:focus` rule on a tappable element → HIGH finding
- `:hover` rule that only changes `cursor:` (no visible feedback) → MEDIUM
- `:active` rule absent or identical to default → LOW (but compounds)
- No `prefers-reduced-motion` query and the app has animations → MEDIUM

## State-forcing recipes (the practical part)

You can't audit empty / loading / error states without a way to make
them appear. These recipes are what the audit actually does to reach
each state.

### Web (with `agent-browser`)

#### Empty state

```bash
# Option A: clear local storage to reset to first-run
agent-browser eval "localStorage.clear(); sessionStorage.clear()"
agent-browser reload

# Option B: use a fresh browser profile / session
agent-browser --session-name fresh-empty open <url>

# Option C: stub the API to return empty arrays (override fetch in-page)
agent-browser eval --stdin <<'EVALEOF'
window.fetch = (orig => async (url, opts) => {
  if (url.includes('/api/sessions')) return new Response('{"items":[]}', {headers:{'content-type':'application/json'}});
  return orig(url, opts);
})(window.fetch);
EVALEOF
agent-browser reload   # let the page re-fetch
```

Option C is preferred when the empty state is hard to reach via real
data manipulation — it doesn't touch the backend.

##### Timing note — mount-time vs page-load fetches

The Option C eval-injected `window.fetch` override only catches fetches
that fire AFTER the eval lands. That works for **mount-time fetches**
(react-query / SWR / TanStack Query, `useEffect`) — they fire after the
React tree mounts, which is after a post-`reload` eval can land. It
does NOT work for **page-load synchronous fetches** (inline
`<script>fetch()</script>`, top-level `await`): those fire BEFORE the
eval. The override is in place but the original fetch already went out,
so the audit will silently see the populated state instead of the empty
state.

Pick the recipe that matches the fixture's fetch timing:

- **Recipe A — mount-time fetches**: the `localStorage.clear() + reload`
  → post-reload `eval "window.fetch = ..."` sequence above is correct.
  The next mount-time fetch hits the override.

- **Recipe B — page-load synchronous fetches**: the post-load eval is
  too late. Use one of:
  - `agent-browser open --eval-on-new-document "window.fetch = ..."` if
    available — this lands BEFORE any page script runs.
  - Connect via CDP and call `Page.addScriptToEvaluateOnNewDocument`
    directly.
  - Block at the network layer instead:
    `agent-browser route '**/data.json' --status 503` — bypasses the
    timing problem entirely.

If neither path is available for a given fixture, the audit cannot
verify the empty/loading state for it; record the gap under
`audit-evidence/cycle-NN/known-coverage-gaps.md` and continue.

#### Loading state

```bash
# DevTools Slow 3G via agent-browser's network-throttle
agent-browser network slow-3g
# Capture during the load — race the screenshot
agent-browser open <url> & sleep 0.3; agent-browser screenshot loading.png; wait

# OR: inject a delay into fetch
agent-browser eval --stdin <<'EVALEOF'
window.fetch = (orig => async (...args) => {
  await new Promise(r => setTimeout(r, 5000));
  return orig(...args);
})(window.fetch);
EVALEOF
agent-browser reload
sleep 1   # capture mid-loading
agent-browser screenshot loading.png
```

#### Error state

```bash
# Force fetches to return 500
agent-browser eval --stdin <<'EVALEOF'
window.fetch = async () => new Response('{"error":"forced"}', {status: 500, headers:{'content-type':'application/json'}});
EVALEOF
agent-browser reload
agent-browser screenshot error.png
```

#### Overflow state

Two paths: seed real data, or substitute long strings.

```bash
# String substitution via DOM manipulation
agent-browser eval --stdin <<'EVALEOF'
document.querySelectorAll('.item-title').forEach(el => {
  el.textContent = 'a'.repeat(200);
});
EVALEOF
agent-browser screenshot overflow.png

# Or: drive the form fields with very long input
agent-browser fill @e1 "$(python3 -c 'print("a"*500)')"
```

#### First-launch state

```bash
# Fresh profile + cleared storage
agent-browser close
agent-browser --session-name first-launch open <url>
agent-browser eval "localStorage.clear(); sessionStorage.clear(); document.cookie.split(';').forEach(c => document.cookie = c.split('=')[0].trim()+'=;expires=Thu, 01 Jan 1970 00:00:00 GMT')"
agent-browser reload
agent-browser screenshot first-launch.png
```

### iOS (with `xcrun simctl`)

#### Empty state

```bash
# Fresh install wipes app sandbox
xcrun simctl uninstall "$UDID" "$BUNDLE_ID"
xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"
sleep 3
xcrun simctl io "$UDID" screenshot empty.png
```

#### Loading state

```bash
# Use simctl's network conditioner if your sim supports it (iOS 17+)
# Or rely on a backend with deliberate delay
# Or screenshot quickly after launch before data load completes
sleep 0.5   # not 3 — capture mid-load
xcrun simctl io "$UDID" screenshot loading.png
```

#### Error state

```bash
# Stop the backend before launch — app shows error UI
pkill -f <backend-process>
xcrun simctl launch "$UDID" "$BUNDLE_ID"
sleep 3
xcrun simctl io "$UDID" screenshot error.png
# Restart backend before next test
```

#### Overflow state

```bash
# Seed UserDefaults / Core Data / SwiftData with long strings
# Or use a dev-mode build flag your app honors

# Quick approach: launch with overflow seed args (if app supports them)
xcrun simctl launch "$UDID" "$BUNDLE_ID" --seed-overflow
```

#### First-launch state

```bash
# Heavyweight: erase the entire simulator
xcrun simctl shutdown "$UDID"
xcrun simctl erase "$UDID"
xcrun simctl boot "$UDID"
sleep 5
# Then re-do all of Phase 0 setup (status bar, install, etc.)

# Lightweight: just uninstall + install (data wipe but device prefs preserved)
xcrun simctl uninstall "$UDID" "$BUNDLE_ID"
xcrun simctl install "$UDID" "$APP_PATH"
```

## Static-analysis visual playbook (degraded mode)

When `agent-browser` isn't available, visuals are still auditable via
source. The grep patterns that catch the most common visual bugs:

| Bug class | grep pattern | Why |
|-----------|--------------|-----|
| Hardcoded near-white text on white | `color:\s*#[bcd][bcd0-9a-f]{4,5}` (light grays) | < AA contrast almost always |
| Hardcoded color literals (drift risk) | `(#[0-9a-fA-F]{3,8}\|rgb\(\|rgba\()` outside a tokens file | each one is a maintenance liability and a drift opportunity |
| Inline styles | `style=` in JSX/HTML | inline styles bypass the design system; usually a smell |
| `cursor: pointer` without `onClick` / `:focus` | `cursor:\s*pointer` then check the same selector for handlers | false-affordance generator |
| Missing `:focus` rules on interactive elements | grep selector lists for `button`, `a`, `[role="button"]`, etc., then check `:focus` rule presence | invisible focus = WCAG fail |
| `:hover` rule that doesn't change a visual property | `:hover` blocks containing only `cursor:` | "hovering" without feedback |
| No `@media (prefers-reduced-motion)` | absence of that query in stylesheet | accessibility miss |
| Hardcoded font sizes below 14px | `font-size:\s*(?:1[0-3]px\|0\.[5-8]\d*rem)` | usually a typography mistake |
| Mixed icon libraries | imports from multiple icon packages in same file | iconography inconsistency |
| Unscoped global `!important` | `!important` outside a reset/print stylesheet | a fix that breaks something else |
| Z-index hardcodes | `z-index:\s*(9999\|999\|9)` | layering free-for-all |
| Px values not on 4pt/8pt grid | `(margin\|padding\|gap):\s*(?:[1357]\|[1-9]\d?)px` (odd values) | grid drift |

Run these greps once per cycle's Phase 1 — they often precede the
per-screen captures and pre-flag findings to verify in Phase 2.

## Visual evidence quality standards

A capture is "good" evidence when:

- [ ] **Whole-viewport** or clearly cropped. Cropped captures need a
      caption stating what was excluded
- [ ] **Native resolution** — no downscaling, no DPR confusion
- [ ] **Status bar normalized** (iOS: 9:41, full battery; web: no irrelevant
      browser chrome unless that's part of the audit)
- [ ] **Correct mode** — light/dark explicitly, not "whichever happened
      to load"
- [ ] **State labeled in filename** — `default`/`hover`/`focus`/`error`/etc.
- [ ] **Pre-action AND post-action** for any interaction (matched pair)
- [ ] **Animations and transitions disabled or settled** — pre-capture
      injection of `* { animation: none !important; transition: none !important }`
      OR a wait long enough for everything to land. The visual-regression
      community standardizes on the disable-CSS approach because it
      produces reproducible captures across runs (the same `wait 3000`
      can capture mid-animation depending on machine load).
- [ ] **Fonts and images settled** — wait `networkidle` AND verify
      `document.fonts.ready` before capture. A capture mid-FOUT looks
      different every run.
- [ ] **No accidental personal data** — redact emails, usernames, real
      faces, real card numbers before sharing or storing
- [ ] **Filename follows the convention** —
      `<cycle>/<screen>-<element-or-state>-<extra>.png`

A capture failing one or more of these is still useful but should be
flagged in the cycle report so the next cycle re-captures cleanly.

### A visual capture is an assertion, not a screenshot

Borrowed from the visual-regression-testing community (Chromatic,
Percy, Storybook): every capture this skill produces is, conceptually,
*a deterministic assertion that this component in this state looks
like this baseline*. The implications:

- **Same input → same output** is the goal. Disable animations.
  Stub network responses (or wait deterministically). Use a fixed
  viewport. Use a fixed font-loading state.
- **Diff against a baseline, not "did the screen look right today"**.
  Cycle 1 establishes baselines; cycles 2+ diff against them.
- **Interaction-driven captures need a stabilization step**. Click
  → wait `networkidle` → capture. Skipping the wait turns the
  assertion into a coin-flip.

If the target project already uses Storybook, prefer driving captures
through stories with play functions — they're already isolated,
already deterministic, and already enumerate state combinations:

```javascript
// Example play function — drives the component to focus state
export const FocusedState = {
  args: { ...DefaultArgs },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
  }
};
```

When Storybook exists in the target project, Phase 2 should capture
from stories rather than the live app — faster, more deterministic,
and the captures double as VRT baselines for the team's CI.

## Refactoring UI tactical heuristics

A short opinionated checklist drawn from Wathan & Schoger's
*Refactoring UI* — these catch what the contrast-and-touch-target
checklist misses by category, the "looks fine but feels off"
findings:

| Tactic | What to look for | Example bug |
|--------|------------------|-------------|
| **Whitespace as structure** | Generous padding around primary content; tight padding around secondary | Cards crammed against parent edges; CTAs glued to text |
| **Limit the palette** | Count distinct colors used in computed styles; ≤ 1 primary + 1 accent + 5-7 grays + semantic (success/warn/error) | "We have 4 different blues" bug |
| **Build hierarchy with size + color, not just font-weight** | Headings should be larger AND a different color (or muted body) — both signals working together | All-bold paragraphs that don't actually create hierarchy |
| **Visual weight ≠ font-weight** | Use color (muted text) to demote; use size to promote | Page where everything is `font-weight: 500` |
| **Shadows as a system, tied to elevation** | All raised cards share one shadow recipe; modals deeper; nothing custom-per-component | Shadows that vary by spec rather than by elevation |
| **Type scale, not type values** | Headings/body/caption land on a 5-7 size scale used everywhere | One H2 is 24px, another is 22px (eyeballed) |
| **Consistent border radius** | One radius for cards, one for buttons, one for chips — don't mix | Three near-identical radii (4/6/8) |
| **Colored grays** | Brand-tinted neutrals (cool grays for blue brand, warm for orange) feel intentional | Pure `#888` next to a saturated brand color |
| **Right-size the icons** | Icons match adjacent text weight; not too large in dense lists, not too small in CTAs | Tiny icons in big buttons; oversize in tight rows |
| **Dim non-essential text instead of removing it** | Demote with color (slate-500), keep affordance | Removed labels that should still be visible |

## Iconography consistency

Iconography drift is a top signal of "this app was assembled from many
sources." Audit per cycle:

| Check | Pattern |
|-------|---------|
| One icon set per app | Mix of `lucide` + `heroicons` + custom SVG = HIGH finding |
| Consistent stroke width within a visual layer | Outline icons should all be 1.5px or all 2px |
| One filled-vs-outlined choice per hierarchy level | Mixing filled and outlined at same level is jarring |
| Icon sizes from a token scale (`icon-sm: 16` etc.) | Random `width: 18`, `width: 22` is a smell |
| Icons aligned to text baseline | A 20px icon next to 16px text needs a slight `translateY` |
| Icon meaning matches platform convention | Gear=settings, trash=delete — don't reinvent |

Per cycle: paste every distinct icon used into a single contact-sheet
row. Style/weight/size mismatches are visible in seconds.

## Performance / responsiveness as part of experience

The audit doesn't profile performance, but five rules from Apple HIG /
Material Design responsiveness specs are part of "experience" and
worth flagging:

| Rule | Source | How to check |
|------|--------|--------------|
| Tap feedback within 100ms | Apple HIG | Pre-render the active state in CSS, not via JS |
| Input latency < 100ms | Material Design | DevTools Performance; "feels laggy" is a signal |
| Per-frame work < 16ms (60fps) | Browser default | DevTools Performance; jank during scroll |
| Reserve space for async content (no CLS) | Core Web Vitals | DevTools > Web Vitals; visual jump on load |
| Skeleton/shimmer over spinner for >1s waits | Apple HIG / Material | Search source for `<Spinner>` used during slow loads |
| Virtualize lists > 50 items | Material / general | Search for `<FlatList>` / `react-window` / `react-virtual` |
| Lazy-load below-the-fold images | Performance | Search for `loading="lazy"` |

LOW-MEDIUM severity unless the experience is broken (then HIGH). Phase 3
often surfaces these incidentally — a screen that takes 4 seconds to
render and shows a generic spinner the whole time is a recordable
finding even if technically "everything works."

## Accessible-widget patterns (ARIA APG reference)

Custom interactive widgets (anything that isn't a native `<button>`,
`<input>`, etc.) have expected keyboard and ARIA-state behaviors. The
W3C ARIA Authoring Practices Guide (APG) is the canonical source. When
the audit finds a custom widget, check it against the corresponding
APG pattern:

| Widget | APG pattern | Required keyboard | Required ARIA |
|--------|-------------|-------------------|---------------|
| Dialog/Modal | dialog | Esc closes, focus trap, return focus on close | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Tabs | tabs | ←→ navigates, Home/End to ends, Enter/Space activates | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` |
| Combobox / autocomplete | combobox | ↓ opens, ↑↓ navigates, Esc clears/closes | `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` |
| Menu / dropdown | menu, menubar | ↓↑ navigates, Esc closes, Enter activates | `role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded` |
| Slider | slider | ←→ adjusts, PgUp/PgDn larger steps, Home/End ends | `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |
| Tree | tree | ↓↑ navigates, →← expands/collapses, Enter activates | `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-level` |
| Listbox | listbox | ↓↑ navigates, Enter activates, Type-ahead | `role="listbox"`, `role="option"`, `aria-selected` |
| Disclosure / Accordion | disclosure | Enter/Space toggles | `aria-expanded`, `aria-controls` |

Findings: a custom widget that *looks* like a tab strip but lacks
`role="tablist"` + `aria-selected` keyboard navigation is a HIGH
finding (assistive-tech-invisible). The APG also documents test cases
per pattern (`https://www.w3.org/WAI/ARIA/apg/patterns/`) — link to
the relevant pattern in findings.json's `evidence_paths` so the
fixer agent has the spec.

## Cross-screen consistency audit (one pass per cycle)

After per-screen audits complete, run this dedicated pass. It runs in
**~5–15 minutes for a 10-screen app** when done mechanically — far below
the 20–30 min the eyeball version cost. Findings here are usually CRITICAL
or HIGH because design-system drift is expensive to fix later.

The pass is six mechanical steps. Each step writes structured output to
`audit-evidence/cycle-NN/cross-screen/` and emits findings to the cycle's
`findings.json` automatically when drift exceeds the per-step threshold.

### Step 1 — Computed-style fingerprint per representative selector

For each screen in the inventory, navigate via `agent-browser` and extract
computed styles for a fixed selector list. The selector list is tuned to
catch the most common token-drift surfaces — but apps with non-standard
CSS conventions can supply project-specific overrides via
`cross-screen-selectors.json` at the project root.

#### Per-project override file (optional)

If `cross-screen-selectors.json` exists at the project root, the audit
merges it with the built-in defaults (project keys win on collision).
Use this when the app's selectors don't match the defaults — for example,
a Tailwind-heavy codebase where buttons are `.bg-blue-600` instead of
`.btn-primary`, or a custom design system that prefixes everything.

```jsonc
// cross-screen-selectors.json — project root
{
  "selectors": {
    "primary_btn":   "button[class*='bg-blue-600'], .Button--primary",
    "card":          ".Card, [data-component='Card']",
    "h1":            ".PageTitle h1",
    "custom_chip":   ".Chip"
  },
  "props_extra": [
    "letter-spacing", "text-transform"
  ]
}
```

The merge happens at bash level before the JS heredoc runs; agent-browser
sees only the merged map. New selectors (`custom_chip` above) get added
to the fingerprint; existing keys (`primary_btn`) get replaced with the
project's value.

#### Run

```bash
mkdir -p audit-evidence/cycle-NN/cross-screen

# Load project override if present (returns "{}" if absent)
PROJECT_OVERRIDE=$(cat cross-screen-selectors.json 2>/dev/null || echo '{}')

SCREENS=$(jq -r '.[] | select(.priority == "P0" or .priority == "P1") | .id' \
  audit-evidence/cycle-NN/inventory.json 2>/dev/null \
  || awk '/^\| S[0-9]+/ {print $2}' audit-evidence/cycle-NN/inventory.md)

for screen_id in $SCREENS; do
  url=$(awk -v id="$screen_id" '$0 ~ id {print $4; exit}' \
    audit-evidence/cycle-NN/inventory.md)

  agent-browser open "$BASE_URL$url"
  agent-browser wait --load networkidle

  # Inject the override JSON into the JS heredoc as a global the eval script reads
  agent-browser eval --stdin > "audit-evidence/cycle-NN/cross-screen/$screen_id.styles.json" <<EVALEOF
const PROJECT_OVERRIDE = ${PROJECT_OVERRIDE};

const DEFAULT_SELECTORS = {
  body:           'body',
  primary_btn:    'button.primary, button[data-variant="primary"], .btn-primary, [data-button-primary]',
  secondary_btn:  'button.secondary, button[data-variant="secondary"], .btn-secondary',
  card:           '.card, [data-card], article.card',
  modal:          '.modal, [role="dialog"], dialog',
  modal_backdrop: '.modal-backdrop, .overlay, [data-modal-backdrop]',
  nav_link_active:'nav a[aria-current="page"], nav .active, nav [data-active]',
  nav_link_idle:  'nav a:not([aria-current])',
  h1:             'h1',
  h2:             'h2',
  body_text:      'p, .body, [data-body]',
  caption:        'small, .caption, [data-caption]',
  link:           'a:not([role="button"])',
  input:          'input[type="text"], input[type="email"], input:not([type])',
  shadow_card:    '.card, [data-card]',
  shadow_modal:   '.modal, [role="dialog"]',
};

// Merge: project keys win; new project keys are added.
const SELECTORS = { ...DEFAULT_SELECTORS, ...(PROJECT_OVERRIDE.selectors || {}) };

const DEFAULT_PROPS = [
  'color', 'background-color', 'border-color', 'border-radius', 'border-width',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'padding', 'margin', 'box-shadow', 'opacity', 'cursor',
];
const PROPS = [...new Set([...DEFAULT_PROPS, ...(PROJECT_OVERRIDE.props_extra || [])])];

const result = {};
for (const [name, sel] of Object.entries(SELECTORS)) {
  const el = document.querySelector(sel);
  if (!el) { result[name] = null; continue; }
  const cs = getComputedStyle(el);
  result[name] = {};
  for (const p of PROPS) result[name][p] = cs.getPropertyValue(p);
}
JSON.stringify(result, null, 2);
EVALEOF
done

ls -la audit-evidence/cycle-NN/cross-screen/*.styles.json
```

Note: the heredoc terminator changed from `<<'EVALEOF'` (literal — no
shell expansion) to `<<EVALEOF` (expansion enabled — `${PROJECT_OVERRIDE}`
is interpolated by bash before being sent to `agent-browser eval`). The
JSON-from-disk path is shell-safe because `cat` returns valid JSON or
`{}` and there's no further string concatenation. If you want extra
defense, validate first with `jq` and refuse to proceed on parse error:

```bash
PROJECT_OVERRIDE=$(jq -c . cross-screen-selectors.json 2>/dev/null || echo '{}')
```

The output is one JSON file per screen, structured as
`{ "<selector_name>": { "<css_prop>": "<value>", ... }, ... }`. Project-
override entries (e.g. `custom_chip`) appear as top-level keys alongside
the defaults; the diff in Step 2 treats them identically.

### Step 2 — Diff fingerprints across screens

For each `(selector, prop)` pair, compute the set of distinct values
across all screens. A pair with > 1 distinct value is a drift candidate.

```bash
python3 - <<'PYEOF' > audit-evidence/cycle-NN/cross-screen/drift-report.json
import json, glob, os, sys, re
from collections import defaultdict

files = sorted(glob.glob("audit-evidence/cycle-NN/cross-screen/*.styles.json"))
drift = defaultdict(lambda: defaultdict(set))   # drift[selector][prop] -> set of (value, screen_id)

for f in files:
    screen = os.path.basename(f).replace(".styles.json", "")
    data = json.load(open(f))
    for sel, props in (data or {}).items():
        if not props: continue
        for p, v in props.items():
            v_norm = re.sub(r"\s+", " ", v).strip().lower()
            drift[sel][p].add((v_norm, screen))

findings = []
SEVERITY_BY_PROP = {
    "color": "HIGH", "background-color": "HIGH", "border-color": "MEDIUM",
    "border-radius": "MEDIUM", "font-family": "HIGH", "font-size": "MEDIUM",
    "font-weight": "MEDIUM", "line-height": "MEDIUM", "box-shadow": "MEDIUM",
    "padding": "LOW", "margin": "LOW", "opacity": "LOW",
}
WHITELIST_VARYING = {("nav_link_active", "color"), ("nav_link_active", "background-color")}

for sel, props in drift.items():
    for prop, vals in props.items():
        unique = {v for v, _ in vals}
        if len(unique) <= 1: continue
        if (sel, prop) in WHITELIST_VARYING: continue
        sev = SEVERITY_BY_PROP.get(prop, "LOW")
        findings.append({
            "selector": sel, "property": prop, "severity": sev,
            "distinct_values": sorted(unique),
            "by_screen": sorted([{"value": v, "screen": s} for v, s in vals],
                                key=lambda d: d["screen"]),
            "title": f"Token drift: {sel} {prop} varies across screens ({len(unique)} distinct values)",
        })

print(json.dumps({"findings": findings, "total": len(findings)}, indent=2))
PYEOF
```

Append the produced findings to `cycle-NN/findings.json` with
`phase: "cross-screen"`. Each finding cites the screen IDs and the
specific values; the fix path is usually "consolidate to design token X".

### Step 3 — Type-scale spot-check

Pull computed `font-size` + `line-height` for `h1`, `h2`, `h3`, body, caption
across screens. The set of distinct values per heading level should be
small (1, ideally; 2 is the maximum before the cascade is "leaking").

```bash
python3 - <<'PYEOF' > audit-evidence/cycle-NN/cross-screen/type-scale.json
import json, glob, os
from collections import defaultdict
scale = defaultdict(set)
for f in sorted(glob.glob("audit-evidence/cycle-NN/cross-screen/*.styles.json")):
    data = json.load(open(f))
    for level in ("h1", "h2", "body_text", "caption"):
        if data.get(level):
            scale[level].add((data[level].get("font-size"), data[level].get("line-height")))

report = {level: [{"font-size": fs, "line-height": lh} for fs, lh in vals]
          for level, vals in scale.items()}
print(json.dumps(report, indent=2))

problems = [f"{level}: {len(vals)} distinct (font-size, line-height) pairs"
            for level, vals in scale.items() if len(vals) > 1]
if problems:
    open("audit-evidence/cycle-NN/cross-screen/type-scale-drift.txt", "w").write("\n".join(problems))
PYEOF
```

If `type-scale-drift.txt` exists and is non-empty, that's a HIGH finding —
type drift is the most-cited bug pattern in *Refactoring UI* (one H2 is
24px, another is 22px because someone eyeballed it).

### Step 4 — Component shape diff (cards / modals / inputs)

For cards / modals / inputs, sampled in step 1, compare `border-radius`,
`box-shadow`, `border-width` per type. Same logic as step 2 but scoped to
shape properties — drift here is what makes apps feel "assembled."

The drift report from step 2 already covers this; if the agent wants a
per-shape view, query the JSON:

```bash
jq '.findings[] | select(.selector == "card" or .selector == "modal")' \
  audit-evidence/cycle-NN/cross-screen/drift-report.json
```

### Step 5 — Iconography contact sheet (programmatic, not eyeball)

Generate an HTML contact sheet that lays out every distinct icon used in
the app on a single canvas, with each icon annotated by source screen.
Then screenshot the contact sheet — drift is visible at a glance, but the
agent can also auto-detect mismatches via image hash.

```bash
# A. Discover every <svg> and every <img src="...icon...">
python3 - <<'PYEOF' > audit-evidence/cycle-NN/cross-screen/icon-inventory.json
import json, glob, re, hashlib, os
from collections import defaultdict
icons = defaultdict(list)  # key: normalized SVG body or src; val: list of (screen, ref)

# Scan source for static icon imports/usages
for f in glob.glob("**/*.{tsx,jsx,vue,svelte,html,svg}", recursive=True):
    try: text = open(f, errors="ignore").read()
    except: continue
    for m in re.finditer(r'<svg[^>]*>(.*?)</svg>', text, re.S):
        body = re.sub(r"\s+", " ", m.group(1)).strip()
        h = hashlib.sha256(body.encode()).hexdigest()[:12]
        icons[h].append({"screen": f, "preview": body[:200]})
    for m in re.finditer(r'src=["\']([^"\']*icon[^"\']*)["\']', text, re.I):
        icons[m.group(1)].append({"screen": f, "preview": m.group(1)})

print(json.dumps({"distinct": len(icons),
                  "by_hash": {h: locs[:5] for h, locs in icons.items()}}, indent=2))
PYEOF

# B. Build a single-page HTML contact sheet
python3 - > audit-evidence/cycle-NN/cross-screen/icon-contact-sheet.html <<'PYEOF'
import json
data = json.load(open("audit-evidence/cycle-NN/cross-screen/icon-inventory.json"))
print('<!doctype html><html><head><style>')
print('body{font-family:system-ui;background:#fff;color:#111}')
print('.row{display:flex;flex-wrap:wrap;gap:24px;padding:24px}')
print('.cell{display:flex;flex-direction:column;align-items:center;width:80px}')
print('.icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center}')
print('.icon svg{width:100%;height:100%}')
print('.label{font-size:10px;color:#666;margin-top:4px;text-align:center;word-break:break-all}')
print('</style></head><body><div class="row">')
for h, locs in data["by_hash"].items():
    preview = locs[0]["preview"] if locs else ""
    if preview.startswith("<") or "/" not in preview:
        body = preview
    else:
        body = f'<img src="{preview}" alt="">'
    print(f'<div class="cell"><div class="icon">{body}</div><div class="label">{h[:6]}</div></div>')
print('</div></body></html>')
PYEOF

# C. Screenshot the contact sheet via agent-browser
agent-browser open file://$PWD/audit-evidence/cycle-NN/cross-screen/icon-contact-sheet.html
agent-browser wait --load networkidle
agent-browser screenshot --full audit-evidence/cycle-NN/cross-screen/icon-contact-sheet.png
agent-browser close
```

The contact sheet image goes into the cycle report. Programmatic flags:

| Trigger | Severity | Title |
|---------|----------|-------|
| > 1 icon library imported (e.g., both `lucide` and `heroicons`) | HIGH | Mixed icon libraries |
| > 1 distinct stroke-width value across SVG icons | MEDIUM | Inconsistent icon stroke weight |
| Mix of filled and outlined icons at the same hierarchy level | MEDIUM | Icon style mixed within hierarchy |
| > 5 distinct icon dimensions (32 / 24 / 20 / 16 …) | LOW | Icon sizes not on a token scale |

Scan for the first one with `grep`:

```bash
grep -rE "from ['\"](lucide|heroicons|@radix-ui/react-icons|react-icons|tabler-icons|phosphor)" \
     --include='*.{ts,tsx,js,jsx,vue,svelte}' . \
     | awk -F: '{print $NF}' | sort -u
# > 1 line in the output = HIGH finding
```

### Step 6 — Nav active-state diff

Capture the nav at three different "active" routes; extract computed style
of the active item; drift in `color`, `background-color`, `border-color`,
`font-weight`, or `text-decoration` between screens is a HIGH finding (the
nav is the most-trafficked component; drift is felt immediately).

This is already covered by step 1's `nav_link_active` selector in the
drift report — check `jq '.findings[] | select(.selector == "nav_link_active")'`
on `drift-report.json`.

### Cycle-time budget

| Step | Mechanical | Eyeball baseline |
|------|------------|------------------|
| 1 — fingerprint per screen | ~30s × screen count | 5 min × screen count |
| 2 — diff | ~5s | (impossible to do well manually) |
| 3 — type scale | ~5s | 3 min |
| 4 — component shape | (folded into 2) | 5 min |
| 5 — icon contact sheet | ~30s | 10 min |
| 6 — nav diff | (folded into 2) | 5 min |
| **Total for 10 screens** | **~6–8 min** | **~30–45 min** |

The mechanical pass is faster AND catches more (because the diff
threshold is consistent across screens, not subject to designer fatigue).

### When to fall back to eyeball

The mechanical pass produces *a strong skeleton of findings*; it doesn't
catch:

- Vibe / brand fit (does this look like our brand?)
- Photographic/illustration consistency (mechanical sees `<img>` tags, not aesthetic match)
- Voice and copy tone (handled by `ux-writing` skill if installed)
- Accessibility intent (handled by `accessibility-review` skill if installed)

For those, after the mechanical pass, do a brief eyeball review of the
contact sheet and a representative dark-mode screenshot. Findings
discovered there are still entered in the same `findings.json` with
`phase: "cross-screen"` and `evidence` citing the screenshot.

## Motion / transition quality

Motion is part of the experience but is the easiest dimension to skip
because static screenshots can't show it. This section is the deliberate
audit, with concrete checks. Most findings here are MEDIUM/LOW unless
something obviously janks during recorded playback (then HIGH).

### Six rules — run all per cycle, on Phase 2

#### Rule 1 — No animation longer than 500ms unless explicitly slow

Long durations on UI elements feel sluggish and create "where did the
button go" moments. The threshold is 500ms; semantic exceptions
(modal-open ≤ 800ms, page transition ≤ 600ms) get a pass when explicitly
named that way.

```bash
mkdir -p audit-evidence/cycle-NN/motion

# Find all transition / animation declarations with durations
grep -rEn "(transition|animation)(-duration)?:\s*[^;}]*[0-9]+(ms|s)" \
     --include="*.{css,scss,sass,less,styl,vue,svelte,jsx,tsx,html}" . \
  > audit-evidence/cycle-NN/motion/durations.raw

# Parse durations and flag > 500ms unless on a whitelisted property
python3 - <<'PYEOF' > audit-evidence/cycle-NN/motion/long-durations.json
import re, json, os
WHITELIST = re.compile(r"\b(modal|dialog|sheet|drawer|page|route|hero)\b", re.I)
findings = []
with open("audit-evidence/cycle-NN/motion/durations.raw") as f:
    for line in f:
        if ":" not in line: continue
        for m in re.finditer(r"(\d+(?:\.\d+)?)(ms|s)\b", line):
            n = float(m.group(1)) * (1000 if m.group(2) == "s" else 1)
            if n <= 500: continue
            severity = "LOW" if WHITELIST.search(line) else "MEDIUM"
            findings.append({
                "rule": "1-long-duration",
                "severity": severity,
                "duration_ms": int(n),
                "evidence": line.strip(),
                "title": f"Animation duration {int(n)}ms exceeds 500ms threshold",
            })
print(json.dumps({"findings": findings, "count": len(findings)}, indent=2))
PYEOF
```

#### Rule 2 — No `linear` easing on UI elements (background, color, transform on tap targets)

`linear` reads as mechanical / cheap; `ease`, `ease-out`, `cubic-bezier(...)`
read as designed. Exception: indeterminate spinners (`animation: spin
linear infinite` is correct).

```bash
grep -rEn "(transition|animation)(-timing-function)?:\s*[^;}]*\blinear\b" \
     --include="*.{css,scss,sass,less,styl,vue,svelte,jsx,tsx,html}" . \
  > audit-evidence/cycle-NN/motion/linear-easing.raw

# Filter out the legitimate spinner case
grep -v "infinite" audit-evidence/cycle-NN/motion/linear-easing.raw \
  > audit-evidence/cycle-NN/motion/linear-easing.findings || true
# Each remaining line is one MEDIUM finding
wc -l audit-evidence/cycle-NN/motion/linear-easing.findings
```

#### Rule 3 — `prefers-reduced-motion` media query exists when the app has motion

If any `transition:` or `animation:` rule exists in the codebase, then a
`@media (prefers-reduced-motion)` block must also exist. Missing this is
a WCAG 2.3.3 violation (Animation from Interactions).

```bash
HAS_MOTION=$(grep -rE "^\s*(transition|animation)\s*:" --include="*.css" --include="*.scss" \
             --include="*.vue" --include="*.svelte" -l . | head -1)
HAS_REDUCED_MOTION=$(grep -rE "@media\s*\([^)]*prefers-reduced-motion" \
             --include="*.css" --include="*.scss" --include="*.vue" --include="*.svelte" -l . | head -1)

if [[ -n "$HAS_MOTION" && -z "$HAS_REDUCED_MOTION" ]]; then
  cat > audit-evidence/cycle-NN/motion/no-reduced-motion.json <<EOF
{
  "rule": "3-no-reduced-motion",
  "severity": "MEDIUM",
  "title": "App has animations but no prefers-reduced-motion override",
  "wcag": "2.3.3 Animation from Interactions",
  "evidence_motion_at": "$HAS_MOTION",
  "fix_hint": "Add @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important } }"
}
EOF
fi
```

#### Rule 4 — Reduced-motion override actually disables animation (not just shortens)

A common bug is to wrap reduced-motion CSS that *shortens* duration to
100ms — still visible, still moving. The override should set durations
to `0.01ms !important` (effectively instant) or `none`.

```bash
python3 - <<'PYEOF' > audit-evidence/cycle-NN/motion/reduced-motion-strength.json
import re, json, glob

findings = []
for f in glob.glob("**/*.{css,scss,sass,less,vue,svelte}", recursive=True):
    try: text = open(f, errors="ignore").read()
    except: continue
    # Extract every @media (prefers-reduced-motion ...) block
    for m in re.finditer(r"@media\s*\(\s*prefers-reduced-motion[^)]*\)\s*{(.*?)}\s*}", text, re.S):
        block = m.group(1)
        # Look for transition-duration / animation-duration values inside
        for v in re.finditer(r"(transition|animation)-?duration?\s*:\s*([^;]+);", block, re.I):
            val = v.group(2).strip().lower()
            # Acceptable values: 0, 0s, 0ms, 0.01ms, none, initial, unset
            if not re.match(r"^(0(?:s|ms)?|0\.0?1ms|none|initial|unset)$", val):
                findings.append({
                    "rule": "4-weak-reduced-motion",
                    "severity": "MEDIUM",
                    "file": f,
                    "value": v.group(0).strip(),
                    "title": f"prefers-reduced-motion override sets {val} — should be 0/none/0.01ms",
                })
print(json.dumps({"findings": findings, "count": len(findings)}, indent=2))
PYEOF
```

#### Rule 5 — Content-jump on state transition (CLS-equivalent for animations)

When clicking a button changes the layout (button shrinks because it's now
showing a spinner that's smaller than the label), the surrounding content
jumps. The audit catches this by capturing pre/mid/post and diffing the
position of nearby elements.

```bash
# Per interactive element — pre, then in-flight (loading state), then post
# Tries multiple loading-state shapes — many design systems use different conventions:
#   data-loading="true"            (Tailwind UI, custom)
#   aria-busy="true"               (WAI-ARIA semantic — should be everywhere)
#   data-state="loading"           (Radix UI, shadcn/ui)
#   class*="loading" / "is-loading" (BEM-style, legacy)
agent-browser eval --stdin > audit-evidence/cycle-NN/motion/jump-test.json <<'EVALEOF'
const LOADING_SHAPES = [
  { kind: 'attr',  apply: el => { el.setAttribute('data-loading', 'true'); },
                   revert: el => { el.removeAttribute('data-loading'); },
                   describe: 'data-loading' },
  { kind: 'aria',  apply: el => { el.setAttribute('aria-busy', 'true'); },
                   revert: el => { el.removeAttribute('aria-busy'); },
                   describe: 'aria-busy' },
  { kind: 'state', apply: el => { el.setAttribute('data-state', 'loading'); },
                   revert: el => { el.removeAttribute('data-state'); },
                   describe: 'data-state="loading"' },
  { kind: 'class', apply: el => { el.classList.add('is-loading', 'loading'); },
                   revert: el => { el.classList.remove('is-loading', 'loading'); },
                   describe: 'class is-loading / loading' },
];

const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
const result = [];

for (const b of buttons) {
  const before = b.getBoundingClientRect();
  // Try every loading shape — keep the worst delta seen across shapes
  let worst = { dW: 0, dH: 0, shape: null };

  for (const shape of LOADING_SHAPES) {
    // Snapshot existing state so we restore cleanly
    const hadAttr =  b.hasAttribute('data-loading');
    const hadAria =  b.hasAttribute('aria-busy');
    const hadState = b.hasAttribute('data-state') ? b.getAttribute('data-state') : null;
    const hadIsLoading = b.classList.contains('is-loading');
    const hadLoading   = b.classList.contains('loading');

    shape.apply(b);
    void b.offsetWidth;                       // force layout

    const after = b.getBoundingClientRect();
    const dW = Math.abs(after.width - before.width);
    const dH = Math.abs(after.height - before.height);
    if (dW > worst.dW || dH > worst.dH) {
      worst = { dW, dH, shape: shape.describe };
    }

    // Restore — try to put the element back exactly as we found it
    shape.revert(b);
    if (hadAttr)        b.setAttribute('data-loading', 'true');
    if (hadAria)        b.setAttribute('aria-busy', 'true');
    if (hadState !== null) b.setAttribute('data-state', hadState);
    if (hadIsLoading)   b.classList.add('is-loading');
    if (hadLoading)     b.classList.add('loading');
  }

  if (worst.dW > 4 || worst.dH > 4) {
    result.push({
      tag: b.tagName.toLowerCase(),
      id: b.id || null,
      classes: b.className || null,
      label: (b.textContent || '').trim().slice(0, 40),
      detected_via: worst.shape,
      delta_w: worst.dW, delta_h: worst.dH,
      severity: (worst.dW > 16 || worst.dH > 16) ? 'MEDIUM' : 'LOW',
      rule: '5-content-jump',
      title: `Button changes size on loading state (Δw=${worst.dW}px, Δh=${worst.dH}px, detected via ${worst.shape}) — surrounding content jumps`,
    });
  }
}
JSON.stringify({
  findings: result,
  count: result.length,
  loading_shapes_tried: LOADING_SHAPES.map(s => s.describe),
}, null, 2);
EVALEOF
```

If the app uses none of these conventions and a button visibly jumps in
real usage but the audit reports zero findings, the gap is the loading
shape — extend `LOADING_SHAPES` with the app's convention and re-run.
File the gap as a finding against the audit's heuristic too — adding the
new shape to the catalog is a permanent improvement.

The fix is usually `min-width` + `min-height` on the button, or absolute
positioning of the spinner inside a container that retains the original
label's box.

#### Rule 6 — Spinner where a skeleton would fit better (>1s wait)

Spinners communicate "wait"; skeletons communicate "wait — and here's the
shape of what you're waiting for." For waits > 1s, skeletons reduce
perceived latency. Look for `<Spinner>` / `loading` mid-screen with no
adjacent skeleton component.

```bash
grep -rEn "(<Spinner|<Loader|<CircularProgress|<ProgressBar|className=['\"][^'\"]*spinner[^'\"]*['\"])" \
     --include="*.{tsx,jsx,vue,svelte,html}" . \
  > audit-evidence/cycle-NN/motion/spinners.raw

# Count uses
TOTAL_SPINNERS=$(wc -l < audit-evidence/cycle-NN/motion/spinners.raw)

# Files that use spinners but never a skeleton (likely candidates for swap)
python3 - <<'PYEOF' > audit-evidence/cycle-NN/motion/spinner-vs-skeleton.json
import re, json
spinners = set()
with open("audit-evidence/cycle-NN/motion/spinners.raw") as f:
    for line in f:
        spinners.add(line.split(":", 1)[0])

skeletons = set()
import subprocess
out = subprocess.run(
    ["grep", "-rEln",
     r"(<Skeleton|<Shimmer|className=['\"][^'\"]*skeleton[^'\"]*['\"])"],
    capture_output=True, text=True
).stdout
for line in out.splitlines():
    skeletons.add(line.strip())

candidates = sorted(spinners - skeletons)
findings = [{
    "rule": "6-spinner-where-skeleton-fits",
    "severity": "LOW",
    "file": f,
    "title": "File uses Spinner but no Skeleton — for >1s waits, skeleton reduces perceived latency",
} for f in candidates]
print(json.dumps({"findings": findings, "count": len(findings)}, indent=2))
PYEOF
```

### Recorded-playback step (optional, for the highest-severity check)

After the six static rules, record a 5-second video of the home screen
and play it back to look for jank during scroll, content jump on state
transition, or visible animation that should respect reduced motion.

```bash
# Web — agent-browser
agent-browser record start audit-evidence/cycle-NN/motion/home.webm
agent-browser open "$BASE_URL/"
agent-browser wait --load networkidle
agent-browser scroll down 1000
sleep 1
agent-browser scroll up 1000
sleep 1
agent-browser record stop

# iOS — xcrun simctl
xcrun simctl io "$UDID" recordVideo --codec=h264 audit-evidence/cycle-NN/motion/home.mov &
RECORD_PID=$!
xcrun simctl openurl "$UDID" "<deep-link-to-home>"
sleep 5
kill -SIGINT $RECORD_PID; wait $RECORD_PID
```

What the playback is being looked at FOR:

| Symptom | Severity |
|---------|----------|
| Visible jank during scroll (frames missed > 3 in a 5s window) | HIGH |
| Layout shift after content load (CLS > 0.1) | HIGH |
| Animation continues to play after `prefers-reduced-motion` is set | HIGH |
| Hover transitions slower than 200ms on interactive elements | MEDIUM |
| Loading spinner present for the duration with no progress signal | LOW |
| Animation overlaps user-initiated action (e.g., modal still opening when user clicks Close) | MEDIUM |

Record only the home screen + one secondary screen per cycle — playback
review is expensive in agent time.

### Aggregating motion findings

After all six rules + optional playback:

```bash
# Combine into the cycle's findings.json
jq -s '.[].findings | map(. + {phase: "motion"})' \
   audit-evidence/cycle-NN/motion/*.json | jq -c '.[]' \
  | while read f; do
      jq --argjson new "$f" '. + [$new]' \
         audit-evidence/cycle-NN/findings.json \
        > audit-evidence/cycle-NN/findings.json.tmp \
      && mv audit-evidence/cycle-NN/findings.json.tmp \
            audit-evidence/cycle-NN/findings.json
    done
```

Each motion finding gets `phase: "motion"` so they aggregate distinctly
from `phase: "ux"` and `phase: "cross-screen"` in the verdict report.

## Anti-patterns specific to visual auditing

| Anti-pattern | Why it's wrong | Do this instead |
|--------------|----------------|-----------------|
| Auditing one capture per screen and calling visuals "passed" | Misses 80% of state-dependent visual bugs | Multi-state capture loop per element + per-screen variant capture |
| Skipping focus state because "it's accessibility, not visual" | Invisible focus is a visual signaling failure first, accessibility failure second | Capture focus on every interactive element |
| Treating dark mode as a checkbox ("we have dark mode") | Dark mode bugs are common — text on glass, white on light blue | Capture every screen + every state in dark mode if it's `yes` in coverage |
| Using `agent-browser eval` to "fake" hover for the screenshot | Eval doesn't fire :hover pseudo-class via JS | Use `agent-browser hover @eN` (the real subcommand) |
| Capturing happy-path only because "we know it works" | Empty/error/overflow states are where designers and engineers disagree most often | Force each variant via the recipes above |
| Comparing cycle-N captures against cycle-N captures | No regression detection | Always diff against baseline OR cycle-1 capture |
| Auditing visuals only on desktop | Mobile / iOS Safari rendering catches a different category of bugs | Capture mobile via `-p ios --device` profile |
| Hardcoding the audit to one design language | Skills shouldn't impose Material vs HIG — audit *consistency*, not adherence to any one system | Inspect the app's own design intent and audit drift from it |

## When this protocol is overkill

For a 1-screen utility app or a single feature audit, multi-state
capture × all variants × dark mode is too much. Scale down: pick the
most-trafficked element, capture 3 states (default, focus, disabled).
Pick the riskiest variant (usually error or overflow). Skip cross-screen
since there's only one screen. The full protocol earns its complexity
on apps with 5+ screens.

## Complementary public skills (use as reference, not replacement)

The visual-experience audit composes well with these public Claude
skills. Each covers a slice — none does the full loop the parent
skill does, but their checklists / data are valuable inputs:

| Skill | Repo / source | What it brings |
|-------|---------------|----------------|
| **AccessLint** | accesslint/claude-marketplace | 4 a11y micro-skills (contrast-checker, refactor, use-of-color, link-purpose) + a contrast MCP server. If installed, the audit can call `accesslint:contrast-checker` instead of computing contrast itself |
| **Vercel Web Design Guidelines** | vercel-labs/web-interface-guidelines | 100+ rules covering accessibility, performance, UX best practices. Their canonical rule set is a good cross-reference for Phase 2 findings |
| **bencium refactoring-ui-skill** | bencium/bencium-claude-code-design-skill | Visual-hierarchy/spacing/shadow/palette audits — the Refactoring-UI tactics this file lifts from |
| **iOS HIG Design** | rshankras/claude-code-apple-skills | Apple-specific: safe areas, Dynamic Island, Dynamic Type, semantic colors, VoiceOver. Phase 2 on iOS should defer to this skill if installed |
| **UI/UX Pro Max** | nextlevelbuilder/ui-ux-pro-max-skill | 99 UX guidelines, performance rules (100ms tap feedback, 16ms frame budget, virtualize 50+) — the perf rules in this file are drawn from theirs |
| **identify-ux-problems** | (Marie Claire Dean's collection) | Heuristic-evaluation-style audit. Compose with this skill's Phase 2 UX heuristics step |
| **Vercel webapp-testing** | (Anthropic skills) | Playwright-based UI testing — useful for projects that don't have `agent-browser` available, though this skill prefers `agent-browser` |

When any of these is installed in the user's environment, the audit's
Phase 2 should detect them via `tool_search` (or the equivalent) and
delegate the corresponding sub-checks rather than re-running the same
analysis. The orchestration map in SKILL.md should be updated when
this skill notices new complementary skills available.

## Standards & specs the audit conforms to

| Standard | Use |
|----------|-----|
| **WCAG 2.2** | Compliance baseline; cite specific success criteria in findings (e.g., "fails 2.4.7 Focus Visible") |
| **APCA / WCAG 3 candidate** | Perceptual contrast, especially dark mode |
| **POUR** (WCAG meta) | Frame findings as Perceivable / Operable / Understandable / Robust |
| **WAI-ARIA 1.2 / APG** | Custom-widget patterns (role, state, keyboard) |
| **Apple HIG** | iOS-specific (responsiveness, Dynamic Type, safe areas, VoiceOver) |
| **Material Design 3** | Android/web responsiveness specs (input latency, frame budget) |
| **Inclusive Design Principles** (Microsoft / Heydon Pickering) | Multiple input methods, predictability, controlled motion, alternative formats |
| **Refactoring UI** (Wathan/Schoger) | Visual tactics — whitespace, palette, hierarchy, shadows-as-system |
| **Core Web Vitals** | Layout stability (CLS), input latency (INP), load (LCP) |

Cite the relevant standard's specific success criterion in
findings.json's `suggested_fix` field so the fixer agent has a
direct reference, not just "improve contrast."

## Reference tools (link, don't bundle)

The audit doesn't bundle tooling, but lists what to reach for when
deeper checks are needed:

- **Contrast**: axe DevTools, Lighthouse, WAVE, Atmos, `@weable/a11y-color-utils`
- **A11y scan**: axe-core, pa11y, accessibility-checker.org, Deque a11y
- **Visual regression** (when team has Storybook): Chromatic, Percy, Playwright Visual, Applitools
- **Performance**: Chrome DevTools Performance, Lighthouse, WebPageTest
- **Color picker / sampling**: ColorSlurp, Sip, Chrome DevTools color picker
- **Design-system linting** (Figma side): Design Lint plugin, Style Dictionary, Token Studio
