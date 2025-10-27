# React Integration in Astro

## Overview

Astro supports React as a UI framework for interactive islands. This guide covers best practices for using React components in Astro projects.

## Installation

```bash
npx astro add react

# Or manual
npm install react react-dom @types/react @types/react-dom @astrojs/react
```

**astro.config.mjs:**
```javascript
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
});
```

## Client Directives

Control when React components hydrate on the client.

### client:load

Hydrate immediately on page load:

```astro
---
import Counter from '../components/Counter';
---
<Counter client:load />
```

**Use when:** Component needed immediately (above fold, critical UI).

### client:idle

Hydrate when browser is idle:

```astro
<SocialShare client:idle />
```

**Use when:** Non-critical components (social buttons, newsletter).

### client:visible

Hydrate when component enters viewport:

```astro
<Comments client:visible />
```

**Use when:** Below-fold content, lazy-loaded sections.

### client:media

Hydrate based on media query:

```astro
<MobileMenu client:media="(max-width: 768px)" />
```

**Use when:** Responsive components (mobile-only nav).

### client:only

Skip server rendering, client-only:

```astro
<ClientOnlyWidget client:only="react" />
```

**Use when:** Browser APIs required, no SSR possible.

## React Component Patterns

### Simple Interactive Component

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

```astro
---
// src/pages/index.astro
import Counter from '../components/Counter';
---
<Counter client:load />
```

### Passing Props

```tsx
// src/components/Greeting.tsx
interface Props {
  name: string;
  age?: number;
}

export default function Greeting({ name, age }: Props) {
  return (
    <div>
      <h2>Hello, {name}!</h2>
      {age && <p>Age: {age}</p>}
    </div>
  );
}
```

```astro
---
import Greeting from '../components/Greeting';
---
<Greeting name="Alice" age={30} client:load />
```

### Passing Children

```tsx
// src/components/Card.tsx
import type { ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

export default function Card({ title, children }: Props) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
```

```astro
<Card title="Welcome" client:load>
  <p>This is the card content</p>
</Card>
```

## Hooks

### useState

```tsx
import { useState } from 'react';

export default function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, input]);
      setInput('');
    }
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && addTodo()}
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useEffect

```tsx
import { useState, useEffect } from 'react';

export default function DataFetcher() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

### Custom Hooks

```tsx
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

```tsx
// Usage
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle Theme: {theme}
    </button>
  );
}
```

## Context API

### Creating Context

```tsx
// src/context/ThemeContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Using Context

```tsx
// src/components/ThemeToggle.tsx
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

```astro
---
// src/pages/index.astro
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
---

<ThemeProvider client:load>
  <ThemeToggle client:load />
</ThemeProvider>
```

## Form Handling

### Controlled Components

```tsx
import { useState } from 'react';

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      alert('Message sent!');
      setForm({ name: '', email: '', message: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Name"
        required
      />
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        required
      />
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        placeholder="Message"
        required
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Performance Optimization

### React.memo

```tsx
import { memo } from 'react';

interface Props {
  title: string;
  content: string;
}

const ExpensiveComponent = memo(function ExpensiveComponent({ title, content }: Props) {
  // Expensive rendering logic
  return (
    <div>
      <h2>{title}</h2>
      <p>{content}</p>
    </div>
  );
});

export default ExpensiveComponent;
```

### useMemo and useCallback

```tsx
import { useMemo, useCallback } from 'react';

export default function OptimizedList({ items }: { items: string[] }) {
  // Memoize expensive computation
  const sortedItems = useMemo(() => {
    return items.sort();
  }, [items]);

  // Memoize callback
  const handleClick = useCallback((item: string) => {
    console.log('Clicked:', item);
  }, []);

  return (
    <ul>
      {sortedItems.map(item => (
        <li key={item} onClick={() => handleClick(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
}
```

## Best Practices

### 1. Choose the Right Hydration Strategy

- `client:load` - Critical, above-fold interactions
- `client:idle` - Non-critical UI elements
- `client:visible` - Below-fold content
- `client:media` - Responsive components
- `client:only` - Browser-dependent features

### 2. Minimize Client JavaScript

Use React only where interactivity is needed. Static content should be plain Astro components.

### 3. TypeScript Props

Always type component props:

```tsx
interface Props {
  title: string;
  count?: number;
  onUpdate?: (value: number) => void;
}
```

### 4. Extract Business Logic

Keep components focused on UI, extract logic to hooks or utilities:

```tsx
// ❌ Bad - logic in component
export default function User() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return <div>{user?.name}</div>;
}

// ✅ Good - logic in custom hook
function useUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);
  return user;
}

export default function User() {
  const user = useUser();
  return <div>{user?.name}</div>;
}
```

### 5. Error Boundaries

```tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

## Common Patterns

### Modal Dialog

```tsx
import { useState } from 'react';

export default function Modal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2>Modal Title</h2>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### Tabs

```tsx
import { useState } from 'react';

const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];

export default function Tabs() {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex gap-2">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={active === i ? 'font-bold' : ''}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-4">
        Content for {tabs[active]}
      </div>
    </div>
  );
}
```

## Resources

- [Astro + React Docs](https://docs.astro.build/en/guides/integrations-guide/react/)
- [React Documentation](https://react.dev/)
- [TypeScript + React Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Troubleshooting

**Issue: Hydration mismatch**
- Ensure server and client render the same content
- Avoid browser-only APIs in initial render
- Use `client:only` if SSR not possible

**Issue: Component not interactive**
- Add a client directive (`client:load`, etc.)
- Check browser console for hydration errors

**Issue: Props not updating**
- Verify parent component re-renders
- Check if using `memo` inappropriately
