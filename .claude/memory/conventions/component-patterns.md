# Component Patterns Conventions

## Hybrid Architecture Overview

The project uses a hybrid Astro + React architecture with selective client-side hydration:
- **Astro Components** (.astro) - Server-rendered, static output
- **React Components** (.tsx) - Client-hydrated for interactivity
- **Hydration Directives** - `client:load` (eager), `client:only` (client-only)

## Project Structure

**Component Directory**:
```
src/components/
├── Core UI Components
│   ├── Intro.tsx              # Terminal-style intro with typewriter effects
│   ├── CrtDisplay.tsx         # CRT monitor simulation with animations
│   ├── PerspectiveGridTunnel  # 3D animated grid background (WebGL)
│   ├── TypewriterSequence.tsx # Sequential text animation system
│   ├── HeroBanner.astro       # Main hero section with social links
│   └── MissionSection.astro   # Technical specification sections
├── Fork Risk Monitoring
│   ├── ForkMonitor.tsx        # Main component integrating gauge + stats
│   ├── ForkGauge.tsx          # SVG-based animated percentage gauge
│   ├── ForkStats.tsx          # Data grid: risk level, REP, disputes
│   ├── ForkDisplay.tsx        # Orchestration (gauge + stats)
│   ├── ForkControls.tsx       # Dev-only demo mode controls
│   ├── ForkBadge.tsx          # Fork status badge
│   ├── ForkDataProvider.tsx    # Data loading + 5min refresh
│   └── ForkMockProvider.tsx    # Demo mode state (dev-only)
├── providers/
│   └── *Provider.tsx          # React Context providers
└── stores/
    └── *.ts                   # Nanostores state
```

**Pages**:
| Page | File | Purpose |
|------|------|---------|
| Homepage | `index.astro` | Landing with intro + hero banner |
| Mission | `mission.astro` | Protocol roadmap + technical details |
| Layout | `Layout.astro` | Base HTML + global styles |

## Hydration Strategy

**Astro Static Components** (no JavaScript):
- `HeroBanner.astro`, `MissionSection.astro`, `Layout.astro` - Pure HTML

**React Interactive Components** (hydrated with `client:load`):
- `Intro.tsx` - Typewriter animation
- `PerspectiveGridTunnel.tsx` - 3D background
- `CrtDisplay.tsx` - Power animations
- `ForkMonitor.tsx` - Full fork risk system

## Separation of Concerns

### Core Rules
- **State belongs in stores, NOT in rendering components**
- **Rendering components react to state changes only**
- **Initialization logic belongs in stores, NOT in component effects**

This maintains clean separation between:
- **State Layer**: Stores (Nanostores, React Context) - manage data and initialization
- **Presentation Layer**: Components - render based on state, emit events

## Component Organization

### File Naming
- **Astro components**: `FileName.astro` - server-rendered, static
- **React components**: `FileName.tsx` - client-hydrated, interactive
- **Providers**: `NameProvider.tsx` - context providers for state
- **Stores**: `storeName.ts` - Nanostores state management

### Directory Structure
```
src/
├── components/          # Component files
├── providers/           # React Context providers
├── stores/              # Nanostores state
├── styles/global.css    # Tailwind v4 configuration
├── assets/              # Static resources (SVGs, images)
├── lib/                 # Shared utilities
└── pages/               # Route definitions
```

## Rendering Component Rules

### Rule 1: NO State Logic in Components
```tsx
// ❌ WRONG - State logic in component
export function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count > 10) resetCount();
  }, [count]);
  return <div>{count}</div>;
}

// ✅ CORRECT - State in store, component just renders
import { useAtom } from 'nanostores';
import { count } from '../stores/counter';

export function Counter() {
  const [value] = useAtom(count);
  return <div>{value}</div>;
}
```

### Rule 2: Pure Reactivity to State
Components should only:
- Receive state from stores/context via hooks
- Render based on that state
- Emit user events (onClick, onChange, etc.)

```tsx
// ✅ Good - Pure rendering
export function UserProfile() {
  const [user] = useAtom(currentUser);
  const [isLoading] = useAtom(loadingState);
  return <>
    {isLoading && <Spinner />}
    {user && <div>{user.name}</div>}
  </>;
}
```

### Rule 3: NO Defensive Code Violating Separation
```tsx
// ❌ WRONG - Component checking URL for initialization
export function Dashboard() {
  useEffect(() => {
    const slug = new URL(location).searchParams.get('slug');
    loadData(slug);
  }, []);
}

// ✅ CORRECT - Store handles initialization
export const dashboard = atom(null);
if (typeof window !== 'undefined') {
  const slug = new URL(location).searchParams.get('slug');
  loadData(slug).then(data => dashboard.set(data));
}
```

## State Management Patterns

### Global State (Nanostores)
```typescript
// src/stores/theme.ts
import { atom } from 'nanostores';
export const theme = atom<'light' | 'dark'>('light');

export function toggleTheme() {
  theme.set(theme.get() === 'light' ? 'dark' : 'light');
}

// In component:
const [themeValue] = useAtom(theme);
```

### Store with Initialization
```typescript
// src/stores/user.ts
import { atom } from 'nanostores';
export const user = atom(null);

// Initialize in store, not in components
if (typeof window !== 'undefined') {
  fetchCurrentUser().then(u => user.set(u));
}
```

## Provider Patterns

### Data Loading Provider
```tsx
// src/providers/ForkDataProvider.tsx
export const ForkRiskContext = createContext(null);

export function ForkDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForkData().then(setData).finally(() => setLoading(false));
    const interval = setInterval(fetchForkData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ForkRiskContext.Provider value={{ data, loading }}>
      {children}
    </ForkRiskContext.Provider>
  );
}
```

### Component Using Provider
```tsx
// Pure reactivity - no initialization logic
export function ForkGauge() {
  const { data } = useContext(ForkRiskContext);
  return <svg>{/* render data */}</svg>;
}
```

## Component Props Patterns

### React Component Props
```tsx
interface Props {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Input({
  value,
  onChange = () => {},
  disabled = false,
  className = ''
}: Props) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    />
  );
}
```

### Astro Component Props
```astro
---
interface Props {
  name: string;
  greeting?: string;
}
const { greeting = "Hello", name } = Astro.props;
---
```

### Class Passthrough
```tsx
export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode
}) {
  return <div className={`card-base ${className || ''}`}>{children}</div>;
}
```

## Lifecycle Patterns

### Effects for Cleanup ONLY
```tsx
// ✅ Good - Effects for setup/cleanup only
export function AnimatedGauge({ value }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const gauge = new GaugeController(canvasRef.current);
    gauge.setValue(value);

    return () => {
      gauge.dispose(); // Cleanup GPU resources
    };
  }, []);

  return <canvas ref={canvasRef} />;
}
```

### NEVER Use Effects for Business Logic
```tsx
// ❌ WRONG - Effect for business logic
useEffect(() => {
  if (forceRiskLevel === 'critical') sendAlert();
}, [forceRiskLevel]);

// ✅ CORRECT - Business logic in store, component just renders
const { forceRiskLevel } = useContext(ForkRiskContext);
return forceRiskLevel === 'critical' ? <CriticalAlert /> : null;
```

## Custom Utilities

From `src/styles/global.css`:
```css
fx-glow           /* Drop shadow with primary color glow */
fx-glow-sm        /* Small glow */
fx-glow-lg        /* Large glow */
fx-box-glow       /* Box shadow glow effect */
fx-box-glow-sm|lg /* Variable box glow sizes */
```

## Component Lifecycle

1. **Build Time**: Astro pre-renders .astro files to static HTML
2. **Server Time**: Hydration directives mark which components to hydrate
3. **Client Time**: React hydrates marked components with JavaScript
4. **Runtime**: Components subscribe to Nanostores for state updates

## Testable Components

Props-based components with no internal state are easiest to test:
```tsx
export function RiskGauge({
  risk = 0,
  size = 'md'
}: {
  risk?: number;
  size?: 'sm' | 'md' | 'lg'
}) {
  return <svg className={`gauge-${size}`}>{/* render */}</svg>;
}

// Test: just pass different props
<RiskGauge risk={25} size="lg" />
```

## Related Documentation

- See `decisions/state-management.md` for architectural rationale
- See `.claude/memory/architecture/fork-risk-system.md` for real-world example
- See `styling-standards.md` for Tailwind v4 setup in global.css
- See `resource-management.md` for WebGL cleanup patterns
