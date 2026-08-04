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

The title treatment is `FAQ // AUGUR`. Metadata describes the Augur reboot, REP after the Moon Fork, the final fork record, and protocol mechanics.

## Content Structure

The Q&A is organized around questions current visitors are likely to bring to the site:

1. **Augur Today** — what is live, whether this site is a trading interface, and what the reboot is building toward.
2. **REP After the Moon Fork** — the current token, multiple contracts, migration status, and contract verification.
3. **The Moon Fork** — why it happened, whether it is complete, the winning universe, and the evidence record.
4. **Protocol Questions** — concise definitions of the fork threshold, universes, and irreversible migration.

Generic encyclopedia prompts such as “What is Augur?” and “What is a prediction market?” are intentionally excluded; the homepage and Learn path provide that orientation.

Answers stay short and link to existing Learn routes for depth. The archived `/learn/fork/migration/` page is linked only as a historical record. The FAQ does not present migration as an available action or duplicate the Learn curriculum.

## Disclosure & Anchor Behavior

`src/features/faq/item.astro` renders native `<details>` and `<summary>` elements. No JavaScript opens, closes, or otherwise manages FAQ state, preserving browser disclosure behavior and keyboard accessibility.

Each question has a stable `id` on its `<details>` element. Current anchors are:

- `#what-is-live-today`
- `#is-this-a-trading-interface`
- `#what-is-the-reboot-building`
- `#which-rep-token-is-current`
- `#why-are-there-multiple-rep-contracts`
- `#is-another-rep-migration-required`
- `#what-happened-to-other-rep`
- `#how-do-i-verify-rep`
- `#why-did-the-moon-fork-happen`
- `#is-the-moon-fork-complete`
- `#which-universe-won`
- `#where-is-the-on-chain-evidence`
- `#where-is-the-complete-record`
- `#what-causes-an-augur-fork`
- `#what-is-a-universe`
- `#why-is-rep-migration-irreversible`

A deep link scrolls to the relevant `<details>` element. It does not force the item open; visitors can use the native summary control to disclose the answer.

## Site Integration

The FAQ remains linked from:

1. `src/features/home/hero-banner.tsx` — the landing-page menu.
2. `src/components/shell/footer.astro` — the `>_ KB` section, labeled **AUGUR FAQ**.

The FAQ no longer renders the migration CTA or derives its content from fork lifecycle state.
