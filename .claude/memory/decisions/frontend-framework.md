# Frontend Framework Decision

## Decision
**Use Astro 5.10+ with React 19 for selective component hydration (islands architecture)**

## Rationale

### Why Astro + React
1. **Static by Default**: Astro server-renders `.astro` files to pure HTML (zero JavaScript)
2. **Selective Hydration**: React components hydrate only when explicitly marked
3. **Performance Balance**: Static site speed + dynamic component capabilities
4. **Modern React**: React 19 with latest hooks, server components patterns
5. **Framework Flexibility**: Can mix Svelte, Vue, or other frameworks on same page
6. **Build-Time Optimization**: Automatic code splitting, CSS tree-shaking

## Implementation

**Component Strategy**:
| File Type | Rendering | JavaScript | Use Case |
|-----------|-----------|------------|----------|
| `*.astro` | Server-only | None | Static layout, content, templates |
| `*.tsx` | Server → Client | Selective | Interactive features, animations |

**Specific Components**:
- Static: `Layout.astro`, `HeroBanner.astro`, `MissionSection.astro`
- Interactive (React with `client:load`):
  - `Intro.tsx` - Typewriter animation (critical path)
  - `PerspectiveGridTunnel.tsx` - 3D WebGL background (critical path)
  - `CrtDisplay.tsx` - Power-on animation (critical path)
  - `ForkMonitor.tsx` - Real-time gauge + stats

**Hydration Directives**:
- `client:load` - Immediate hydration (animations)
- `client:visible` - Hydrate when in viewport (optional)
- `client:only="react"` - Skip server rendering (rarely needed)

## Critical Rules
- **Astro** components (.astro) **NEVER** contain JavaScript logic
- **React** components (.tsx) **ALWAYS** specify hydration directive
- **NEVER** forget hydration directives - component won't be interactive
- **MUST** use `client:load` only for critical animations (first contentful paint)
- **MUST** minimize React bundle by hydrating only what's needed

## TypeScript Configuration
- `tsconfig.app.json` - Type checks frontend (Astro + React)
- `@astrojs/ts-plugin` - Enables importing `.astro` files in `.ts` files
- `npm run typecheck` - Full validation across both configs

## Trade-offs Made

| Choice | Benefit | Cost |
|--------|---------|------|
| Astro Islands | Fast HTML + dynamic components | Learning curve for multi-framework |
| React 19 | Modern patterns, good ecosystem | Extra bundle weight for simple features |
| Selective Hydration | Only load JS where needed | Must carefully choose directives |
| Build-time Data | Type-safe fork risk data | Can't do real-time blockchain queries |

## Related Decisions
- See `styling-architecture.md` for Tailwind CSS integration
- See `state-management.md` for Nanostores + React Context patterns
- See `deployment-architecture.md` for static site build pipeline
