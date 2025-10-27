# Component Architecture

## Overview

The project uses a hybrid Astro + React architecture with selective client-side hydration:
- **Astro Components** (.astro) - Server-rendered, static output
- **React Components** (.tsx) - Client-hydrated for interactivity
- **Hydration Directives** - `client:load` (eager), `client:only` (client-only)

## Project Structure

```
src/components/
├── Core UI Components
│   ├── Intro.tsx              # Terminal-style intro with typewriter effects
│   ├── CrtDisplay.tsx         # CRT monitor simulation with animations
│   ├── PerspectiveGridTunnel  # 3D animated grid background (WebGL)
│   ├── TypewriterSequence.tsx # Sequential text animation system
│   ├── HeroBanner.astro       # Main hero section with social links
│   └── MissionSection.astro   # Technical specification sections
│
└── Fork Risk Monitoring
    ├── ForkMonitor.tsx        # Main component integrating gauge + stats + controls
    ├── ForkGauge.tsx          # SVG-based animated percentage gauge (0-100%)
    ├── ForkStats.tsx          # Data grid: risk level, REP staked, dispute count
    ├── ForkDisplay.tsx        # Display orchestration (gauge + stats)
    ├── ForkControls.tsx       # Dev-only demo mode controls (F2 shortcut)
    ├── ForkBadge.tsx          # Fork status badge component
    ├── ForkDataProvider.tsx    # Context provider: data loading + 5min refresh
    └── ForkMockProvider.tsx    # Context provider: demo mode state (dev-only)
```

## Pages Structure

| Page | File | Purpose |
|------|------|---------|
| Homepage | `index.astro` | Landing with intro sequence + hero banner |
| Mission | `mission.astro` | Protocol roadmap + technical details |
| Layout | `Layout.astro` | Base HTML + global styles + fonts |

## Hydration Strategy

**Astro Static Components** (no JavaScript):
- `HeroBanner.astro` - Pure HTML markup
- `MissionSection.astro` - Static content display
- `Layout.astro` - Base layout wrapper

**React Interactive Components** (hydrated):
- `Intro.tsx` with `client:load` - Eager typewriter animation
- `PerspectiveGridTunnel.tsx` with `client:load` - 3D background
- `CrtDisplay.tsx` with `client:load` - Power animations
- `ForkMonitor.tsx` with `client:load` - Full fork risk system

## Custom Utilities

From `src/styles/global.css`:

```css
fx-glow           /* Drop shadow with primary color glow */
fx-glow-sm|lg     /* Variable glow sizes */
fx-box-glow       /* Box shadow glow effect */
fx-box-glow-sm|lg /* Sizes */
```

## Key Patterns

### State Management
- Use Nanostores (`src/stores/`) for global state
- React Context for provider-level state (ForkDataProvider, ForkMockProvider)
- Never add state logic to rendering components

### Component Props
```typescript
// Always use interfaces
interface Props {
  value: number;
  onComplete?: () => void;
}

// Destructure and use defaults
const { value, onComplete = () => {} } = Astro.props;
```

### WebGL Resource Cleanup
Components using WebGL (PerspectiveGridTunnel):
```typescript
useEffect(() => {
  return () => {
    dispose(); // Clean up GPU resources
  };
}, []);
```

## Component Lifecycle

1. **Build Time**: Astro pre-renders .astro files to static HTML
2. **Server Time**: Hydration directives mark which components to hydrate
3. **Client Time**: React hydrates marked components with JavaScript
4. **Runtime**: Components subscribe to Nanostores for state updates

## References

- **Styling**: See `src/styles/global.css` for Tailwind v4 setup
- **View Transitions**: `.claude/memory/architecture/view-transitions.md`
- **Fork Risk**: `.claude/memory/architecture/fork-risk-system.md`
