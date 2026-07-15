# Augur Reboot Website

Astro 5.10+ static site with React 19 islands. Deployed to GitHub Pages at `www.augur.net`.

## Knowledge

- Start at `docs/INDEX.md` for any task.
- Read `docs/SCHEMA.md` before writing to docs.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Astro 5.10+ (static output, React islands) |
| UI | React 19 (`client:load` for interactive components) |
| Styling | Tailwind v4 CSS-first |
| Lint | Biome |
| Deploy | GitHub Pages |

## Commands

- `npm run dev` — dev server (check `lsof -ti:4321` first)
- `npm run typecheck` + `npm run lint` + `npm run build` — verify before done

## Constraints

- **Dual tsconfig** — `tsconfig.app.json` (frontend) and `tsconfig.scripts.json` (scripts). Do not merge.
- **File naming** — use lowercase kebab-case filenames; keep component symbols PascalCase inside files.
- **Component cleanup** — audit imports and content usages before moving or deleting components; remove only confirmed-unused modules.
- **No auto-commit** unless instructed.
- `.worktrees/` (gitignored) for git worktrees

## Behavioral Principles

- State assumptions; if uncertain, ask.
- Simpler approach exists → say so.
- Touch only what you must; match existing style.
- Every changed line traces to the request.
