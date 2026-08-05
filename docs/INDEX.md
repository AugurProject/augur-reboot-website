# Documentation Index

Start here to find the right doc. Read deeper only when the task calls for it.

## Fork Monitoring

| Doc | When to Read |
|---|---|
| [Fork Mechanics](fork-mechanics.md) | What a fork is, how dispute bonds escalate, why the monitor exists. Start here for context. |
| [Fork Monitoring Pipeline](fork-monitoring-pipeline.md) | The CI/CD pipeline: three-job workflow, cache strategy, concurrency, failure handling |
| [Fork Monitoring Methodology](fork-monitoring-methodology.md) | How the calculation script discovers markets, reads bonds, computes the threshold percentage |
| [Final Moon Fork Record](moon-fork-final-record.md) | Authoritative post-deadline block observation, winner/current REP, exact migration totals, provenance, and finality boundaries |

## Protocol Reference

| Doc | When to Read |
|---|---|
| [Augur v2 Protocol Glossary](augur-v2-protocol-glossary.md) | Quick lookup for Augur v2 terms, constants, and formulas — cited to the whitepaper PDF |

## Public Knowledge Architecture

| Doc | When to Read |
|---|---|
| [Public Knowledge Architecture](public-knowledge-architecture.md) | Proposed route map, Learn taxonomy, surface boundaries, Moon Fork canonical route, archive/redirect policy, and downstream handoff for #146 |

## Architecture & UI

| Doc | When to Read |
|---|---|
| [Technical Architecture](technical-architecture.md) | React/TypeScript component hierarchy, state management (Context API), UI patterns, visual rendering |
| [Post-Fork Landing Page Implementation Plan](post-fork-landing-page-implementation-plan.md) | Implementation status and rollout plan for the migration CTA/countdown, verified Fork Record, and lifecycle data contract |
| [Public Data Endpoints](public-data-endpoints.md) | Structured JSON endpoints at /data/*.json for external consumers — schemas, conventions, adding new endpoints |
| [FAQ Feature](faq-feature.md) | Finalized `/faq` content, static post-fork behavior, stable question anchors, safety guidance, and site integration |
| [Moon Fork Retrospective Feature](moon-fork-retrospective-feature.md) | Canonical case-study route, evidence hierarchy, interpretation boundaries, reciprocal Learn links, and verification |
| [Blog Feature](blog-feature.md) | Blog frontmatter schema, MDX integration, RSS feed, Learn section |
| [Migration Guide Feature](migration-guide-feature.md) | Moon Fork migration guide, step-by-step REP migration, MigrationGuideLayout |

## Whitepaper Summaries

Distilled knowledge from source whitepapers. Original PDFs live in `docs/raw/` and are immutable.

| Doc | When to Read |
|---|---|
| [Augur v2 Whitepaper Summary](augur-v2-whitepaper-summary.md) | Synthesized read of the full Augur v2 whitepaper — market lifecycle, disputes, forking, security |
| [Lituus Whitepaper Summary](lituus-whitepaper-summary.md) | Lituus — MBUFSR oracle, escalation game, fee economics, oracle class comparison |
| [Protocol Evolution: Augur to Lituus](protocol-evolution-augur-to-lituus.md) | How Augur v2 (MBUF) evolved into Lituus (MBUFSR) |
