---
title: FAQ Feature
tags: [faq, feature]
---

# FAQ Feature

## Overview

Static `/faq` page covering the Augur fork for REP holders. Surfaced as the first (urgent) hero menu item on the landing page. Ships as a hardcoded Astro page — no content collection.

## Route & Files

- **Page:** `src/pages/faq.astro`
- **Styles:** `src/styles/global.css` (`.faq-item`, `.faq-answer`, `.faq-group`)

## Page Layout

Follows the same `grid grid-rows-[auto_1fr_auto] min-h-screen` shell used by `mission.astro` and `team.astro`:

- **Top:** `PageHeader` component with back link to home and social links.
- **Middle:** Content area with max-width constraint, scrollable overflow.
- **Bottom:** Standard `Footer` component.

## Title Treatment

Same label // bold-label pattern as `BlogLayout`:

- Muted label: `FAQ`
- Separator: `//`
- Bold loud label: `FORK & MIGRATION`

## Content Structure

Intro paragraph followed by 7 sections. Each section has a `SectionHeading` and a `faq-group` div containing native `<details>`/`<summary>` collapsible items:

1. **What is happening?** — Context on the fork itself
2. **Timeline** — Fork phases and key dates
3. **Required Action** — Migration mechanics and dos/don'ts
4. **Tokens** — Token behavior and supply
5. **REPv1 Holders** — Migration path from v1 to v2 to fork
6. **Exchanges** — Guidance for holders on exchanges
7. **Safety & Process** — Reversibility, deadlines, official tools

No numbering. Section headings organize the Q&A semantically.

## Q&A Styling (`global.css`)

Collapsible Q&A styled to match the terminal aesthetic via `.faq-item` and `.faq-answer`:

- **Summary (closed):** `>_` prefix rendered via `::before`, `text-foreground` color, bottom border separator between items
- **Summary (open):** `text-loud-foreground`, `>_` prefix glows with `drop-shadow` using `--color-primary`
- **Answer content:** Indented, `font-prose` (IBM Plex Mono) font family, `text-foreground`, `text-transform: none` (no uppercase override)
- **Browser markers:** WebKit and standard `::marker` hidden with `display: none`

## Site Integration

The FAQ is linked from two site-level entry points:

1. **`src/features/home/hero-banner.tsx`** — direct `/faq` link in the landing-page menu.

2. **`src/components/shell/footer.astro`** — FAQ link in the `>_ KB` section.

The FAQ page also renders `src/features/learn/migration-cta.tsx`, a red-bordered inline CTA linking to `/learn/fork/migration/`.

## Footer Integration

`src/components/shell/footer.astro` — FAQ link added to `>_ KB` section as the **first item**, above the Augur Whitepaper link:

```
FORK & MIGRATION FAQ → /faq
AUGUR WHITEPAPER → (external link)
```

## Image Slot

An `<!-- IMAGE SLOT: Task 5 will insert the hero image here -->` comment placeholder remains in the page. No image is currently rendered. Can be filled later with a portrait-oriented asset.

## Constraints

- **No JavaScript:** Native HTML `<details>`/`<summary>` only — zero client-side interactivity needed
- **No content collection:** Content is hardcoded directly in the `.astro` file, not sourced from a collection
- **No deep linking:** No per-question anchor IDs (can be added later if needed)
- **Uppercase override:** Main page and headings use uppercase via Tailwind; Q&A content remains normal case for readability
