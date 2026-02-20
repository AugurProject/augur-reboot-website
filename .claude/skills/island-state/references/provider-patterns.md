# React Context Provider Patterns

## When to Use Context vs Nanostores

| Nanostores | React Context |
|-----------|---------------|
| Simple flags and UI state | Complex domain objects with multiple values |
| Single value or small struct | Async data with loading + error states |
| Shared across all islands | Scoped to a component subtree |
| No async operations | Fetching, refresh intervals, callbacks |

Examples from this project:
- `$appStore` (animation state) → Nanostores
- `ForkDataProvider` (live blockchain data, loading, error, refetch) → Context
- `ForkMockProvider` (demo data overrides) → Context

## Provider Template

```tsx
import type React from 'react'
import { createContext, useContext, useState, useEffect } from 'react'

// 1. Define the context value type
interface MyContextValue {
  data: MyData
  isLoading: boolean
  error?: string
  refresh: () => void
}

// 2. Create the context (undefined default enforces provider usage)
const MyContext = createContext<MyContextValue | undefined>(undefined)

// 3. Define provider props
interface MyProviderProps {
  children: React.ReactNode
}

// 4. Create the provider component
export const MyProvider = ({ children }: MyProviderProps): React.JSX.Element => {
  const [data, setData] = useState<MyData>(defaultData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const result = await loadMyData()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <MyContext.Provider value={{ data, isLoading, error, refresh: fetchData }}>
      {children}
    </MyContext.Provider>
  )
}

// 5. Create the custom hook (throws if used outside provider)
export const useMyData = (): MyContextValue => {
  const context = useContext(MyContext)
  if (!context) throw new Error('useMyData must be used within MyProvider')
  return context
}
```

## Provider Nesting

Providers wrap at the island entry point, not deep in the component tree. The fork monitor shows the pattern:

```tsx
// ForkMonitor.tsx — island entry point
export const ForkMonitor: React.FC = () => (
  <ForkDataProvider>        {/* outer: loads live data */}
    <ForkMockProvider>      {/* inner: can override with demo data */}
      <ForkDisplay />       {/* consumer: reads from both */}
    </ForkMockProvider>
  </ForkDataProvider>
)
```

In Astro, this island is used with `client:load`:

```astro
<ForkMonitor client:load />
```

## Consuming Nested Providers

Inner providers can consume outer ones. `ForkMockProvider` reads from `ForkDataProvider`:

```tsx
export const ForkMockProvider = ({ children }: ForkMockProviderProps) => {
  const { setData } = useForkData()  // ← consumes outer provider

  const generateScenario = useCallback((scenario: DisputeBondScenario) => {
    if (!isDemoAvailable) return
    const demoData = generateDemoForkRiskData(scenario)
    setData(demoData)  // ← overrides outer provider's data
  }, [setData])

  // ...
}
```

## Production Guards

For dev-only features, guard with `import.meta.env.PROD`:

```tsx
const isDemoAvailable = !import.meta.env.PROD

const generateScenario = useCallback((scenario) => {
  if (!isDemoAvailable) return  // no-op in production
  // demo logic
}, [isDemoAvailable])
```

This pattern is safe — the code exists in production builds but the feature is disabled. No separate production/development file splits needed.

## Hydration Timing

Context providers run before the child tree renders. For data that should not cause hydration mismatches, defer loading until after mount:

```tsx
const [hasHydrated, setHasHydrated] = useState(false)

// Marks that we're running client-side
useEffect(() => {
  setHasHydrated(true)
}, [])

// Load data only after hydration
useEffect(() => {
  if (hasHydrated) {
    fetchData()
    const interval = setInterval(fetchData, updateInterval)
    return () => clearInterval(interval)
  }
}, [hasHydrated])
```

This prevents SSR/client mismatch for loading states.
