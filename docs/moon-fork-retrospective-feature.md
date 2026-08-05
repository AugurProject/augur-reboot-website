---
title: Moon Fork Retrospective Feature
tags: [learn, moon-fork, case-study, provenance]
---

# Moon Fork Retrospective Feature

## Purpose

The canonical Moon Fork case study is published at `/learn/fork/moon-fork/`. It explains what happened during Augur's first completed algorithmic fork without replacing the evergreen Fork lessons, the archived migration procedure, or the dated blog announcements.

The page is durable historical analysis. It does not expose migration controls or derive current-action language from build-time fork state.

## Files

- **Content:** `src/content/learn/fork/moon-fork.mdx`
- **Route generation:** `src/pages/learn/[...slug].astro`
- **Topic entry point:** `src/content/learn/fork/index.mdx`
- **Related archive:** `src/content/learn/fork/migration.mdx`
- **Regression test:** `scripts/moon-fork-retrospective.test.ts`

The content entry uses this metadata:

```yaml
topic: fork
order: 5
contentType: case-study
label: "THE MOON FORK"
historical: true
status: available
presentation: case-study
```

The archived migration record remains order 6 and retains its canonical `/learn/fork/migration/` route.

## Evidence hierarchy

Reader-facing final values come from [[moon-fork-final-record]]. The hierarchy is:

1. Ethereum mainnet contract and block state pinned to finalized block `25,677,103`.
2. Version-controlled deployed Augur v2 source and deployment records.
3. Version-controlled ForkWatch token identity records.
4. Dated project announcements for communication and phase context.

Contract values override announcement-era schedule prose or derived presentation metrics. The case study identifies the winner using `getWinningChildUniverse()` and migration totals using each child token's `getTotalMigrated()` counter, not ERC-20 `totalSupply()`.

## Editorial boundaries

The page separates three kinds of statements:

- **Observed facts:** dated values reproduced from the final evidence record.
- **Evidence boundaries:** what the observation does not establish, including holder counts and incentive optimality.
- **Interpretation and lessons:** project conclusions about data sources, state labels, token identity, exchange communication, and historical tool preservation.

Implications for future Augur and Lituus work are framed as operational requirements. The Moon Fork is not presented as validation of an unimplemented future oracle design.

## Protocol constraints

- Child universes and their REP tokens are lazy: a child is created only when migration first targets an outcome.
- The missing Invalid child at the evidence block records zero migration; it does not remove Invalid as a possible market outcome.
- `isForking() == true` after the deadline means “forking or has forked” in the deployed implementation. It does not mean migration remains open.
- `REPv2_Yes_1` at `0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D` is current REP in the winning universe. Kraken's `AUGUR` is an exchange ticker for that same token.

## Cross-links

The retrospective links to:

- the Fork topic and evergreen dispute and migration lessons;
- the Moon Fork migration archive;
- the three dated fork-phase announcements;
- Ethereum block, market, universe, and token records;
- deployed Augur v2 source; and
- the maintained final-record evidence document in the public repository.

The Fork topic and migration archive link back to the retrospective. Broader persistent-navigation and homepage integration belongs to issue #154.

## Verification

Run:

```bash
npm run test:moon-fork-retrospective
npm run test:evergreen-fork
npm run test:learn-model
npm run typecheck
npm run typecheck:scripts
npm run lint
npm run build
npm run build:gh-pages
```

The retrospective regression test checks canonical metadata, reciprocal links, final record values, observed-versus-interpretation structure, lazy child creation, and closed-migration safety.

## Related documentation

- [[moon-fork-final-record]] — authoritative final facts and provenance
- [[public-knowledge-architecture]] — canonical route and surface boundaries
- [[migration-guide-feature]] — historical procedure presentation
- [[fork-mechanics]] — evergreen protocol context
