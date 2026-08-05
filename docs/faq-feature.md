---
title: FAQ Feature
tags: [faq, feature]
---

# FAQ Feature

## Overview

Static `/faq` page for current Augur questions and the completed Moon Fork. It tells visitors what they can use today, summarizes the historical fork and token transition, answers exchange and wallet questions, and warns against post-deadline migration scams.

The page does not present migration as an available action. ForkWatch and the historical blog posts provide supporting detail.

## Route & Files

- **Page:** `src/pages/faq.astro`
- **FAQ item:** `src/features/faq/item.astro`
- **Styles:** `src/styles/global.css` (shared FAQ styles)
- **Regression test:** `scripts/faq.test.ts`

The `/faq` route has no content collection or client-side FAQ state.

## Page Layout

The page uses the same `grid grid-rows-[auto_1fr_auto] min-h-screen` shell as the other top-level content pages:

- **Top:** `PageHeader` with a back link to home and social links.
- **Middle:** The general Augur FAQ, rendered as native disclosure items.
- **Bottom:** Standard `Footer` component.

The title treatment is `FAQ // AUGUR`. Metadata describes using Augur today and the completed Moon Fork, including REP tokens, exchanges, and safety.

## Content Structure

The finalized FAQ contains seven sections:

1. **Augur Today** — whether visitors can use Augur now and what the reboot is building toward.
2. **The Moon Fork** — what happened, why the fork occurred, and why the migration deadline cannot be reopened.
3. **Timeline** — the completed escalation and migration dates.
4. **How the Fork Played Out** — escalation, migration, and the losing outcome universe.
5. **Tokens** — `REPv2_Yes_1`, the Kraken `AUGUR` ticker, the parent REP token, and wallet visibility.
6. **Exchanges** — the historical handling of REP held on Kraken and other exchanges.
7. **Scams & Safety** — post-deadline migration and recovery scams.

Generic encyclopedia prompts such as “What is Augur?” and “What is a prediction market?” remain excluded. The homepage and Learn path provide that orientation.

The fork answers preserve the protocol's lazy child-universe behavior: an outcome has a potential child universe, but that child and its REP token are created only when migration first targets the outcome.

## Static Post-Fork Behavior

The FAQ is a post-fork reference. It does not import fork-lifecycle helpers, render `MigrationCta`, or switch copy based on build-time migration state. Its migration answers state that the contract-enforced deadline has passed and cannot be reopened.

Historical support links include:

- ForkWatch at `https://v3.augur.net/`
- The three Moon Fork blog posts
- Kraken's migration notice
- Etherscan for the current `REPv2_Yes_1` contract

## Disclosure & Anchor Behavior

`src/features/faq/item.astro` renders native `<details>` and `<summary>` elements. No JavaScript opens, closes, or otherwise manages FAQ state, preserving browser disclosure behavior and keyboard accessibility.

Each question has a stable `id` on its `<details>` element:

- `#can-i-use-augur-today`
- `#what-is-the-reboot-building`
- `#i-own-repv2-what-happened`
- `#i-didnt-migrate-in-time-is-there-anything-i-can-do`
- `#why-did-augur-fork`
- `#what-is-a-fork-in-simple-terms`
- `#when-did-the-fork-start-and-end`
- `#what-happened-during-the-escalation-game-phase-1`
- `#what-happened-during-the-migration-window-phase-2`
- `#what-happened-if-someone-migrated-to-the-no-universe`
- `#is-there-a-new-rep-token`
- `#is-augur-on-kraken-the-same-as-repv2-yes-1`
- `#does-the-old-rep-token-still-exist`
- `#the-new-token-doesnt-appear-in-my-wallet-yet-is-something-wrong`
- `#my-rep-was-on-kraken-did-i-need-to-do-anything`
- `#what-about-rep-on-other-exchanges-gate-upbit`
- `#what-happened-to-rep-left-on-an-exchange`
- `#someone-offered-to-migrate-or-recover-my-rep-is-that-real`

A deep link scrolls to the relevant `<details>` element. It does not force the item open; visitors can use the native summary control to disclose the answer.

## Site Integration

The FAQ remains linked from:

1. `src/features/home/hero-banner.tsx` — the landing-page menu.
2. `src/components/shell/footer.astro` — the `>_ KB` section, labeled **AUGUR FAQ**.
3. `src/features/fork-monitor/post-fork-record.tsx` — the verified Fork Record dialog.

The footer also preserves the post-fork Dark Florist and whitepaper-link corrections introduced with the closed-migration messaging.
