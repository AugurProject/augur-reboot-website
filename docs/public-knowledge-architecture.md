---
title: Public Knowledge Architecture
tags: [architecture, learn, faq, blog, moon-fork, migration]
---

# Public Knowledge Architecture

## Decision status

**Settled and implemented; verified for GitHub issues #148–#155.** This is the architecture and release contract for the implemented public knowledge model. It records the decisions that bounded the work in roadmap #156 and gave #148–#155 concrete destinations.

The public knowledge system has four distinct jobs:

| Surface | Job | What it must not become |
|---|---|---|
| `/learn` | Ordered, topic-based, evergreen education with typed content | A news feed, a migration alert, or a dump of every historical artifact |
| `/faq` | Concise answers to common Augur questions | A second Learn curriculum or a migration-only page |
| `/blog` | Dated announcements, progress reports, and editorial writing | The canonical home for durable protocol education or the Moon Fork record |
| Moon Fork record | A durable, evidence-based account of one completed event | An active migration guide, a news post, or an unsupported victory claim |

The first canonical case study is **`/learn/fork/moon-fork/`**. Keep `fork` singular in Learn URLs. Case studies are typed Learn content within their relevant topic; this milestone does not introduce a separate cross-topic case-study collection.

## Route map

The following are the canonical public routes. A trailing slash is retained for nested Learn content because those paths already exist in public links. Existing top-level route shapes such as `/faq` and `/blog` are preserved.

| Route | Surface / type | Status and destination |
|---|---|---|
| `/learn` | Learn hub | Implemented first-class entry point. Shows only topics with available, coherent content. |
| `/learn/fork/` | Learn topic landing | Existing URL retained as the Fork topic start-here page. |
| `/learn/fork/disputes-and-bonds/` | Lesson | Existing URL retained as evergreen protocol education. |
| `/learn/fork/migration-mechanics/` | Lesson | Implemented evergreen lesson explaining fork migration in general; not the Moon Fork procedure. |
| `/learn/fork/what-to-do/` | Guide | Existing URL retained and reframed as evergreen preparedness for fork conditions. |
| `/learn/fork/moon-fork/` | Case study | **Canonical Moon Fork retrospective.** Durable, dated, verifiable, and linked from the homepage Fork Record. |
| `/learn/fork/migration/` | Historical record | **Existing URL retained in place.** Archived Moon Fork procedure and screenshots; never presented as a current action guide. |
| `/faq` | General Augur FAQ | Existing URL retained. Organize concise answers across Augur, with a focused historical Moon Fork subsection. |
| `/blog` and `/blog/<slug>` | Blog archive and post | Existing URLs retained. Posts remain dated editorial/history, even when they link to Learn or the case study. |
| `/` Fork Record | Homepage state surface | Existing monitoring/Fork Record remains. After resolution it links to `/learn/fork/moon-fork/`; it is not itself the full retrospective. |
| `/data/fork-risk.json` | Public data endpoint | Preserve for existing consumers. Additive data changes belong to the data work, not this architecture decision. |

The topic sequence is deliberately separate from the archive:

1. **What is a fork?** — topic introduction and start here.
2. **How disputes and bonds work** — the escalation mechanism.
3. **How fork migration works** — general, evergreen mechanics at the new `migration-mechanics` route.
4. **What to do around fork risk** — preparedness guide, not live instructions.
5. **Moon Fork** — the completed event as a case study.
6. **Moon Fork migration procedure** — related historical record, outside the evergreen sequence.

## Learn taxonomy and metadata contract

Every Learn entry should have one primary `contentType`. `historical: true` and `status: archived` provide lifecycle information without inventing a second type.

| Type | Meaning | Typical route / presentation |
|---|---|---|
| `topic` | A landing page that defines a subject, audience, prerequisites, and ordered entries. | `/learn/<topic>/`; topic-aware standard layout. |
| `lesson` | Evergreen explanatory material that teaches a bounded concept. | `/learn/<topic>/<slug>/`; standard article layout. |
| `guide` | Evergreen practical preparation or decision support that does not depend on a live event. | `/learn/<topic>/<slug>/`; standard article layout, clearly not an active CTA. |
| `reference` | Compact, lookup-oriented facts, terminology, formulas, or source links. | `/learn/<topic>/<slug>/`; reference presentation when needed. No current entry requires a new reference route. |
| `case-study` | A durable analysis of a named event, separating observed facts from interpretation and lessons. | `/learn/<topic>/<slug>/`; case-study presentation and provenance. |
| `historical-record` | A preserved record of a completed event or procedure, including useful evidence that is no longer actionable. | `/learn/<topic>/<slug>/`; archive banner, past tense, closed status, and archived-link treatment. |

The #148 implementation centralizes, or otherwise derives, at least these fields:

```text
topic            stable topic key, initially "fork"
order            numeric order within the topic
contentType      topic | lesson | guide | reference | case-study | historical-record
label            navigation/display label
historical       boolean; true for the Moon Fork case study and migration record
status           available | archived | planned
presentation     standard | reference | case-study | historical-record
```

`presentation` is declarative. General layouts must not select a special presentation by testing a slug such as `fork/migration`. `status` controls whether an entry is shown as available, while `historical` and `presentation` control how completed material is framed. `reference` is a Learn content type, not a new top-level `/references` surface: it can provide compact lookups and source links within a topic when a maintained public page is justified.

## Current Learn inventory and destinations

This is the required disposition of every current Learn page. No page is deleted or moved by #146.

| Current file / URL | Primary type | Implemented destination and treatment |
|---|---|---|
| `src/content/learn/fork/index.mdx` — `/learn/fork/` | `topic` | Retained as the Fork topic landing/start-here page; event-specific detail is separated into the appropriate lesson, guide, case study, or archive. |
| `src/content/learn/fork/disputes-and-bonds.mdx` — `/learn/fork/disputes-and-bonds/` | `lesson` | Retained the URL as evergreen protocol education, with claims anchored to maintained protocol knowledge. |
| `src/content/learn/fork/what-to-do.mdx` — `/learn/fork/what-to-do/` | `guide` | Retained the URL and reframed it as preparedness for a future fork; it does not imply that Moon Fork migration is actionable. |
| `src/content/learn/fork/migration.mdx` — `/learn/fork/migration/` | `historical-record` | Retained the URL and screenshots, leads with the final result and closed/archive warning, and labels tools and links as historical interfaces. |

The new generalized migration lesson is intentionally not assigned the existing `migration` slug. Keeping `/learn/fork/migration/` for the historical procedure avoids breaking useful links and makes the distinction between general mechanics and the Moon Fork event explicit.

## Inventory-to-destination mapping

### Existing public knowledge entry points

| Current entry point | Destination / decision |
|---|---|
| Homepage migration/Fork Record experience | Retained as the operational/status surface while relevant and as a factual Fork Record after closure. The completed record links to `/learn/fork/moon-fork/`; the full case study is not duplicated in the hero. |
| `src/pages/faq.astro` — `/faq` | Implemented as the general Augur FAQ. It keeps concise Moon Fork questions in one subsection, links to Learn, the case study, and the archived procedure for depth, and removes expired calls to action. |
| `src/pages/blog/index.astro` — `/blog` | Remains the chronological blog archive. Blog posts are not folded into the Learn navigation merely because they discuss forks. |
| `src/pages/learn/[...slug].astro` — nested Learn routes | Uses typed entries and topic metadata from #148. The existing catch-all route shape serves `/learn/fork/moon-fork/` without a new public route family. |
| Footer and persistent navigation | Includes `/learn` and `/faq` as distinct entry points. The archived migration record has no active-event label. |
| `public/data/fork-risk.json` | Preserve the URL and compatibility fields. It is evidence/input for the live Fork Record, not a replacement for the human-readable retrospective. |

### Existing blog posts

All current blog URLs remain valid and historical. Their destination is still the Blog surface; the related destination column identifies optional links that integration work may add without rewriting the post.

| Current post | Classification | Related destination |
|---|---|---|
| `/blog/augur-cryptos-first-algorithmic-fork/` | Historical fork context | `/learn/fork/moon-fork/` and relevant evergreen Fork lessons |
| `/blog/augur-one-year-in/` | Dated progress/history | Keep in Blog; no migration-route replacement |
| `/blog/augur-reboot-2025/` | Dated roadmap/editorial | Keep in Blog; link to Learn only for durable concepts |
| `/blog/augur-testing-past-building-future/` | Dated editorial/history | `/learn/fork/moon-fork/` when it adds historical context |
| `/blog/augurs-decade/` | Dated progress/history | Keep in Blog |
| `/blog/augurs-revival/` | Dated progress/history | Keep in Blog |
| `/blog/augurs-rising/` | Dated progress/history | Keep in Blog |
| `/blog/generalized-augur/` | Dated protocol/editorial context | Future applicable Learn topic; do not treat the post itself as a lesson |
| `/blog/micahs-augur-fork/` | Historical fork/editorial account | `/learn/fork/moon-fork/` where relevant |
| `/blog/phase-1-the-escalation-game/` | Historical event update | Fork lessons and the Moon Fork case study |
| `/blog/phase-2-the-fork-migration/` | Historical migration update | `/learn/fork/migration/` and `/learn/fork/moon-fork/` |
| `/blog/q1-2026-progress-report/` | Dated progress/update | Keep in Blog; no active migration CTA implied by its historical date |
| `/blog/the-augur-fork-is-here/` | Historical announcement | `/learn/fork/moon-fork/` and the archived procedure |
| `/blog/the-augur-lituus-whitepaper/` | Dated editorial/whitepaper introduction | Existing whitepaper/reference documentation; not a Fork lesson |

This mapping does not authorize content rewrites. Historical blog posts stay at their current URLs and retain their historical voice. Cross-links may provide context, but the case study is the canonical durable account.

## Surface boundaries

### Learn versus FAQ

- **Learn** answers “how does this work?” in ordered, reusable depth. It owns explanations of forks, disputes, migration mechanics, preparedness, and the case study.
- **FAQ** answers “what is the short answer to this common question?” It should use native accessible disclosure behavior, keep answers short, and link to Learn rather than reproducing a lesson.
- `/faq` may retain a focused Moon Fork subsection, but it must not become a migration FAQ or present migration as open.

### Learn versus Blog

- A Learn page is maintained for reuse and has typed topic/order metadata.
- A blog post is dated and records what was announced, observed, or argued at a point in time.
- A blog post can link to Learn; it does not become canonical merely because it is older or more detailed.
- Existing historical posts are preserved, not rewritten as current documentation.

### Evergreen Learn versus event material

Evergreen material can be read without knowing the current event state. It avoids live deadlines, current balances, “act now” language, and event-specific token instructions. The Fork topic remains useful when no fork is active.

Event material names the event and its observation date. The Moon Fork case study is durable historical analysis, while the migration procedure is a historical record of what participants did. Both can preserve facts, screenshots, addresses, and external artifacts, but neither is an active migration guide.

### Case study versus historical record

- The **case study** at `/learn/fork/moon-fork/` explains what happened: trigger, escalation, migration, resolution, observed behavior versus expectation, and lessons. It separates protocol data from interpretation and provides provenance.
- The **historical record** at `/learn/fork/migration/` preserves how the procedure worked, including screenshots and token-address evidence. It leads with the result and closed status, then preserves the procedure for research and troubleshooting.
- The case study links to the record; the record links back to the case study and to generalized migration mechanics.

## Moon Fork and REP evidence policy

The Moon Fork is a completed historical case study, not a blog post and not an active migration guide. The canonical case-study URL is fixed at:

```text
/learn/fork/moon-fork/
```

The case study should contain an executive record, triggering market, escalation timeline, migration participation, resolution, observed-versus-expected behavior, and lessons for Augur/Lituus. It must distinguish protocol facts from interpretation and attach a source/provenance note to dates, addresses, totals, outcomes, and token claims.

The final factual values are sourced from #147's post-deadline verified record. The retrospective uses the winning universe, current REP token, migration deadline, outcome totals, observed block, and authoritative source for each value. If a value cannot be verified, label it unverified rather than inferring it from a migration percentage or an old blog post.

The archived migration page remains the evidence-preserving home for:

- legacy REPv1 and pre-fork REPv2 distinctions;
- the current token identity as verified for the final record;
- historical migration and redemption steps;
- screenshots and links to the historical migration interface;
- dated warnings about exchange, wallet, and network context.

Address and token labels must always identify the chain, historical/current status, and the role of the token. Preserve useful REP evidence even when a tool or exchange link is no longer an active recommendation.

## URL, redirect, and archive conventions

1. **Canonical path first.** Use lowercase kebab-case. Keep `fork` singular. Every page has one canonical URL in metadata and internal links use that URL.
2. **Preserve existing useful URLs.** Existing useful Learn URLs remain in place. In particular, `/learn/fork/migration/` is not renamed or redirected away; it is the historical migration record.
3. **Redirect only after a deliberate move.** If a later implementation genuinely moves a page, retain the old path as an explicit permanent redirect or alias generated by the static build, and test the old path, new path, and canonical metadata. Never silently delete a public content URL.
4. **Do not use redirects to hide the archive.** A historical page with useful evidence remains directly readable. Redirects are for aliases or moved pages, not for replacing the archive with the case study.
5. **Archive in place where possible.** Add a prominent historical/closed status before procedural content, use past tense, state the relevant date or last verification, and mark expired tools and external links as archived interfaces. Do not remove screenshots solely because the procedure is expired.
6. **Redirects are not content migration.** A redirect must not be used to turn a blog post into a Learn page or to make `/learn/fork/migration/` appear to be the evergreen migration lesson. The new evergreen route is `/learn/fork/migration-mechanics/`.
7. **Verify static-host behavior.** Because deployment is static GitHub Pages, #155 verifies generated routes and aliases rather than assuming server-side redirect rules exist.

## Initial Learn catalog

The initial public catalog shows **one available topic: Fork**. It is the only current topic with a coherent set of public entries, and showing it alone is more honest than presenting empty or incomplete topics as finished. The `/learn` hub links to `/learn/fork/` as the start-here path.

The planned topic backlog is recorded for authoring, but is not presented as available content in this milestone:

1. **Augur basics** — audience, protocol components, and terminology.
2. **Prediction markets** — market lifecycle, trading, and settlement.
3. **Reporting and resolution** — reporters, disputes, and settlement beyond the Fork path.
4. **REP and participation** — token roles, incentives, and participation boundaries.
5. **Lituus and protocol evolution** — the relationship between Augur v2, Lituus, and future work.

These names are topic candidates, not promises that their pages exist. A future topic becomes visible only when it has a topic landing page and a coherent available path. This directly satisfies #149's requirement not to present unavailable future material as complete.

## Downstream handoff: #148–#155

| Issue | Decision supplied by this page | Implementation status / boundary |
|---|---|---|
| #148 — Learn model | Implemented centralized topic metadata with `topic`, `order`, `contentType`, `label`, `historical`, `status`, and `presentation`. `fork` remains singular; special pages select presentation declaratively. | Complete. |
| #149 — Learn landing | Implemented `/learn`; it shows Fork as the only available initial topic and links to `/learn/fork/`; future topics remain hidden or explicitly planned, never complete. | Complete. |
| #150 — Evergreen Fork path | Implemented the sequence in this document; added `/learn/fork/migration-mechanics/`; preserved the four existing URLs; routed the Moon Fork event to the case study and the old procedure to the archive. | Complete. |
| #151 — Moon Fork retrospective | Published the case study at `/learn/fork/moon-fork/`, not `/blog` and not `/learn/fork/migration/`; it links to evergreen lessons and the archive and uses #147's verified evidence. | Complete. |
| #152 — Migration archive | Kept `/learn/fork/migration/` in place as `historical-record`; it leads with the final result/closed status, preserves screenshots and REP evidence, labels tools archived, and has no active CTA. | Complete. |
| #153 — General FAQ | Kept `/faq`; it organizes general Augur questions with a focused Moon Fork subsection, keeps answers concise, links to Learn, and never implies migration is open. | Complete. |
| #154 — Integration | Persistent navigation links to `/learn` and `/faq`; the homepage Fork Record links to `/learn/fork/moon-fork/`; the topic, case study, evergreen mechanics, and archive are cross-linked. | Complete. |
| #155 — Release validation | Validated the route table, canonical URLs, old-path preservation, static routes, archive labels, REP terminology, and absence of expired CTAs. | Complete for this release scope; CI wiring is deferred to a later RFC. |

## Review boundaries and unresolved inputs

The architecture choices above are intentionally closed: the case-study route, singular `fork` namespace, archive route preservation, surface boundaries, initial availability policy, and migration-mechanics destination should not be reopened by downstream implementation issues.

The following are not routing options and still require operator/content-owner input:

- **Final Moon Fork facts:** #147 must supply the post-deadline verified record and identify any values that remain unverified.
- **Case-study editorial approval:** a reviewer must approve the interpretation and lessons after the evidence is assembled; unsupported claims must be removed or qualified.
- **Future topic ownership and timing:** the backlog names topics but does not assign authors or promise publication dates.
- **FAQ anchor choice:** #153 may add stable question anchors if useful, but this does not change the `/faq` route or surface boundary.

No route, schema, layout, public content, GitHub issue, redirect, or generated data is changed by this decision document.

## Related documentation

- [[SCHEMA]] — documentation conventions for this page
- [[INDEX]] — documentation catalog
- [[faq-feature]] — current FAQ implementation and entry points
- [[blog-feature]] — current Blog collection and route behavior
- [[migration-guide-feature]] — current migration presentation and assets
- [[post-fork-landing-page-implementation-plan]] — homepage Fork Record and lifecycle constraints
- [[public-data-endpoints]] — public JSON compatibility expectations
- [[technical-architecture]] — current application structure
