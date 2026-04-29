# lynx — Brand Assets

## Files

| File | Purpose | Format | Notes |
|---|---|---|---|
| `logo.svg` | Primary mark — uses `currentColor` so it inherits page theme | SVG, 256×256 | Drop into any `<svg>` consumer; CSS controls fill via `color` |
| `logo-light.svg` | Light-mode variant — black ink | SVG, 256×256 | For light backgrounds |
| `logo-dark.svg` | Dark-mode variant — near-white ink | SVG, 256×256 | For dark backgrounds |
| `social-card.svg` | Open Graph / Twitter card | SVG, 1280×640 | Convert to PNG with `rsvg-convert` or `inkscape` for og:image |
| `banner.txt` | ASCII banner | UTF-8 text | Embed in CLI output, README headers |

## Mark anatomy

```
       ▲          <- ear-tuft glyph (lynx signature)
       ·          <- top crosshair tick (focus)
   ╭───────╮
   │       │
 · │   ◐   │ ·    <- iris + slit pupil + catchlight
   │       │
   ╰───────╯
       ·          <- bottom crosshair tick
```

- **Almond eye** — sharp shape, drawn as two cubic arcs joined at the corners
- **Slit pupil** — vertical, the lynx/cat signature; rounded caps
- **Catchlight** — small dot upper-right of pupil; gives the eye life
- **4 crosshair ticks** — N/S/E/W of the eye outer; the "precision audit" cue
- **Ear-tuft glyph** — thin triangle above the eye; subtle nod to the lynx species

## Color

The mark is **monochrome by design**. All color comes from context.

- Primary: black `#0a0a0a` on light, near-white `#f5f5f5` on dark
- Accent (social card only): gold gradient `#d4af37 → #a07a1f` (a nod to lynx eye color in nature)

No other colorways are sanctioned. Don't tint, don't outline, don't drop-shadow.

## Wordmark

`lynx` — always lowercase, monospace stack (`ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace`), heavy weight (700), tight letter-spacing (-6 at 156 px).

The lowercase signals: the tool is precise, not loud. The monospace signals: this is a CLI-native, code-adjacent product.

## Generating PNG from SVG

```bash
# Social card → 1280×640 PNG (for og:image / twitter:card)
rsvg-convert -w 1280 -h 640 brand/social-card.svg -o brand/social-card.png

# Logo → 512×512 PNG (for favicons, README badges)
rsvg-convert -w 512 -h 512 brand/logo-dark.svg -o brand/logo-512.png
```

If `rsvg-convert` isn't installed: `brew install librsvg` (macOS) or `apt install librsvg2-bin` (Linux).

## Sibling-plugin parity

This brand sits alongside:

- [crucible](https://github.com/krzemienski/crucible) — evidence-gated execution
- [validationforge](https://github.com/krzemienski/validationforge) — e2e validation
- [anneal](https://github.com/krzemienski/anneal) — iterative refinement

All four share the lowercase wordmark + monospace stack convention.
