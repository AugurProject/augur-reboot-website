# Styling Patterns

## Styling Architecture
**ALWAYS** look in `src/styles/global.css` for ALL styling customization
**MUST** use `@theme` directive for theme customization - NO config files
**NEVER** assume tailwind.config.js exists - this project uses CSS-first approach
**ALWAYS** use `@utility` directive for custom utilities like `fx-glow`

## Tailwind CSS 4.1 Approach
This project uses Tailwind CSS 4.1 via `@tailwindcss/vite` plugin with a CSS-first configuration approach:

- **NO separate config file** - all configuration in CSS
- **Use `@theme` directive** for theme customization
- **Use `@utility` directive** for custom utility classes
- **Location**: `src/styles/global.css` contains all styling configuration

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

## Implementation Location
All custom utilities and theme configuration are defined in:
```
src/styles/global.css
```

This file contains:
- Tailwind v4 @theme configurations
- Custom @utility definitions
- Project-specific CSS variables
- Global styling patterns

## Development Guidelines
- **Never create** separate Tailwind config files
- **Always extend** utilities through the `@utility` directive in global.css
- **Reference** existing patterns before creating new utilities
- **Follow** the fx-* naming convention for custom effects