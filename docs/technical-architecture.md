# Technical Architecture

This document describes the React/TypeScript implementation of the Augur Fork Meter application, including component architecture, state management, and UI patterns.

## Architecture Overview

The UI is built with:
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **SVG** for gauge visualization
- **Context API** for state management

## Component Hierarchy

```
App (Provider Wrapper)
├── ForkRiskProvider (Data Context)
└── DemoProvider (Demo State Context)
    └── DemoOverlay (Top Bar & Sidebar Management)
        ├── Fixed Top Bar
        │   ├── Demo Mode Indicator (when active)
        │   ├── Demo/Settings Button
        │   └── Reset Button (demo mode only)
        ├── ForkMeter (Main Content)
        │   ├── Title & Subtitle
        │   ├── GaugeDisplay (SVG Risk Level Visualization)
        │   ├── DataPanels (Progressive Disclosure)
        │   └── Last Updated Info
        └── DemoSidebar (Slide-out Panel)
            ├── Current Values Display
            └── Risk Scenario Controls
```

## Core Components

### 1. App.tsx
Root application component providing context providers.

**Features:**
- Wraps entire app with ForkRiskProvider and DemoProvider
- Simple composition pattern for clean separation of concerns

### 2. DemoOverlay.tsx
Wrapper component managing demo state and top bar UI.

**Features:**
- Fixed top bar with conditional visibility based on demo state
- Demo mode indicator and control buttons
- Sidebar state management (open/close)
- Progressive enhancement: transparent in live mode, visible in demo mode

**Key State:**
- `isDebugOpen`: Controls sidebar visibility
- Uses demo context for demo state and reset functionality

### 3. ForkMeter.tsx
Main content container displaying the core fork meter interface.

**Features:**
- Error and loading state display
- Orchestrates gauge and data panels

### 4. GaugeDisplay.tsx
SVG-based semicircular gauge showing fork risk level.

**Features:**
- Visual percentage scaling for intuitive display (non-linear mapping)
- Risk level text display (LOW/MODERATE/HIGH/CRITICAL) with dynamic coloring
- Smooth gradient arc from green to red
- Responsive design with viewBox scaling

**Visual Elements:**
- Background track (full semicircle)
- Colored progress arc with gradient (url(#pathGradient))
- Large risk level text (uppercase) with dynamic colors
- "FORK RISK LEVEL" subtitle

**Key Functions:**
- `getVisualPercentage()`: Maps actual percentages to gauge fill levels
  - 0-10% → 0-25% gauge fill
  - 10-25% → 25-50% gauge fill
  - 25-75% → 50-90% gauge fill
  - 75%+ → 90-100% gauge fill
- `getRiskLevel()`: Determines text based on thresholds (10%, 25%, 75%)
- `getRiskColor()`: Returns CSS custom property for dynamic coloring

### 5. DemoSidebar.tsx
Slide-out panel with data inspection and demo controls.

**Features:**
- **Current Values Section**: Shows active data (live or demo)
- **Demo Controls Section**: Risk scenario buttons for testing
- Mobile-responsive width (full width on mobile, fixed width on desktop)
- Backdrop overlay with click-to-close functionality

**Live Data Display:**
- Risk Level & Percentage
- Active Disputes count
- Largest Dispute Bond (REP)
- Fork Threshold Percentage
- RPC Endpoint & Latency
- Block Number
- Last Updated timestamp

**Demo Controls:**
- Risk scenario buttons:
  - No Risk (0 REP disputes)
  - Low Risk (0.4-10% threshold)
  - Moderate Risk (10-25% threshold) 
  - High Risk (25-75% threshold)
  - Critical Risk (75%+ threshold)
- Reset to Live Data button (when in demo mode)
- Color-coded buttons matching risk levels

### 6. DataPanels.tsx
Progressive disclosure panel showing detailed metrics when needed.

**Progressive Disclosure Logic:**
- **Stable State (no disputes)**: Shows "✓ All markets are stable" message
- **Active Disputes**: Shows three-column layout with metrics

**Active Dispute Display:**
- **Dispute Bond**: Largest active dispute bond in REP
- **Threshold**: Percentage of 275,000 REP fork threshold
- **Dispute Round**: Current escalation level of largest dispute

**Features:**
- Clean, centered layout with divider pipes
- Formatted numbers with locale-specific separators
- Uppercase labels with tracking for consistent typography
- Conditional rendering based on dispute activity

## State Management

### ForkRiskContext.tsx
React Context providing simplified fork risk data.

**Provides:**
- `gaugeData`: Processed data containing percentage for gauge
- `riskLevel`: Current risk level (for compatibility)
- `lastUpdated`: Formatted timestamp
- `isLoading`: Loading state
- `error`: Error message if data fetch fails
- `rawData`: Complete JSON data with dispute metrics

**Data Flow:**
1. Context fetches from `/data/fork-risk.json` on mount
2. Single metric calculation: largest dispute bond / 275,000 REP
3. Auto-refresh every 5 minutes
4. Fallback to demo data if fetch fails

### DemoContext.tsx
React Context managing demo mode state and data override.

**Provides:**
- `isDemo`: Boolean flag for demo/live state
- `setDemoData`: Function to override data with demo scenarios
- `resetToLive`: Function to return to live data

**Demo Data Generation:**
- Uses `demoDataGenerator.ts` utility functions
- Generates realistic dispute bond scenarios
- Maintains consistent risk level calculations

## Styling System

### Tailwind Configuration
- **Custom Colors**: Primary green theme with risk level variants
- **Typography**: System fonts with letter spacing for technical aesthetic
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Stone color palette for professional look

### CSS Custom Properties
Used for gauge visualization:
```css
--gauge-color-safe: #10b981     /* Green for LOW */
--gauge-color-safe-mid: #eab308  /* Green-yellow transition */
--gauge-color-warning: #f59e0b   /* Yellow for MODERATE */
--gauge-color-danger: #ef4444    /* Orange for HIGH */
--gauge-color-critical: #dc2626  /* Red for CRITICAL */
```

### Risk Level Color Mapping
- **LOW**: `var(--gauge-color-safe)` - Green
- **MODERATE**: `var(--gauge-color-warning)` - Yellow  
- **HIGH**: `var(--gauge-color-danger)` - Orange
- **CRITICAL**: `var(--gauge-color-critical)` - Red

## Interface Modes

### Live Data Mode (Default)
- Displays real blockchain data from `fork-risk.json`
- Top bar transparent background
- "Demo" button in top-right with subtle border styling
- Shows actual dispute bond calculations
- DataPanels show "All markets are stable" when no disputes active

### Demo Mode
- Activated via sidebar risk scenario buttons
- Top bar becomes visible with white/5% background
- "Demo Mode" text appears on left in green
- "Settings" and "Reset" buttons on right
- DataPanels show simulated dispute data
- Sidebar shows current demo values in green-tinted section

## Responsive Design

### Breakpoints
- **Mobile**: `< 640px` - Full width sidebar, stacked layout
- **Tablet**: `640px - 1024px` - Partial width sidebar
- **Desktop**: `> 1024px` - Fixed width sidebar (28rem)

### Mobile Optimizations
- Debug sidebar covers full screen width
- Touch-friendly button sizes
- Simplified gauge scaling
- Reduced text sizes where appropriate

## Data Processing

### Simplified Risk Calculation
```typescript
// Single metric: dispute bond vs fork threshold
const forkThresholdPercent = (largestDisputeBond / 275000) * 100

// Risk level determination with realistic thresholds
if (forkThresholdPercent < 10) return 'LOW'
if (forkThresholdPercent < 25) return 'MODERATE'  
if (forkThresholdPercent < 75) return 'HIGH'
return 'CRITICAL'
```

### Number Formatting
- **Large Numbers**: `toLocaleString()` for comma separators
- **Percentages**: `toFixed(1)` for single decimal precision
- **REP Amounts**: Formatted with "REP" suffix
- **Timestamps**: Context-provided formatted strings

## Performance Considerations

### Optimization Features
- React Context prevents prop drilling
- Memoized callbacks in DemoOverlay to prevent re-renders
- Efficient SVG rendering with path updates only when needed
- CSS transitions for smooth gauge animations
- Conditional rendering in DataPanels (progressive disclosure)

### Update Strategy
- Data fetching only when component mounts or manually refreshed
- Demo mode uses local state overrides (no API calls)
- Single calculation per update (dispute bond / threshold)
- Minimal re-renders due to simplified state structure

## Key Implementation Details

### Visual Percentage Scaling
The gauge uses non-linear visual scaling to provide intuitive feedback:
- Actual 5% risk → 25% gauge fill (more visible than linear)
- Actual 25% risk → 50% gauge fill (clear moderate warning)
- Actual 75% risk → 90% gauge fill (obvious critical state)

This prevents the gauge from appearing "empty" during normal operation while maintaining accuracy.

### Progressive Disclosure Pattern
The UI adapts to show relevant information:
- **No Disputes**: Simple "All markets are stable" message
- **Active Disputes**: Detailed metrics with dispute bond, threshold %, and round
- **Demo Mode**: Additional controls and current values display

### Simplified Architecture Benefits
- **Single Source of Truth**: One calculation (dispute bond / 275,000 REP)
- **Clear Risk Communication**: Thresholds aligned with actual fork trigger
- **Maintainable Code**: Fewer components, clearer data flow
- **Accurate Risk Assessment**: No false alarms from over-sensitive thresholds
