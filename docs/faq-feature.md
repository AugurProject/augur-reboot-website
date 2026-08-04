---
title: FAQ Feature
tags: [faq, feature]
---

# FAQ Feature

## Overview

Static `/faq` page for concise answers about Augur as a whole. The Moon Fork appears in one focused historical subsection; the page is not a migration guide.

## Route & Files

- **Page:** `src/pages/faq.astro`
- **FAQ item:** `src/features/faq/item.astro`
- **Styles:** `src/styles/global.css` (shared FAQ styles)

The `/faq` route is preserved. The page has no content collection and no client-side FAQ state.

## Page Layout

The page uses the same `grid grid-rows-[auto_1fr_auto] min-h-screen` shell as the other top-level content pages:

- **Top:** `PageHeader` with a back link to home and social links.
- **Middle:** A general Augur FAQ with concise native disclosure items.
- **Bottom:** Standard `Footer` component.

The title treatment is `FAQ // AUGUR`. Metadata describes Augur markets, reporting, REP, forks, and the completed Moon Fork.

## Content Structure

The Q&A is grouped by subject:

1. **Augur Basics** — Augur, prediction markets, and REP.
2. **Markets & Reporting** — market resolution, dispute bonds, and the fork threshold.
3. **Forks & REP** — universes, one-way migration, and parent-universe behavior.
4. **Moon Fork · Historical Record** — the completed event, verified token identity, and the archived procedure.
5. **Safety & Participation** — token verification and links into the Fork Learn topic.

Answers stay short and link to existing Learn routes for depth. The archived `/learn/fork/migration/` page is linked only as a historical record. The FAQ does not present migration as an available action or duplicate the Learn curriculum.

## Disclosure & Anchor Behavior

`src/features/faq/item.astro` renders native `<details>` and `<summary>` elements. No JavaScript opens, closes, or otherwise manages FAQ state, preserving browser disclosure behavior and keyboard accessibility.

Each question has a stable `id` on its `<details>` element. Current anchors are:

- `#what-is-augur`
- `#what-is-a-prediction-market`
- `#what-is-rep-used-for`
- `#how-are-markets-resolved`
- `#what-is-a-dispute-bond`
- `#when-does-augur-fork`
- `#what-is-a-fork`
- `#is-rep-migration-reversible`
- `#what-happens-to-unmigrated-rep`
- `#what-was-the-moon-fork`
- `#which-outcome-won-the-moon-fork`
- `#where-is-the-moon-fork-record`
- `#how-do-i-verify-a-token`
- `#where-should-i-learn-more`

A deep link scrolls to the relevant `<details>` element. It does not force the item open; visitors can use the native summary control to disclose the answer.

## Site Integration

The FAQ remains linked from:

1. `src/features/home/hero-banner.tsx` — the landing-page menu.
2. `src/components/shell/footer.astro` — the `>_ KB` section, labeled **AUGUR FAQ**.

The FAQ no longer renders the migration CTA or derives its content from fork lifecycle state.
