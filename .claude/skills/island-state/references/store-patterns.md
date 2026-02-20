# Nanostores Patterns

## Basic Atom

```typescript
import { atom } from 'nanostores'

export const $counter = atom<number>(0)
```

## Typed State with Initial Value Function

Always use a function for initialization if you need browser APIs:

```typescript
import { atom } from 'nanostores'

export interface UIState {
  isMenuOpen: boolean
  activeTab: string
}

const getInitialState = (): UIState => {
  // Safe to read from localStorage, URL params, etc. here
  if (typeof window !== 'undefined') {
    const savedTab = localStorage.getItem('activeTab')
    if (savedTab) return { isMenuOpen: false, activeTab: savedTab }
  }
  return { isMenuOpen: false, activeTab: 'overview' }
}

export const $uiStore = atom<UIState>(getInitialState())
```

## Action Functions

Group mutations as named functions alongside the store:

```typescript
export const uiActions = {
  openMenu(): void {
    const current = $uiStore.get()
    $uiStore.set({ ...current, isMenuOpen: true })
  },

  closeMenu(): void {
    const current = $uiStore.get()
    $uiStore.set({ ...current, isMenuOpen: false })
  },

  setActiveTab(tab: string): void {
    const current = $uiStore.get()
    $uiStore.set({ ...current, activeTab: tab })
  }
}
```

## Reading the Store in React

The project uses `.subscribe()` + `.get()` pattern (not `useAtom`):

```typescript
import { useState, useEffect } from 'react'
import { $uiStore } from '../stores/uiStore'

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Subscribe to future changes
    const unsubscribe = $uiStore.subscribe((state) => {
      setIsMenuOpen(state.isMenuOpen)
    })

    // Sync with current value immediately
    setIsMenuOpen($uiStore.get().isMenuOpen)

    // Cleanup on unmount
    return unsubscribe
  }, [])

  return <nav data-open={isMenuOpen}>...</nav>
}
```

## SSR Safety

Nanostores atoms are created during Astro's build (server-side). Any browser API access must be guarded:

```typescript
// ✓ Safe — guarded
const getInitialState = () => {
  if (typeof window !== 'undefined') {
    return { path: window.location.pathname }
  }
  return { path: '/' }
}

// ✗ Unsafe — throws during build
const getInitialState = () => ({
  path: window.location.pathname  // ReferenceError: window is not defined
})
```

## Naming Convention

Stores use `$` prefix to distinguish them from regular variables:

```typescript
export const $appStore = atom<AppState>(...)   // ✓
export const appStore = atom<AppState>(...)    // ✗ — missing $
```

## Real Project Example: animationStore.ts

```typescript
import { atom } from 'nanostores'

export enum UIState {
  BOOT_SEQUENCE = 'boot-sequence',
  MAIN_CONTENT = 'main-content'
}

export interface AppState {
  uiState: UIState
}

const getInitialState = (): AppState => {
  let initialUIState = UIState.BOOT_SEQUENCE

  if (typeof window !== 'undefined') {
    const basePath = import.meta.env.BASE_URL || '/'
    const normalizedBasePath = basePath.endsWith('/') ? basePath : basePath + '/'
    const normalizedPathname = window.location.pathname.endsWith('/')
      ? window.location.pathname
      : window.location.pathname + '/'

    const isHomepage = normalizedPathname === normalizedBasePath
    const hasSkipParam = new URLSearchParams(window.location.search).get('intro') === 'false'

    if (!isHomepage || hasSkipParam) {
      initialUIState = UIState.MAIN_CONTENT
    }
  }

  return { uiState: initialUIState }
}

export const $appStore = atom<AppState>(getInitialState())

export const appActions = {
  completeBootSequence(): void {
    $appStore.set({ uiState: UIState.MAIN_CONTENT })
  },
  skipToMainContent(): void {
    const params = new URLSearchParams(window.location.search)
    params.set('intro', 'false')
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`)
    $appStore.set({ uiState: UIState.MAIN_CONTENT })
  }
}
```
