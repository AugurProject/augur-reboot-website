# Styling Patterns

## Constraints
**ALWAYS** use `src/styles/global.css` for ALL styling & customization
**ALWAYS** use `@theme` directive for theme customization - NO config files
**NEVER** create tailwind.config.js, use CSS-first approach
**ALWAYS** use `@utility` directive for custom utilities like `fx-glow`

## Tailwind CSS 4.1 Implementation
This project uses Tailwind CSS 4.1 via `@tailwindcss/vite` plugin with a CSS-first configuration approach:

- **Configuration location**: `src/styles/global.css` contains all styling configuration
- **No separate config file** - all configuration embedded in CSS
- **Theme customization**: Uses `@theme` directive for theme modifications
- **Custom utilities**: Defined via `@utility` directive for project-specific classes

## Custom Utilities Available

### Glow Effects
- `fx-glow` - Drop shadow with primary color glow
- `fx-glow-sm` - Small glow size
- `fx-glow-lg` - Large glow size
- `fx-box-glow` - Box shadow glow effects
- `fx-box-glow-sm` - Small box glow size
- `fx-box-glow-lg` - Large box glow size

### Usage Pattern
```html
<!-- Apply glow effects to elements -->
<div class="fx-glow">Glowing element</div>
<div class="fx-box-glow-lg">Box with large glow</div>
```

## Implementation Details
All custom utilities and theme configuration are located in:
```
src/styles/global.css
```
## Naming Conventions
- **Custom effects**: Follow `fx-*` naming pattern (fx-glow, fx-box-glow)
- **Size variants**: Use standard Tailwind suffixes (-sm, -lg)
- **Utility organization**: Group related utilities in @utility blocks
