# State Management Decision

## Decision
**Use Nanostores for global state and React Context for provider-level state**

## Rationale
- Nanostores provides lightweight global state management
- Works across framework boundaries (Astro, React, Svelte, Vue)
- Simple API for reactive state without Redux complexity
- React Context for provider-specific state (data fetching, feature flags)
- Separates global concerns (theme, UI state) from local concerns (form data, cache)
- Prevents prop drilling in deeply nested component trees

## Implementation

### Global State (Nanostores)
- Located in `src/stores/`
- Used for: theme preferences, user state, global UI state
- Reactive subscriptions in React components
- Minimal and focused per store

### Provider State (React Context)
- Located in `src/providers/`
- Used for data loading, API responses, feature flags
- Wraps component trees with context providers
- Examples:
  - `ForkDataProvider.tsx` - Fork risk data loading + 5-minute refresh
  - `ForkMockProvider.tsx` - Demo mode state (dev-only)

## Critical Rules
- **NEVER** add state logic to rendering components
- **ALWAYS** keep components purely reactive to state
- **ALWAYS** handle initialization logic in stores, NOT component effects
- Stores should be "dumb" - just hold state, subscribers are "smart"
- Component effects should only handle lifecycle concerns (cleanup, subscriptions)

## Pattern Examples

### Nanostores
```typescript
// src/stores/theme.ts
import { atom } from 'nanostores';
export const theme = atom<'light' | 'dark'>('light');

// In component:
const [themeValue] = useAtom(theme);
```

### React Context
```typescript
// src/providers/ForkDataProvider.tsx
const ForkRiskContext = createContext({...});
export function ForkDataProvider({ children }) {
  const [data, setData] = useState(null);
  // Fetch and manage data here
  return <ForkRiskContext.Provider value={{data}}>{children}</ForkRiskContext.Provider>;
}
```

## Related Decisions
- See `frontend-framework.md` for component hydration context
- See `.claude/memory/conventions/component-architecture.md` for implementation patterns
- See `.claude/memory/architecture/fork-risk-system.md` for ForkDataProvider details
