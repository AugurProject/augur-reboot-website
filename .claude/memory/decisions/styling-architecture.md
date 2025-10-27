# Styling Architecture Decision

## Decision
**Use Tailwind CSS v4.1 with CSS-first approach using @theme and @utility directives**

## Rationale
- Tailwind v4 introduces CSS-first design via Vite plugin
- No separate `tailwind.config.js` file needed - all configuration in CSS
- `@theme` directive enables theme customization directly in CSS
- `@utility` directive allows custom utilities alongside built-in Tailwind utilities
- Vite integration provides build-time optimization
- Keeps styling concerns co-located with CSS rather than scattered in config files

## Implementation
- **Primary file**: `src/styles/global.css`
- **Theme customization**: Use `@theme` directive in global.css
- **Custom utilities**: Define with `@utility` directive
  - Example: `fx-glow`, `fx-glow-sm`, `fx-glow-lg`, `fx-box-glow`, `fx-box-glow-sm`, `fx-box-glow-lg`
- **Scoped styles**: Use `<style>` blocks in `.astro` and `.tsx` components
- **Dynamic CSS variables**: Use `define:vars` in Astro components

## Critical Rules
- **ALWAYS** edit `src/styles/global.css` for global styling
- **NEVER** assume `tailwind.config.js` exists
- **NEVER** create or edit a tailwind config file
- **MUST** use `@theme` directive for color/sizing customization
- **MUST** use `@utility` directive for custom utilities
- Use component `<style>` blocks for scoped styles (auto-encapsulated by Astro)

## Configuration
- Tailwind v4.1 integrated via `@tailwindcss/vite` plugin
- No separate configuration file - pure CSS-first approach
- Vite handles preprocessing and optimization during build

## Examples
```css
/* In src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-primary: rgb(59, 130, 246);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.5);
}

@utility fx-glow {
  @apply drop-shadow-lg;
  filter: drop-shadow(var(--shadow-glow));
}
```

## Related Decisions
- See `frontend-framework.md` for how Astro handles component styles
- See `.claude/memory/conventions/styling-standards.md` for implementation guidelines
- See `.claude/memory/architecture/components.md` for component-specific styling patterns
