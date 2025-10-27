# Component Architecture Conventions

## Separation of Concerns

### The Core Rule
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
├── components/
│   ├── *.astro              # Server-rendered layout/static
│   ├── *.tsx                # Client-hydrated interactive
│   └── (Fork Risk/other feature folders)
├── providers/
│   └── *Provider.tsx        # React Context providers
├── stores/
│   └── *.ts                 # Nanostores state
```

## Rendering Component Rules

### Rule 1: NO State Logic in Components
```tsx
// ❌ WRONG - State logic in component
export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Trying to handle business logic in effect
    if (count > 10) {
      resetCount();
    }
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
- Subscribe to store changes via useAtom/useContext

```tsx
// ✅ Good - Pure rendering
export function UserProfile() {
  const [user] = useAtom(currentUser);
  const [isLoading] = useAtom(loadingState);

  return (
    <>
      {isLoading && <Spinner />}
      {user && <div>{user.name}</div>}
    </>
  );
}
```

### Rule 3: NO Defensive Code Violating Separation
```tsx
// ❌ WRONG - Component checking URL to initialize state
export function Dashboard() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Violates separation: component shouldn't handle initialization
    const slug = new URL(location).searchParams.get('slug');
    loadData(slug);
  }, []);
}

// ✅ CORRECT - Store handles initialization
// In store:
export const dashboard = atom(null);
if (typeof window !== 'undefined') {
  const slug = new URL(location).searchParams.get('slug');
  loadData(slug).then(data => dashboard.set(data));
}

// In component:
export function Dashboard() {
  const [data] = useAtom(dashboard);
  return <div>{/* render data */}</div>;
}
```

## Store Patterns

### Global State Store
```typescript
// src/stores/theme.ts
import { atom } from 'nanostores';

export const theme = atom<'light' | 'dark'>('light');

// Optionally add actions
export function toggleTheme() {
  theme.set(theme.get() === 'light' ? 'dark' : 'light');
}
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

  // Initialize data loading here, not in components
  useEffect(() => {
    fetchForkData().then(setData).finally(() => setLoading(false));

    // 5-minute auto-refresh
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
// Rendering component - pure reactivity
export function ForkGauge() {
  const { data } = useContext(ForkRiskContext);
  return <svg>{/* render data */}</svg>;
}
```

## Props and Interfaces

### Component Props Pattern
```tsx
interface Props {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Input({ value, onChange = () => {}, disabled = false, className = '' }: Props) {
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

### Class Props Pattern
```tsx
// Allow parent to pass classes
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card-base ${className || ''}`}>{children}</div>;
}
```

## Lifecycle Concerns

### Only Use Effects For Cleanup
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

### Never Use Effects for Business Logic
```tsx
// ❌ WRONG - Effect for business logic
useEffect(() => {
  if (forceRiskLevel === 'critical') {
    sendAlert();
  }
}, [forceRiskLevel]);

// ✅ CORRECT - Business logic in store, component just renders
const { forceRiskLevel } = useContext(ForkRiskContext);
return forceRiskLevel === 'critical' ? <CriticalAlert /> : null;
```

## Testing Component Patterns

### Testable Component
```tsx
// Props-based, no internal state = easy to test
export function RiskGauge({ risk = 0, size = 'md' }: { risk?: number; size?: 'sm' | 'md' | 'lg' }) {
  return <svg className={`gauge-${size}`}>{/* render */}</svg>;
}

// Test: just pass different props
<RiskGauge risk={25} size="lg" />
```

## Related Decisions
- See `decisions/state-management.md` for architectural rationale
- See `.claude/memory/architecture/components.md` for detailed examples
- See `.claude/memory/architecture/fork-risk-system.md` for real-world example
