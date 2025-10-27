# Styling Standards Conventions

## Global Styling Location

### Primary File: `src/styles/global.css`
This is the ONLY location for:
- Theme customization (`@theme` directive)
- Custom utilities (`@utility` directive)
- Global CSS variables
- Tailwind imports and configuration

**Convention**: All styling customization goes here. No other configuration files.

## Tailwind v4.1 Implementation

### Theme Customization
```css
/* In src/styles/global.css */
@theme {
  --color-primary: rgb(59, 130, 246);
  --color-accent: rgb(234, 179, 8);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.5);
}
```

### Custom Utilities
```css
@utility fx-glow {
  @apply drop-shadow-lg;
  filter: drop-shadow(var(--shadow-glow));
}

@utility fx-glow-sm {
  @apply drop-shadow;
  filter: drop-shadow(var(--shadow-glow));
}

@utility fx-box-glow {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
}
```

### Critical Rules
- **ALWAYS** edit `src/styles/global.css` for any styling changes
- **NEVER** create or edit `tailwind.config.js` (it doesn't exist - pure CSS-first)
- **MUST** use `@theme` directive for theme values
- **MUST** use `@utility` directive for custom utilities
- **NEVER** assume Tailwind config files exist

## Component-Level Styling

### Astro Component Styles
```astro
---
// Component script
---
<div class="flex gap-4 fx-glow">...</div>

<style>
  /* Scoped automatically - creates data-astro-cid-xyz attributes */
  div { /* Only affects div in THIS component */ }
</style>
```

### React Component Styles
Use module CSS or Tailwind classes:
```jsx
// Module CSS approach
import styles from './Button.module.css';

export function Button({ className, ...props }) {
  return <button className={`${styles.btn} ${className}`} {...props} />;
}
```

Or inline Tailwind:
```jsx
export function Button({ className }) {
  return <button className={`px-4 py-2 rounded fx-glow ${className}`} />;
}
```

## Dynamic CSS Variables in Components

### Astro Components
```astro
---
const foregroundColor = "rgb(221 243 228)";
const accentColor = "rgb(234 179 8)";
---
<style define:vars={{ foregroundColor, accentColor }}>
  h1 { color: var(--foregroundColor); }
  .accent { color: var(--accentColor); }
</style>
```

### React Components
Use inline styles or CSS-in-JS:
```jsx
export function Card({ bgColor }) {
  return (
    <div style={{ '--bg-color': bgColor } as React.CSSProperties}>
      {/* content */}
    </div>
  );
}
```

## Utility Classes Available

From `src/styles/global.css`:

| Utility | Purpose | Sizes |
|---------|---------|-------|
| `fx-glow` | Drop shadow with primary color glow | `sm`, `lg` variants |
| `fx-box-glow` | Box shadow glow effect | `sm`, `lg` variants |

Use with Tailwind modifier syntax:
```html
<!-- Apply glow in different sizes -->
<div class="fx-glow">Default size</div>
<div class="fx-glow-sm">Small glow</div>
<div class="fx-glow-lg">Large glow</div>
```

## Scoped Styles in Astro

### Scoping Behavior
```astro
<style>
  /* Automatically scoped to this component */
  h1 { color: red; }
</style>

<style is:global>
  /* Only if you explicitly need global */
  body { margin: 0; }
</style>
```

Astro automatically adds `[data-astro-cid-xyz]` attributes for encapsulation.

## Common Patterns

### Conditional Styling
```astro
---
interface Props {
  variant: 'primary' | 'secondary';
}
const { variant } = Astro.props;
---
<button class:list={['btn', { 'btn-primary': variant === 'primary' }]}>
  {/* content */}
</button>

<style>
  .btn { /* base styles */ }
  .btn-primary { /* variant styles */ }
</style>
```

### Class Passthrough
```astro
---
const { class: className, ...rest } = Astro.props;
---
<div class={className} {...rest}>
  <slot />
</div>
```

## Build Optimization

Global CSS is bundled and optimized at build time. The Tailwind v4 Vite plugin:
- Scans components for Tailwind classes
- Generates only used utilities
- Minifies CSS output
- Optimizes production bundle

## Related Conventions
- See `decisions/styling-architecture.md` for architectural rationale
- See `component-architecture.md` for component-specific patterns
- See `.claude/memory/architecture/components.md` for detailed examples
