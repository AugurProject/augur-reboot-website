# FAQ Page Design — Fork & Migration

**Date:** 2026-04-07  
**Status:** Approved  
**Branch:** faq worktree

---

## Overview

A static FAQ page at `/faq` targeting REP holders during the live Augur fork. The fork begins April 8 — this is urgent, time-sensitive content. The page surfaces via a prominent first menu item on the landing page hero.

---

## URL & Page Type

- **Route:** `/faq` — `src/pages/faq.astro`
- **Type:** Static Astro page (hardcoded content, no content collection)
- **Layout shell:** Same `grid grid-rows-[auto_1fr_auto] min-h-screen` pattern as `mission.astro` and `team.astro`

---

## Landing Page Changes (`HeroBanner.astro`)

A new first menu item is added to `#menu-items-container`, placed **above** the existing two items:

- **Copy:** `THE FORK IS HERE! OWN REP? ACT NOW.`
- **Style:** `text-loud-foreground` (bright green) + persistent `fx-glow` — always glowing, no hover required. Distinguishes it visually from the other two items which use `text-foreground` with hover-only glow.
- **Animation:** Existing `nth-of-type` rules shift — the new item gets the earliest fade-in delay. The CSS animation block in `HeroBanner.astro` must be updated to account for the new ordering (items 1, 2, 3 → was mission, team; now faq, mission, team).

---

## Footer Changes (`Footer.astro`)

Add FAQ link to the existing `>_ KB` section alongside the Augur Whitepaper link.

---

## Learn Fork Pages (Nice-to-have)

Add a "Have questions? → FAQ" crosslink at the bottom of `src/content/learn/fork/` pages. Lower priority — ship after the page is live.

---

## FAQ Page Structure

### 1. Navigation Shell
- Top-left: `BACK TO HOME` button with left `Pointer` (matches all other pages)
- Top-right: `SocialLinks`

### 2. Title
Blog-style heading treatment:

```
FAQ // FORK & MIGRATION
```

Same pattern as `BlogLayout`: muted label (`FAQ`), separator (`//`), bold loud label (`FORK & MIGRATION`).

### 3. Hero Image
- **Single image** for the whole page — user-provided asset
- **Orientation:** Portrait / narrow (not wide OG ratio)
- **Placement:** Centered below the title, above the intro paragraph
- **Treatment:** Corner accent decorations (same `::before`/`::after` border-corner style used on blog post first images)
- **Width:** Constrained, centered within `max-w-2xl` content column

### 4. Intro Paragraph
A brief urgent framing paragraph before the questions. Drawn from Q1–3 of the notes, condensed:

> Augur is going through its first algorithmic fork. If you own REP, you must act — failing to migrate your tokens within the window will likely render them worthless. This page answers the most important questions.

Exact copy can be refined before launch.

### 5. Questions — Grouped Collapsible Q&A

Questions are organized into semantic category groups from the stakeholder notes. Each group uses `SectionHeading`. Each question is a native `<details>`/`<summary>` element — zero JS, semantic HTML, collapsible.

**Groups and questions (from `faq-notes.md`):**

#### Timeline
- When does the fork start and end?
- What happens during the escalation game?
- When do I need to take action?

#### Required Action
- Do I need to participate in the escalation game?
- Do I need to participate in migration?
- What does "migration" mean?
- What happens if I don't migrate?
- What happens if I migrate to the wrong universe?

#### Tokens
- Will there be a new REP token?
- Will the old REP token still exist?
- Will my token balance change?

#### REPv1 Holders
- I own REPv1. What should I do?
- Can I skip REPv2 and go directly to the new token?

#### Exchanges
- My REP is on an exchange (Kraken, Gate). What should I do?
- What happens if I leave my REP on an exchange?

#### Safety & Process
- Is migration reversible?
- Is there a deadline?
- Will there be an official migration tool?
- How do I know which universe is correct?

No numbering. Group headings are the organizing principle.

### 6. Footer
Standard `Footer` component.

---

## Styling — `<details>`/`<summary>`

Styled to match the terminal aesthetic in `src/styles/global.css`:

- **Summary (closed):** `>_` prefix, `text-foreground`, border-bottom separator between items
- **Summary (open):** `text-loud-foreground`, `fx-glow` on the `>_` prefix
- **Answer content:** Indented, `font-prose` (IBM Plex Mono) for readability, `text-foreground`
- **No bullet points or numbering** on answers — plain text or simple line breaks

All `<details>`/`<summary>` styles go into `src/styles/global.css` as `@utility` or scoped to the page via Astro `<style>` block.

---

## Content Source

All 22 Q&A pairs from `faq-notes.md`. Dates in Q4 (`Start: April 8`, ~4-month duration) must be verified accurate before go-live.

---

## Out of Scope

- No content collection — content is hardcoded in the `.astro` file
- No search or filtering
- No per-question deep linking (no anchor IDs required, but can be added later)
- No React island — native HTML only
