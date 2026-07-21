---
name: blogging
description: Use when creating, editing, reviewing, integrating, validating, or handling publication requests for blog posts under src/content/blog, including MDX, frontmatter, assets, and diagnostics.
---

# Blog Content Integration and Validation

Use repository mechanics to integrate and validate human-owned blog content. This skill does not supply editorial voice or authorize publication.

## Authority

- Humans own copy, facts, tone, metadata choices, approval, and publication decisions.
- `src/content/config.ts` defines accepted content data.
- `npm run lint:blog` defines mechanical blog requirements. This skill explains the workflow rather than restating its rules.
- `publishDate` is metadata only; it does not schedule, hide, or publish a post.

## Workflow

1. Inspect the current schema and the supplied post, metadata, and assets.
2. Place the post at `src/content/blog/<lowercase-kebab-case-slug>/index.mdx` with its assets co-located and referenced relatively.
3. Preserve supplied copy unless the human explicitly requests editorial changes. Follow bounded requests using standalone instructions or supplied sources; do not read neighboring prose to infer a house voice.
4. Run focused diagnostics:

   ```bash
   npm run lint:blog -- --changed
   ```

5. Resolve blocking errors. Report observations with their measurements. An observation alone does not authorize rewriting; apply editorial changes only when explicitly requested.
6. Verify affected routes, assets, metadata, and RSS behavior when the requested work touches those surfaces.

## Verification

Run every command in the matching suite. For mixed content and tooling changes, use the diagnostics or skill suite.

For blog content changes:

```bash
npm run lint:blog -- --changed
npm run typecheck
npm run lint
npm run build
```

For diagnostics or skill changes:

```bash
npm run test:blog-lint
npm run lint:blog
npm run typecheck:scripts
npm run typecheck
npm run lint
npm run build
```

## Boundaries

- Ask when required content, metadata, assets, sources, or editorial instructions are missing. Do not invent editorial decisions; explicit bounded edits are allowed.
- Learn content is outside this skill.
- Passing diagnostics or builds validates integration only. It does not approve publication.
- Do not introduce draft state, scheduling, publication filtering, deployment, or automatic publishing as part of content integration.

For architecture and rule details, read `docs/blog-feature.md`.
