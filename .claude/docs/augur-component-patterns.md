# Component Patterns

## Project-Specific Component Patterns
This document covers component organization and patterns specific to the Augur project's retro-futuristic interface.

## Animation Patterns

### CRT-Style Effects
Components use CSS keyframes for authentic monitor simulation:
- Power-on sequences with scan line reveals
- Flicker effects for damaged terminal aesthetics
- Glow transitions for interactive states

### Typewriter Animation System
Text revelation follows terminal-style patterns:
- Character-by-character reveals for authenticity
- Configurable typing speeds for different content types
- Cursor blink integration during active typing

### Background Animation Architecture
The PerspectiveGridTunnel component creates the signature 3D grid effect:
- WebGL-based perspective rendering
- Smooth animation loops without performance degradation
- Responsive scaling across viewport sizes

## WebGL & Resource Management
**ALWAYS** implement proper dispose() methods for WebGL resources (buffers, programs, shaders)
**MUST** call dispose() in React component cleanup effects to prevent GPU memory leaks
**NEVER** render after disposal - add isDisposed guards in render methods

## Interactive Component Patterns

### Terminal Interface Components
Components that simulate command-line interfaces:
- Prompt styling with authentic cursor positioning
- Input validation with terminal-style error messages
- Command history and autocomplete behaviors

### CRT Display Components
Components that simulate monitor hardware:
- Screen bezel effects and rounded corners
- Refresh rate simulation through subtle animations
- Power state transitions (on/off sequences)

## Complex Component Organization

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
