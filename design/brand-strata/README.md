# FundWise Logo — Strata

Brand mark: three stacked, slightly-angled rounded slabs in the FundWise green gradient.

## Files in this folder

```
brand-strata/
├── README.md                           ← you are here
├── components/
│   └── Logo.tsx                        ← drop-in React component
├── svg/
│   ├── mark-gradient.svg               ← primary mark, full gradient
│   ├── mark-white.svg                  ← for dark / gradient backgrounds
│   ├── mark-mono-dark.svg              ← single-color dark
│   ├── wordmark-horizontal.svg         ← mark + "FundWise" inline
│   ├── wordmark-horizontal-white.svg   ← inverse
│   ├── wordmark-stacked.svg            ← mark above "FundWise"
│   ├── app-icon-1024.svg               ← iOS/Android home-screen tile
│   └── favicon.svg                     ← 32×32 simplified
└── preview.html                        ← visual brand sheet
```

## Quick start (React / Next.js)

```tsx
import { Logo } from './components/Logo';

// Default — 96px gradient mark
<Logo />

// Custom size
<Logo size={48} />

// On dark or gradient background
<Logo variant="white" />

// Monochrome (print, embossing, single-color contexts)
<Logo variant="mono" />

// Mark + wordmark side-by-side
<Logo lockup="horizontal" size={56} />

// Mark above wordmark (footer, login screen)
<Logo lockup="stacked" size={64} />
```

## Quick start (raw HTML)

```html
<img src="/brand-strata/svg/mark-gradient.svg" alt="FundWise" width="48" height="48" />
```

## Favicon

In your `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/brand-strata/svg/favicon.svg" />
<link rel="apple-touch-icon" href="/brand-strata/svg/app-icon-1024.svg" />
```

## Tailwind / CSS color tokens

If you want to reference the gradient elsewhere:

```css
:root {
  --fw-deep:    #0A4D2C; /* gradient stop 1 */
  --fw-forest:  #0D6B3A; /* gradient stop 2 */
  --fw-emerald: #1A9151; /* gradient stop 3 */
  --fw-jade:    #2DB870; /* mid */
  --fw-mint:    #4EC98A; /* gradient stop 4 */
  --fw-ink:     #0D1F14; /* primary text */

  --fw-gradient: linear-gradient(135deg, #0A4D2C 0%, #1A9151 55%, #4EC98A 100%);
}
```

## Clear space & sizing

- **Minimum size:** 16px (favicon-optimized SVG kicks in below 24px).
- **Clear space:** ½ the height of the mark on all sides.
- **Don't:** stretch, recolor outside the palette, add drop-shadows, or place on busy photographs.

## Wordmark typography

The wordmark uses **DM Serif Display** at -0.8 letter-spacing. Load it via:

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" rel="stylesheet">
```

If you can't load the font, the SVG falls back gracefully to Times New Roman / system serif.

---

Locked in: **Concept 12 — Strata.** Three layers of liquidity, one confident mark.
