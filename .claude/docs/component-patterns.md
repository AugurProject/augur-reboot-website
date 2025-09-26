# Component Patterns

## Component Architecture
- **Astro Components** (.astro) - Server-rendered layout and static components
- **React Components** (.tsx) - Interactive elements requiring client-side JavaScript
- **Hybrid Approach** - Uses `client:load` and `client:only` directives for selective hydration

## Client-Side Hydration
Components requiring interactivity use Astro's client directives:
- `client:only="react"` - Components that only run on client
- `client:load` - Hydrate immediately on page load

## State Management Patterns
**NEVER** add state management logic to rendering components - state belongs in stores
**ALWAYS** make rendering components purely reactive to state - no URL detection or navigation logic
**NEVER** add "safety fallbacks" or "defensive code" that violates separation of concerns
**ALWAYS** handle page initialization logic in store initialization, not component effects

## Animation System
The site uses CSS keyframes for CRT-style effects and JavaScript for typewriter animations. The PerspectiveGridTunnel component creates the signature animated background.

## WebGL & Resource Management
**ALWAYS** implement proper dispose() methods for WebGL resources (buffers, programs, shaders)
**MUST** call dispose() in React component cleanup effects to prevent GPU memory leaks
**NEVER** render after disposal - add isDisposed guards in render methods

## View Transitions Architecture
**REFERENCE**: @docs/view-transitions-design.md - Comprehensive design document for smooth page navigation, animation continuity, and state management patterns.

## Component Types and Usage
- **Interactive Components**: Use for terminal effects, animations, gauges, and user interactions
- **Static Components**: Use for hero sections, content sections, and layouts
- **Provider Components**: Use for data loading, state management, and context sharing
- **Page Components**: Use for route definitions and complete page layouts

## Implementation Guidelines
- Use `git ls-files "src/components/*.tsx"` to find interactive components
- Use `git ls-files "src/components/*.astro"` to find static components
- Follow existing patterns for similar component types
- Extract shared logic to utilities in `/lib` when appropriate

## Component Architecture

### Fork Risk Monitoring System
Hierarchical component organization:
```
ForkMonitor (main container)
├── ForkDisplay (layout orchestrator)
│   ├── ForkGauge (SVG visualization)
│   └── ForkStats (data panels)
├── ForkControls (development tools)
└── ForkBadge (status indicator)

Data Flow:
ForkDataProvider → ForkRiskContext → Components
ForkMockProvider → DemoContext → Components (dev mode)
```
