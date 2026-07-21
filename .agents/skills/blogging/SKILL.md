---
name: blogging
description: Use when creating, editing, reviewing, integrating, or validating blog posts under src/content/blog, including blog MDX, frontmatter, and post assets.
---

# Blog Integration

Use this skill only for blog posts under `src/content/blog/`. Learn content is outside this workflow.

## Authority and boundaries

- Humans own prose, facts, tone, approval, and publication decisions.
- Preserve human-supplied copy. Editorial writing and corpus style imitation are outside this integration skill.
- Never read neighboring posts to derive or imitate tone, including when asked for an “Augur voice.” Require human-supplied copy or standalone explicit instructions that do not depend on corpus style mining.
- Explicitly requested factual verification or bounded wording edits remain allowed when the human supplies the facts, sources, or standalone editing instructions; they do not authorize reading neighboring prose for tone.
- If copy or standalone instructions are insufficient, ask the human rather than inventing prose or deriving a house style.
- `src/content/config.ts` is the runtime schema authority.
- `npm run lint:blog` is the mechanical diagnostics authority. This skill is workflow guidance, not a second schema or rules definition.
- `publishDate` is ordinary metadata. A future date does not schedule, hide, publish, or otherwise change post availability.
- Diagnostics observations are nonblocking measurements and never authorize automatic rewriting.
- Passing diagnostics, typechecks, previews, or builds validates integration only; it never approves or authorizes publication.
- Do not add draft state, scheduling, publication filtering, deployment steps, or automatic publishing behavior.

## Integrate a blog post

1. Keep each post in `src/content/blog/<lowercase-kebab-case-slug>/index.mdx`.
2. Preserve the copy and metadata supplied by the human. Ask when required information or standalone editing instructions are missing rather than inventing prose or mining neighboring posts.
3. Add the required `featured-image.webp` in the same post directory. Keep other post images co-located and use relative references with meaningful supplied alt text.
4. Check the current runtime schema in `src/content/config.ts`; do not rely on copied schema text in this skill.
5. Run blog diagnostics before broader project validation:

   ```bash
   npm run lint:blog
   ```

6. Preview or build only when the requested integration needs rendering verification. Diagnostics do not replace Astro's MDX/schema/build checks.

## Edit or review a blog post

- Limit changes to the requested post and assets.
- Preserve existing prose and metadata outside the requested edit.
- Report mechanical diagnostics as facts with rule IDs and thresholds. Do not characterize prose as good or bad, and do not automatically rewrite it.
- Use changed-post mode for focused local observations while retaining collection-wide integrity checks:

  ```bash
  npm run lint:blog -- --changed
  ```

## Validate

Run:

```bash
npm run test:blog-lint
npm run lint:blog
npm run typecheck
npm run lint
npm run build
```

- Errors from `lint:blog` are blocking mechanical failures.
- Warnings are nonblocking measurements or observations.
- Astro remains authoritative for full MDX, content schema, and build behavior.
- A human remains responsible for editorial approval and the decision to publish.

For architecture and command details, read `docs/blog-feature.md`.
