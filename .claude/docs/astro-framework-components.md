# Astro Framework Components Knowledge Extract

## Executive Summary
Key patterns for integrating React, Svelte, Vue, and other frameworks in Astro with client-side hydration strategies and multi-framework composition.

## Novel Concepts

### Static-First Component Rendering
```astro
---
import MyReactComponent from '../components/MyReactComponent.jsx';
---
<MyReactComponent />
<!-- Renders as static HTML by default, no JavaScript sent -->
```

### Selective Client Hydration
```astro
<InteractiveButton client:load />
<InteractiveCounter client:visible />
<InteractiveModal client:only="svelte" />
```

**Hydration Directives:**
- `client:load` - JS imports when page loads
- `client:visible` - JS loads when component enters viewport
- `client:idle` - JS loads when browser idle
- `client:media={QUERY}` - JS loads when media query matches
- `client:only="framework"` - Skip server rendering entirely

### Multi-Framework Islands
```astro
---
import MyReactComponent from '../components/MyReactComponent.jsx';
import MySvelteComponent from '../components/MySvelteComponent.svelte';
import MyVueComponent from '../components/MyVueComponent.vue';
---
<div>
  <MySvelteComponent />
  <MyReactComponent />
  <MyVueComponent />
</div>
```

## Updated Practices

### Framework-Specific Child Patterns
**React/Preact/Solid:**
```astro
<MyReactSidebar>
  <h2 slot="title">Menu</h2>
  <p>Content goes in children</p>
  <ul slot="social-links">...</ul>
</MyReactSidebar>
```

```jsx
// MySidebar.jsx
export default function MySidebar(props) {
  return (
    <aside>
      <header>{props.title}</header>
      <main>{props.children}</main>  
      <footer>{props.socialLinks}</footer> {/* kebab-case → camelCase */}
    </aside>
  )
}
```

**Svelte/Vue:**
```svelte
<!-- MySidebar.svelte -->
<aside>
  <header><slot name="title" /></header>
  <main><slot /></main>
  <footer><slot name="social-links" /></footer> <!-- kebab-case preserved -->
</aside>
```

### Prop Serialization Constraints
**Supported:** `string`, `number`, `Array`, `Map`, `Set`, `RegExp`, `Date`, `BigInt`, `URL`, typed arrays
**Unsupported:** Functions, complex objects with methods

```astro
<TodoList initialTodos={["learn Astro", "review PRs"]} />
<Counter startingCount={1} />
<!-- ❌ <Component onClick={handleClick} /> Functions don't serialize -->
```

## Implementation Notes

### Framework Bundle Optimization
- Multiple components using same framework share single bundle
- Framework code sent only once per page
- Each hydrated component sends its own JavaScript

### Nested Component Hydration
```astro
<MyReactSidebar>
  <div slot="actions">
    <MyReactButton client:idle />
    <MySvelteButton client:idle />
  </div>
</MyReactSidebar>
```

### File Organization Constraints
- Only `.astro` files can mix multiple frameworks  
- Framework component files (`.jsx`, `.svelte`) cannot import other framework types
- Cannot import `.astro` components inside framework components

## Learning Priority

1. **High:** Client directive patterns and hydration timing
2. **High:** Multi-framework composition in single page
3. **Medium:** Named slots and prop passing patterns
4. **Medium:** Serialization constraints for interactive components
5. **Low:** Framework-specific child handling differences

**Key Insight:** Astro treats framework components as "islands" that can be selectively hydrated, enabling fine-grained performance control while maintaining multi-framework flexibility within single pages.