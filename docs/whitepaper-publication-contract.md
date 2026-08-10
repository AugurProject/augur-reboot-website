---
title: Whitepaper Publication Contract
tags: [whitepapers, public-knowledge, provenance, routing, llm]
---

# Whitepaper Publication Contract

## Decision status

Accepted for the Public Whitepaper Editions roadmap tracked by [#170](https://github.com/AugurProject/augur-reboot-website/issues/170). This contract extends [[public-knowledge-architecture]] and governs the reusable framework in [#173](https://github.com/AugurProject/augur-reboot-website/issues/173), discovery work in [#174](https://github.com/AugurProject/augur-reboot-website/issues/174), and release validation in [#176](https://github.com/AugurProject/augur-reboot-website/issues/176).

## Authority and ownership

The canonical repository and its release artifacts remain authoritative. The website is a publication and presentation layer; it does not replace, fork, or become the source of record for a paper.

The website may own:

- navigable HTML editions;
- raw Markdown representations;
- responsive layouts and section navigation;
- math, footnote, reference, and figure presentation;
- accessibility metadata and figure descriptions;
- provenance, discovery, and LLM-facing indexes.

The website must not:

- host or proxy copied source PDFs;
- describe generated Markdown as more authoritative than upstream;
- silently rewrite substantive claims;
- use the contributor-only `docs/` directory as a public route namespace.

## Canonical Augur v2 source

| Property | Value |
|---|---|
| Repository | `https://github.com/AugurProject/whitepaper` |
| Release | `v2.0.16` |
| Source revision | `69accf630d20af5aee5ff3d78fcf6560f069ccfd` |
| Original PDF | `https://github.com/AugurProject/whitepaper/releases/download/v2.0.16/augur-whitepaper-v2.pdf` |
| PDF SHA-256 | `2c512f2b2ede5740a7c088cad77ca7dbcde6f12378a3bc239c239dc66201f4ed` |

Publication metadata must pin a release and revision. It must not depend only on a moving `latest` URL or default branch.

## Route contract

| Route | Representation | Purpose |
|---|---|---|
| `/whitepapers/` | HTML | Discovery listing for published editions |
| `/whitepapers/augur-v2/` | HTML | Canonical internal Augur v2 web edition |
| `/whitepapers/augur-v2/<section>/` | HTML | Canonical internal section page |
| `/whitepapers/augur-v2/index.md` | Markdown | Raw edition index and table of contents |
| `/whitepapers/augur-v2/<section>.md` | Markdown | Raw section representation |
| `/whitepapers/augur-v2/figures/<filename>` | Image | Edition figure used by HTML and relative Markdown links |

Lowercase kebab-case paths and trailing slashes are required for HTML pages. Raw Markdown uses a literal `.md` suffix. The route family must be edition-driven rather than implemented as Augur-v2-only page components.

The rejected `/docs/augur-whitepaper-v2/` experiment was never a public contract and requires no redirect unless release evidence later shows that it was deployed or externally indexed.

## Representation and canonical rules

- Internal HTML is the canonical web representation and uses a self-referencing canonical URL.
- Raw Markdown is an alternate representation, not the SEO canonical page.
- HTML pages should advertise the corresponding Markdown representation where the layout supports alternate links.
- Only canonical HTML pages belong in the human-facing sitemap unless release validation establishes a reason to include raw representations.
- The upstream PDF is labeled as the authoritative original, but it is not used as the HTML page's SEO canonical URL.
- Provenance must separately identify the internal HTML, internal Markdown, upstream PDF, and upstream source repository.

## Link semantics

The destination follows the meaning of the link, not merely the availability of a PDF:

| Link meaning | Destination |
|---|---|
| Paper title, general citation, “whitepaper,” or “read the paper” | Internal HTML edition |
| Citation to a known passage | Internal section or stable section anchor when practical |
| “View original PDF,” “Download original PDF,” or explicit PDF citation | Direct upstream release PDF |
| “Source repository” or source-code action | Upstream repository |
| Raw or LLM-readable Markdown action | Corresponding internal `.md` representation |

`/whitepapers/` is a discovery hub, not an interstitial for links that already know which edition they reference.

Before an internal edition is published, an existing generic link may continue to point directly upstream. Discovery issue #174 converts those links only after the internal routes pass their publication gate.

## Fidelity and correction policy

- Preserve substantive wording, claims, assumptions, notation, citations, and ordering.
- Correct clear extraction artifacts such as lost hyphens, page-break sentence splits, broken ligatures, and malformed math.
- Do not silently alter an upstream factual or editorial error.
- Record any substantive correction or clarification in edition provenance.
- Validate prose in both directions so that additions and omissions are both detectable.
- Compare structural elements, equations, footnotes, bibliography entries, and figures separately; prose overlap alone is insufficient.

The completed Augur v2 validation evidence and reusable checklist live in [#171](https://github.com/AugurProject/augur-reboot-website/issues/171).

## Figure policy

Figures may be stored as web presentation assets when they are faithful derivatives of canonical upstream figures. Each published figure must:

- correspond to a named upstream asset or a verified rendering from the source PDF;
- preserve the original caption and placement;
- include useful alternative text;
- resolve from both HTML and raw Markdown;
- avoid presenting a modified diagram as the original without disclosure.

A figure derivative is not a locally hosted copy of the source PDF.

## Machine discovery

`/llms.txt` should list each representation explicitly:

- HTML edition;
- raw Markdown index and sections;
- authoritative upstream PDF;
- upstream source repository.

Labels must make authority and format clear. Machine discovery is added only after the corresponding routes exist and pass validation.

## Publication gate

An edition remains branch-only until all of the following are true:

1. Source release, revision, URL, and digest are pinned.
2. Transcription fidelity has passed the reusable validation checklist.
3. HTML, Markdown, figure, and navigation routes are stable.
4. No local PDF or PDF-serving route is shipped.
5. Generic and explicit links follow the link-semantics table.
6. Accessibility, responsive layout, metadata, canonical URLs, sitemap behavior, and `llms.txt` pass release review.
7. Typecheck, lint, tests, and production builds pass.

## Second-edition boundary

The Lituus paper is the repeatability test tracked by [#175](https://github.com/AugurProject/augur-reboot-website/issues/175). It may expose missing abstractions, but it must not force premature generalization into the first framework PR. Publishing Lituus is separate from proving that the ingestion and validation workflow can support it.
