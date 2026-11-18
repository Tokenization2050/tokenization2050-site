# Tokenization 2050 — Design System

> Reference document for all visual design decisions. Use this to maintain consistency
> across the website, social media, video, and newsletter.

---

## 1. Colour Palette

### Primary Colours

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Ink** | `#0F1A2E` | 15, 26, 46 | Headlines, primary text, section rules |
| **Body** | `#374151` | 55, 65, 81 | Body text, descriptions |
| **Muted** | `#6B7280` | 107, 114, 128 | Timestamps, metadata, secondary info |
| **Azure 700** | `#1A56DB` | 26, 86, 219 | Primary brand, links, section labels, active states |
| **Azure 600** | `#2563EB` | 37, 99, 235 | Hover states, interactive elements |
| **Azure 100** | `#DBEAFE` | 219, 234, 254 | Highlight backgrounds |
| **Azure 50** | `#EFF6FF` | 239, 246, 255 | Light tint backgrounds, summary boxes |

### Neutral Colours

| Name | Hex | Usage |
|------|-----|-------|
| **White** | `#FFFFFF` | Card backgrounds, content areas, page background |
| **Surface** | `#F9FAFB` | Alternating section backgrounds, footer |
| **Border** | `#E5E7EB` | Dividers, card borders, table rules |
| **Border Dark** | `#D1D5DB` | Hover borders, stronger dividers |

### Semantic Colours

| Name | Hex | Usage |
|------|-----|-------|
| **Green** | `#059669` | Positive change indicators (↑) |
| **Red** | `#DC2626` | Negative change indicators (↓), breaking/urgent labels |
| **Amber** | `#D97706` | Cautionary/neutral indicators |

### Forbidden Colours

Do **not** use: neon colours, purple, gradients, glow effects, or any colour not listed above.

---

## 2. Typography

### Font Stack

| Role | Font Family | Fallbacks |
|------|-------------|-----------|
| **Headlines** | DM Serif Display (400) | Georgia, Times New Roman, serif |
| **UI / Body / Data** | Inter (400, 500, 600, 700, 800) | -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif |

Both fonts are free (Google Fonts) and self-hosted as WOFF2 files.

### Type Scale

| Element | Font | Weight | Size | Line Height | Notes |
|---------|------|--------|------|-------------|-------|
| Article H1 | DM Serif Display | 400 | 36px (2.25rem) | 1.18 | Main article headline |
| Home Lead H2 | DM Serif Display | 400 | 32px (2rem) | 1.2 | Lead story headline |
| Card H4 | DM Serif Display | 400 | 18px (1.125rem) | 1.3 | Story card headline |
| Section Title H2 | Inter | 700 | 20–24px | 1.25 | Section page titles |
| Section Label | Inter | 600 | 11px (0.6875rem) | — | Uppercase, letter-spacing: 0.06em |
| Body | Inter | 400 | 16px (1rem) | 1.7 | Article body, page content |
| Body Large | Inter | 400 | 17px (1.0625rem) | 1.6 | Lead summary, article summary box |
| Data / Figures | Inter | 600–700 | 24px (1.5rem) | — | Key figure values, `tabular-nums` |
| Metadata | Inter | 400 | 13px (0.8125rem) | — | Timestamps, bylines |
| Small | Inter | 400–500 | 12px (0.75rem) | — | Ticker labels, figure notes, footer |

### Numeric Formatting

All numbers on the site use:
```css
font-variant-numeric: tabular-nums lining-nums;
```

This ensures columns of numbers align vertically and all digits sit on the baseline.

---

## 3. Spacing

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `sp-1` | 4px | Minimal gaps |
| `sp-2` | 8px | Icon gaps, tight spacing |
| `sp-3` | 12px | Padding in small elements |
| `sp-4` | 16px | Card padding, standard gaps |
| `sp-5` | 20px | Card internal padding |
| `sp-6` | 24px | Grid gutters, section header margins |
| `sp-8` | 32px | Section padding, lead section gaps |
| `sp-10` | 40px | Footer padding |
| `sp-12` | 48px | Newsletter CTA padding, major separations |
| `sp-16` | 64px | Page bottom padding |

---

## 4. Layout

| Property | Value |
|----------|-------|
| **Max content width** | 1280px |
| **Article/page content max** | 720px |
| **Grid** | CSS Grid, 12-column conceptual |
| **Gutters** | 24px (desktop), 16px (mobile) |

### Breakpoints

| Name | Width | Changes |
|------|-------|---------|
| Desktop | > 1024px | Full layout |
| Tablet | ≤ 1024px | 3-col figures → 3-col, 3-col cards → 2-col |
| Mobile | ≤ 768px | Single column, hamburger nav, stacked forms |
| Small | ≤ 480px | Single-col figures, hide date in header |

---

## 5. Components

### Ticker Strip
- Full-width, `Ink` background, white text
- Scrollable on mobile
- Items: label (muted) + value (white, bold) + change (green/red)
- Separated by vertical bars

### Section Label
- Uppercase, 11px, weight 600, Azure 700
- Letter-spacing: 0.06em
- Used above headlines to identify content category

### Story Card
- White background, 1px border (Border colour)
- Padding: 20px
- Section label → headline (DM Serif Display) → summary (3-line clamp) → timestamp
- Hover: darker border, subtle shadow

### Lead Story
- Left 2/3 of lead section
- Larger headline (DM Serif Display, 32px)
- Full summary paragraph
- Timestamp in Muted

### Key Figures
- 6-column grid (desktop), responsive
- Each card: Surface background, 1px border
- Label (uppercase, muted) → value (large, bold) → change (green/red) → note (small, muted)

### Article Summary Box
- Azure 50 background, 3px left border in Azure 700
- Full-width within article column
- Body Large text (17px)

### Source List
- Separated by 1px borders
- Each: source label (linked), date (muted)

### Newsletter CTA
- Centered, max-width 560px
- DM Serif Display heading, one-line description
- Email input + button (Azure 700 background)

### Footer
- Surface background, border-top
- Three-column: brand + description | nav group 1 | nav group 2
- Disclaimer in small muted text
- Copyright line

---

## 6. Iconography

No icons library required for launch. Use Unicode characters where needed:
- Arrows: ↑ ↓ →
- Separators: · | /
- Share: 𝕏 (for X/Twitter), text labels for LinkedIn and copy link

---

## 7. Brand Mark

Official logo: **"Fraction"**. Four vertical bars in Ink; the fourth bar is Azure and
raised, stepping out of the block (fractional ownership, an asset moving onto new rails).
Wordmark "Tokenization" in Inter 700, "2050" in Inter 500 Azure. All lettering is outlined.

**Official files: `LOGHI/`** (see `LOGHI/LEGGIMI.md`). Approved PNGs:

| File | Use |
|------|-----|
| `tokenization2050-logo-colori.png` | Full logo on white / light backgrounds (default) |
| `tokenization2050-logo-negativo.png` | Full logo on Ink / dark backgrounds |
| `tokenization2050-logo-monocolore-blu-notte.png` | One colour (Ink) |
| `tokenization2050-avatar-bianco-800.png` | **Default icon**: favicon, app icon, share image, social avatars |
| `tokenization2050-avatar-navy-800.png` | Alternative avatar on Ink |
| `tokenization2050-icona-negativo-512.png` | Mark alone, white + Azure, transparent (dark backgrounds) |

Vector masters are in `LOGHI/svg/`.

| Background | Bars + text | Accent bar + "2050" |
|------------|-------------|---------------------|
| White / light | Ink `#0F1A2E` | Azure 700 `#1A56DB` |
| Ink / dark | White `#FFFFFF` | Azure 600 `#2563EB` (better contrast on Ink) |

On the website (paths set in `content/config.json` → `brand`):
- Header and footer: full colour logo, `static/img/logo.svg` (40px high desktop, 32px mobile; 32px in footer).
- Favicon, Apple touch icon, web manifest icons, Open Graph / X image, schema.org publisher logo,
  RSS and JSON feed icons: the **white avatar** (`static/img/icon.svg` and PNGs derived from it).

Rules:
- Keep clear space around the logo of at least one bar width.
- Never stretch, rotate, recolour, outline, or add shadows or gradients.
- The mark alone (avatar / icon) is only for small square spaces: favicon, app icon, social
  profile picture. Everywhere else, use the full logo.

---

## 8. Voice & Tone

- **Authoritative but accessible**: Write for a smart professional, not an academic
- **Neutral**: News is reported without editorial bias. Analysis is clearly labelled.
- **Precise**: Use exact figures, dates, and attributions. Avoid vague language.
- **Global**: Write for a worldwide audience. Explain jurisdiction-specific terms.
- **No jargon without definition**: First use of a technical term links to the glossary.

---

## 9. Timestamps

- Format: `17 Nov 2026 · 14:32 UTC`
- Always in UTC
- Relative times only in the "Latest News" sidebar: "12 min ago", "3h ago"
- Articles show absolute timestamps; updates show both original and update times

---

## 10. Social Media Adaptation

When creating assets for social channels, use:
- **Background**: White or Azure 50
- **Text colour**: Ink
- **Accent**: Azure 700
- **Font**: Inter (all weights as needed)
- **Headline font**: DM Serif Display for feature graphics
- **Aspect ratios**: 1200×630 (OG/LinkedIn), 1080×1080 (Instagram), 1920×1080 (YouTube)
- **Logo**: Full logo (`LOGHI/png/tokenization2050-logo-colori.png`) on graphics; the white avatar
  (`tokenization2050-avatar-bianco-800.png`) only as the profile picture
