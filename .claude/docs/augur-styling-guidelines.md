# Styling Guidelines

## Design System Strategy

### Retro-Futuristic Aesthetic Philosophy
The visual language centers on CRT monitor simulation with authentic scan lines, glow effects, and terminal-style interactions. Design decisions prioritize atmospheric immersion over conventional usability patterns.

### Color Strategy
Primary palette derives from classic CRT phosphor colors with emphasis on green terminals and amber highlights. Glow effects use color-matched shadows to simulate authentic monitor bleeding.

### Typography Approach
Monospace fonts dominate the interface to reinforce terminal aesthetics. Text animations use typewriter effects rather than modern transitions to maintain period authenticity.

## Tailwind CSS 4.1 Guidelines

### CSS-First Philosophy
All configuration lives in `src/styles/global.css` using native CSS syntax. No separate configuration files exist to maintain simplicity and avoid context switching between CSS and JavaScript.

### @theme Directive Usage
Use `@theme` for foundational design tokens:
- Colors that need semantic naming
- Spacing values specific to the grid system
- Animation timing that affects multiple components

### @utility Directive Strategy
Create custom utilities for:
- **Visual effects** that combine multiple CSS properties (`fx-glow`, `fx-scanlines`)
- **Layout patterns** used across 3+ components
- **Animation presets** that maintain design consistency

Avoid utilities for:
- Single-property shortcuts already covered by Tailwind
- Component-specific styles that won't be reused
- Complex animations better handled in component CSS

## Custom Utility Creation

### Naming Conventions
- **Effect utilities**: `fx-*` prefix for visual effects (`fx-glow`, `fx-box-glow`)
- **Size variants**: Standard Tailwind suffixes (`-sm`, `-lg`, `-xl`)
- **State variants**: Descriptive suffixes (`-active`, `-disabled`)

### Organization Patterns
Group related utilities in dedicated `@utility` blocks:
```css
@utility {
  .fx-glow { /* base glow */ }
  .fx-glow-sm { /* small variant */ }
  .fx-glow-lg { /* large variant */ }
}
```

### Utility Scope Guidelines
- **Global effects**: Terminal-wide animations, CRT artifacts
- **Component effects**: Button glows, input focus states
- **Interactive effects**: Hover states, transition presets

## Visual Effect Patterns

### Glow Effect Strategy
CRT monitors naturally bleed light beyond character boundaries. Implement using:
- Multiple box-shadow layers for depth
- Color-matched shadows using CSS variables
- Size variants for different interface elements

### Scan Line Implementation
Subtle horizontal lines simulate CRT refresh patterns:
- Semi-transparent overlays using gradients
- Animation optional for active states
- Avoid overuse that impacts readability

### Terminal Aesthetics
Maintain authentic computer terminal feel:
- High contrast text on dark backgrounds
- Cursor blink animations for active inputs
- Typewriter text reveals for dynamic content

## Component Styling Approach

### Scoped vs Utility Balance
- **Scoped styles**: Complex animations, component-specific layouts
- **Utility classes**: Spacing, colors, common effects
- **Custom utilities**: Cross-component visual patterns

### Animation Strategy
Prefer CSS keyframes over JavaScript animations for:
- CRT power-on sequences
- Text typing effects
- Background grid animations

Use JavaScript only for:
- Complex timing coordination
- User interaction responses
- Dynamic value calculations

### Responsive Design
CRT aesthetic constrains responsive behavior:
- Maintain terminal proportions across breakpoints
- Scale effects proportionally, not linearly
- Preserve readability at smaller sizes