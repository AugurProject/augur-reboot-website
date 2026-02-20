---
name: island-state
description: This skill should be used when the user asks to "add global state", "create a store", "use Nanostores", "share state between components", "manage reactive state", "add a provider", "create a context", "initialize state", or needs help with state management patterns across React islands in this static site.
---

# Island State

State management in this project follows a strict pattern: **Nanostores for simple reactive state, React Context for complex domain state**. Components are purely reactive — they never own or initialize state themselves.

This matters especially in a static site with React islands. Islands are independent — there is no shared React tree. Nanostores solves this by living outside React entirely, making state accessible to any island.

## Two Patterns in Use

### 1. Nanostores — Simple reactive state

Use for UI state, flags, or simple values that multiple components need to react to.

```typescript
// src/stores/animationStore.ts
import { atom } from 'nanostores'

export const $appStore = atom<AppState>(getInitialState())
```

Consumers subscribe directly (not via `useAtom` — the project uses `.subscribe()` pattern):

```typescript
// In a React component
useEffect(() => {
  const unsubscribe = $appStore.subscribe((state) => {
    setIsVisible(state.uiState === UIState.MAIN_CONTENT)
  })

  // Initialize with current value
  const current = $appStore.get()
  setIsVisible(current.uiState === UIState.MAIN_CONTENT)

  return unsubscribe
}, [])
```

Update the store via action functions defined in the store file:

```typescript
// Defined in animationStore.ts, called from anywhere
appActions.completeBootSequence()
appActions.skipToMainContent()
```

### 2. React Context — Complex domain state

Use for domain objects with multiple related values, async loading, and error states. The fork data is the primary example.

```tsx
// src/providers/ForkDataProvider.tsx
const ForkDataContext = createContext<ForkDataContextValue | undefined>(undefined)

export const ForkDataProvider = ({ children }) => {
  // async fetching, loading state, error handling, refresh interval
  return (
    <ForkDataContext.Provider value={contextValue}>
      {children}
    </ForkDataContext.Provider>
  )
}

export const useForkData = () => {
  const context = useContext(ForkDataContext)
  if (!context) throw new Error('useForkData must be used within ForkDataProvider')
  return context
}
```

## Key Rules

**Never initialize state in a component.** Initialization logic belongs in the store or provider:

```typescript
// ✓ Correct — initialization in store file
const getInitialState = (): AppState => {
  if (typeof window !== 'undefined') {
    // read URL params, decide initial state
  }
  return { uiState: UIState.BOOT_SEQUENCE }
}

export const $appStore = atom<AppState>(getInitialState())
```

```typescript
// ✗ Wrong — initialization in component useEffect
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  setState({ skipIntro: params.get('intro') === 'false' })
}, [])
```

**Never use `useState` for shared state.** Local component state (e.g., `isVisible` derived from a store) is fine. But the source of truth lives in the store or context, not in a component.

**Guard for SSR.** Nanostores run on the server during Astro's build. Any browser API access must be guarded:

```typescript
if (typeof window !== 'undefined') {
  // safe to use window, location, URLSearchParams
}
```

## Add a New Nanostores Atom

1. Create or update a file in `src/stores/`
2. Define the type, initial value, and any action functions
3. Export the store with `$` prefix convention (`$myStore`)
4. Import and use in components via `.subscribe()` + `.get()`

```typescript
// src/stores/myStore.ts
import { atom } from 'nanostores'

export type MyState = { active: boolean }

const getInitialState = (): MyState => ({ active: false })

export const $myStore = atom<MyState>(getInitialState())

export const myActions = {
  activate(): void {
    $myStore.set({ active: true })
  },
  deactivate(): void {
    $myStore.set({ active: false })
  }
}
```

## Add a New Context Provider

Use when you need async data, loading/error states, or multiple related values that belong together.

1. Create the context, provider component, and custom hook in `src/providers/`
2. Wrap the island entry point (not individual components) with the provider
3. Consume via the custom hook inside the tree

See `references/provider-patterns.md` for the full template and real examples.

## Additional Resources

- **`references/provider-patterns.md`** — Context provider template, nesting pattern, real examples from ForkDataProvider and ForkMockProvider
- **`references/store-patterns.md`** — Nanostores patterns, SSR guards, action function conventions
