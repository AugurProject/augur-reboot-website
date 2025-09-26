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

## Core Website Components
- `Intro.tsx` - Interactive terminal-style intro with typewriter effects
- `PerspectiveGridTunnel.tsx` - Animated 3D perspective grid background
- `CrtDisplay.tsx` - CRT monitor simulation with power-on/off animations
- `TypewriterSequence.tsx` - Sequential text animation system
- `HeroBanner.astro` - Main hero section with social links
- `MissionSection.astro` - Technical specification display sections

## Fork Risk Monitoring Components
- `ForkMonitor.tsx` - Main component integrating gauge, data panels, and demo controls
- `ForkGauge.tsx` - Animated SVG gauge showing risk percentage (0-100%)
- `ForkStats.tsx` - Responsive grid displaying risk level, REP staked, and dispute count
- `ForkDisplay.tsx` - Display component orchestrating gauge and stats
- `ForkControls.tsx` - Development-only overlay with demo scenarios (production-safe)
- `ForkBadge.tsx` - Badge component for fork status display
- `ForkDataProvider.tsx` - Data provider with 5-minute auto-refresh and error handling
- `ForkMockProvider.tsx` - Demo state management with scenario generation

## Pages Structure
- `index.astro` - Landing page with intro sequence and hero banner
- `mission.astro` - Technical roadmap with detailed protocol specifications
- `Layout.astro` - Base HTML layout with global styles and fonts