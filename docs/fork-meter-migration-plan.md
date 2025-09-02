# Fork Meter Integration Plan

## Executive Summary

This document outlines the complete migration plan for integrating the Augur Fork Risk Monitoring System from the standalone `augur-fork-meter` repository into the main `augur.net` website. The integration fulfills the Statement of Work requirements while maintaining zero infrastructure costs and ensuring seamless user experience.

## Project Overview

### Current State
- **Fork Meter**: Standalone Astro application with real-time blockchain monitoring
- **Main Site**: Augur.net website with placeholder fork meter components
- **Both**: Use similar tech stacks (Astro + React + TypeScript + Tailwind)

### Target State
- Fully integrated fork risk monitoring within augur.net
- Automated hourly data updates via GitHub Actions
- Zero additional infrastructure requirements
- Complete transparency with open-source implementation

## Migration Phases

### Phase 1: Core Component Migration
**Timeline**: Week 1
**Objective**: Migrate functional components and data collection logic

#### 1.1 Dependencies Installation
```bash
npm install ethers@^6.13.4
```
- Add ethers.js for blockchain interaction
- Verify compatibility with existing dependencies

#### 1.2 Script Migration
Migrate blockchain data collection infrastructure:
- Copy `scripts/calculate-fork-risk.ts` from fork-meter
- Copy `contracts/augur-abis.json` for smart contract interfaces
- Add TypeScript project references configuration:
  ```json
  // tsconfig.scripts.json
  {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "module": "ESNext",
      "target": "ES2022",
      "lib": ["ES2022"],
      "types": ["node"]
    },
    "include": ["scripts/**/*"]
  }
  ```

#### 1.3 Component Replacement
Replace placeholder components with functional implementations:

**Components to Update:**
- `src/components/ForkMeter.tsx` - Replace with data-connected version
- `src/components/ForkMeterUI.tsx` - Update to support real data

**Components to Add:**
- `src/components/GaugeDisplay.tsx` - Visual risk gauge
- `src/components/DataPanels.tsx` - Dispute information panels  
- `src/components/RiskBadge.tsx` - Risk level indicator
- `src/contexts/ForkRiskContext.tsx` - Data provider
- `src/contexts/DemoContext.tsx` - Demo mode provider
- `src/components/DemoSidebar.tsx` - Demo controls
- `src/components/DemoOverlay.tsx` - Demo mode indicator

### Phase 2: Data Pipeline Setup
**Timeline**: Week 2
**Objective**: Establish automated data collection and storage

#### 2.1 GitHub Actions Configuration
Merge fork monitoring into existing workflow:

```yaml
# .github/workflows/sync-to-gh-pages.yml additions
on:
  schedule:
    - cron: '5 * * * *'  # Run hourly at minute 5
  workflow_dispatch:
    inputs:
      custom_rpc_url:
        description: 'Custom Ethereum RPC URL for testing'
        required: false
        type: string

jobs:
  sync:
    steps:
      # Add before build step:
      - name: Calculate fork risk data
        run: npm run build:fork-data
        env:
          ETH_RPC_URL: ${{ secrets.ETH_RPC_URL || github.event.inputs.custom_rpc_url }}
```

#### 2.2 Data Storage Structure
```
public/
  data/
    fork-risk.json     # Generated risk data (gitignored)
    .gitkeep          # Ensure directory exists
```

Update `.gitignore`:
```
# Generated data
public/data/fork-risk.json
```

#### 2.3 NPM Scripts Addition
```json
// package.json
"scripts": {
  "build:fork-data": "node --experimental-strip-types scripts/calculate-fork-risk.ts",
  "typecheck": "tsc --build",
  "lint": "npx @biomejs/biome lint"
}
```

### Phase 3: UI Integration & Styling
**Timeline**: Week 3  
**Objective**: Seamless visual integration with existing design

#### 3.1 CSS Variable Mapping
Map fork meter's green theme to augur.net variables:
```css
/* Existing augur.net variables to utilize */
--color-green-500: #00ff00;
--color-loud-foreground: #ffffff;
--color-muted-foreground: #808080;
```

#### 3.2 Animation Integration
Integrate with existing animation store:
```typescript
// Update ForkMeter.tsx to respect animation state
import { $appStore, UIState } from '../stores/animationStore';

// Component shows after intro sequence completes
```

#### 3.3 Responsive Layout
Ensure mobile-first responsive design:
- Mobile: Stacked single column
- Tablet: 2-column grid
- Desktop: 3-column layout for data panels

### Phase 4: Testing & Deployment
**Timeline**: Week 4
**Objective**: Validate functionality and deploy to production

#### 4.1 Testing Checklist
- [ ] Demo mode functionality without live data
- [ ] RPC endpoint failover (test all 4 public endpoints)
- [ ] GitHub Actions manual dispatch
- [ ] Mobile responsiveness across devices
- [ ] Animation timing with intro sequence
- [ ] Data refresh every 5 minutes
- [ ] Error handling and loading states

#### 4.2 Deployment Steps
1. Test build locally: `npm run build`
2. Verify fork data generation: `npm run build:fork-data`
3. Test GitHub Pages deployment in fork
4. Create PR to main branch
5. Deploy via automated GitHub Actions

## Technical Architecture

### Data Flow
```
Ethereum Blockchain
    ↓ (ethers.js)
calculate-fork-risk.ts
    ↓ (GitHub Actions hourly)
fork-risk.json
    ↓ (Static hosting)
ForkRiskContext
    ↓ (React Context)
Fork Meter UI Components
```

### Component Hierarchy
```
App
├── ForkMeter
│   ├── ForkRiskContext (Provider)
│   ├── DemoContext (Provider)
│   ├── GaugeDisplay
│   ├── DataPanels
│   │   ├── RiskBadge
│   │   └── DisputeCards
│   └── DemoSidebar (if demo mode)
```

### RPC Failover Strategy
Priority order for Ethereum endpoints:
1. LlamaRPC (`https://eth.llamarpc.com`)
2. LinkPool (`https://main-light.eth.linkpool.io`)
3. PublicNode (`https://ethereum.publicnode.com`)
4. 1RPC (`https://1rpc.io/eth`)

## Risk Mitigation

### Identified Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RPC endpoint failures | High | Multiple failover endpoints with exponential backoff |
| GitHub Actions limits | Medium | Optimized scripts, efficient cron scheduling |
| Smart contract changes | High | Contract monitoring, version compatibility checks |
| Build size increase | Low | Code splitting, lazy loading for fork meter |
| Animation conflicts | Low | Careful integration with animation store |

## Success Criteria

### Functional Requirements
- ✅ Real-time fork risk calculation and display
- ✅ Hourly automated updates via GitHub Actions
- ✅ Zero ongoing infrastructure costs
- ✅ Open-source with complete transparency
- ✅ Mobile-responsive design

### Performance Metrics
- Page load time < 3 seconds
- Fork data update latency < 2 minutes after calculation
- RPC failover success rate > 99%
- Zero monthly infrastructure costs

## Rollback Plan

If issues arise during deployment:
1. Revert PR merge in main branch
2. GitHub Pages automatically rebuilds previous version
3. Fork meter continues running independently if needed
4. Document issues for resolution

## Maintenance & Documentation

### Required Documentation Updates
- Update README with fork meter feature description
- Add troubleshooting guide for RPC issues
- Document demo mode usage
- Create maintenance runbook

### Long-term Maintenance
- Monitor RPC endpoint reliability monthly
- Update contract ABIs if Augur protocol upgrades
- Review GitHub Actions usage quarterly
- Keep dependencies updated for security

## Approval & Sign-off

### Stakeholders
- **Developer**: Jubal Mabaquiao | DarkFlorist
- **Client**: Lituus Foundation / Community
- **Repository**: AugurProject/augur-reboot-website

### Completion Checklist
- [ ] All components migrated and tested
- [ ] GitHub Actions workflow configured
- [ ] Documentation updated
- [ ] PR approved and merged
- [ ] Production deployment verified
- [ ] 30-day warranty period begins

## Appendix

### File Structure After Migration
```
augur.net/
├── src/
│   ├── components/
│   │   ├── ForkMeter.tsx (updated)
│   │   ├── ForkMeterUI.tsx (existing)
│   │   ├── GaugeDisplay.tsx (new)
│   │   ├── DataPanels.tsx (new)
│   │   ├── RiskBadge.tsx (new)
│   │   ├── DemoSidebar.tsx (new)
│   │   └── DemoOverlay.tsx (new)
│   ├── contexts/
│   │   ├── ForkRiskContext.tsx (new)
│   │   └── DemoContext.tsx (new)
│   └── utils/
│       └── demoDataGenerator.ts (new)
├── scripts/
│   └── calculate-fork-risk.ts (new)
├── contracts/
│   └── augur-abis.json (new)
├── public/
│   └── data/
│       └── fork-risk.json (generated)
└── .github/
    └── workflows/
        └── sync-to-gh-pages.yml (updated)
```

### Commands Reference
```bash
# Development
npm run dev                    # Start dev server
npm run build:fork-data       # Generate fork risk data
npm run build                 # Build production site

# Testing
npm run typecheck             # Type checking
npm run lint                  # Code linting

# Deployment (automatic via GitHub Actions)
git push origin main          # Triggers deployment
```

### Contact Information
- **Developer**: Jubal Mabaquiao
- **GitHub**: @DarkFlorist
- **Project**: augur-fork-meter
- **Timeline**: 3-4 weeks from start

---

*This migration plan ensures seamless integration of the Augur Fork Risk Monitoring System into augur.net while maintaining all SOW requirements and zero infrastructure costs.*