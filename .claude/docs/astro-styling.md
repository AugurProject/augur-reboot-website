# Astro Styling Knowledge Extract

## Executive Summary
Key implementation patterns for CSS integration in Astro components, covering scoped styling architecture, dynamic classes, CSS variables, and framework-specific approaches.

## Novel Concepts

### Scoped Style Architecture
```astro
<style>
  h1 { color: red; }
</style>
```
Compiles to: `h1[data-astro-cid-hhnqfkh6] { color: red; }` - automatic encapsulation without CSS-in-JS overhead.

### Mixed Scoping Pattern
```astro
<style>
  h1 { color: red; }           /* scoped to component */
  article :global(h1) {        /* targets child components */
    color: blue;
  }
</style>
```

### Dynamic CSS Variables
```astro
---
const foregroundColor = "rgb(221 243 228)";
---
<style define:vars={{ foregroundColor }}>
  h1 { color: var(--foregroundColor); }
</style>
```

### Class Composition Utility
```astro
<div class:list={['box', { red: isRed }]}>
```
Conditional class application without external libraries.

## Updated Practices

### Component Class Passing
```astro
---
const { class: className, ...rest } = Astro.props;
---
<div class={className} {...rest}>
  <slot/>
</div>
```
Required pattern for scoped style compatibility with parent components.

### CSS Cascade Order
1. `<link>` tags (lowest precedence)
2. Imported styles
3. Scoped styles (highest precedence)

### Tailwind 4 Integration
```bash
npx astro add tailwind
```
```css
@import "tailwindcss";
```
New Vite plugin approach replaces legacy integration.

## Implementation Notes

### External Stylesheet Imports
```astro
---
import '../styles/utils.css';  // Bundled and optimized
---
```

### NPM Package Styles
```js
// astro.config.mjs - for packages without extensions
export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['package-name'],
    }
  }
})
```

### Production Bundle Control
```js
// astro.config.mjs
export default defineConfig({
  vite: {
    build: {
      assetsInlineLimit: 1024,  // External link threshold
    }
  },
  build: {
    inlineStylesheets: 'never'  // Force external stylesheets
  }
});
```

### Framework-Specific Patterns
```jsx
// React/Preact
import Styles from './styles.module.css';
```
```vue
<!-- Vue -->
<style lang="scss" scoped>
```

## Learning Priority

1. **High**: Scoped styling and :global() patterns - core Astro differentiation
2. **High**: define:vars directive for dynamic CSS variables
3. **Medium**: class:list utility for conditional classes
4. **Medium**: Component class passing patterns for reusable components
5. **Low**: Advanced bundle control and ?raw/?url imports