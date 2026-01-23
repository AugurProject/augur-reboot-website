# Phase 2: Fork Risk Monitoring System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Phase 2 of fork risk monitoring by wiring cache validation signals to workflow decisions, removing redundant data fields, and clarifying field semantics.

**Architecture:**
- Backend validation runs automatically in npm run build:fork-data, produces cacheValidation result embedded in fork-risk.json
- Workflow reads cacheValidation.isHealthy from JSON and decides whether to trigger cache rebuild
- Redundant hourly fields (timestamp, nextUpdate, calculation.method) removed so git diff detects only real risk changes
- lastUpdated renamed to lastRiskChange for semantic clarity ("when did risk actually move?")

**Tech Stack:**
- TypeScript (frontend + backend), Astro build system, GitHub Actions workflow, jq JSON parsing

---

## Task 1: Update TypeScript Interface

**Files:**
- Modify: `src/types/gauge.ts:11-41`

**Step 1: Read the current interface**

Run: `cat src/types/gauge.ts | head -45`

Expected output shows ForkRiskData interface with timestamp, lastUpdated, nextUpdate, calculation fields.

**Step 2: Update interface with new field structure**

Replace lines 11-41 with:

```typescript
export interface ForkRiskData {
	lastRiskChange: string
	blockNumber?: number
	riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical' | 'unknown'
	riskPercentage: number
	metrics: {
		largestDisputeBond: number
		forkThresholdPercent: number
		activeDisputes: number
		disputeDetails: Array<{
			marketId: string
			title: string
			disputeBondSize: number
			disputeRound: number
			daysRemaining: number
		}>
	}
	rpcInfo?: {
		endpoint: string | null
		latency: number | null
		fallbacksAttempted: number
	}
	calculation: {
		forkThreshold: number
	}
	cacheValidation?: {
		isHealthy: boolean
		discrepancy?: string
	}
	error?: string
}
```

**Step 3: Verify TypeScript compilation**

Run: `npm run typecheck`

Expected: No errors in src/types/gauge.ts

**Step 4: Commit**

```bash
git add src/types/gauge.ts
git commit -m "types: update ForkRiskData interface - remove timestamp/nextUpdate/method, rename lastUpdated→lastRiskChange, add cacheValidation"
```

---

## Task 2: Update Backend Script - Main Calculation

**Files:**
- Modify: `scripts/calculate-fork-risk.ts:289-312`

**Step 1: Read the current calculation section**

Run: `sed -n '289,312p' scripts/calculate-fork-risk.ts`

Expected: Shows results object being constructed with timestamp, lastUpdated, nextUpdate, calculation.method

**Step 2: Update results object**

Replace lines 289-312 with:

```typescript
		// Prepare results
		const results: ForkRiskData = {
			lastRiskChange: new Date().toISOString(),
			blockNumber,
			riskLevel,
			riskPercentage: Math.min(100, Math.max(0, riskPercentage)),
			metrics: {
				largestDisputeBond,
				forkThresholdPercent: Math.round(forkThresholdPercent * 100) / 100,
				activeDisputes: activeDisputes.length,
				disputeDetails: activeDisputes.slice(0, 5), // Top 5 disputes
			},
			rpcInfo: {
				endpoint: connection.endpoint,
				latency: connection.latency,
				fallbacksAttempted: connection.fallbacksAttempted,
			},
			calculation: {
				forkThreshold: FORK_THRESHOLD_REP,
			},
			cacheValidation,
		}
```

**Step 3: Verify no syntax errors**

Run: `npm run build:scripts 2>&1 | head -20`

Expected: Should compile without errors in this section

**Step 4: Commit**

```bash
git add scripts/calculate-fork-risk.ts
git commit -m "refactor: update main calculation results - remove timestamp/nextUpdate/method, use lastRiskChange"
```

---

## Task 3: Update Backend Script - Fork Detection Path

**Files:**
- Modify: `scripts/calculate-fork-risk.ts:839-871`

**Step 1: Read getForkingResult function**

Run: `sed -n '839,871p' scripts/calculate-fork-risk.ts`

Expected: Shows function returning ForkRiskData with old field structure

**Step 2: Update getForkingResult**

Replace lines 839-871 with:

```typescript
function getForkingResult(timestamp: string, blockNumber: number, connection: RpcConnection): ForkRiskData {
	return {
		lastRiskChange: new Date().toISOString(),
		blockNumber,
		riskLevel: 'critical',
		riskPercentage: 100,
		metrics: {
			largestDisputeBond: FORK_THRESHOLD_REP, // Fork threshold was reached
			forkThresholdPercent: 100,
			activeDisputes: 0,
			disputeDetails: [
				{
					marketId: 'FORKING',
					title: 'Universe is currently forking',
					disputeBondSize: FORK_THRESHOLD_REP,
					disputeRound: 99,
					daysRemaining: 0,
				},
			],
		},
		rpcInfo: {
			endpoint: connection.endpoint,
			latency: connection.latency,
			fallbacksAttempted: connection.fallbacksAttempted,
		},
		calculation: {
			forkThreshold: FORK_THRESHOLD_REP,
		},
		cacheValidation: { isHealthy: true },
	}
}
```

**Step 3: Verify no syntax errors**

Run: `npm run build:scripts 2>&1 | head -20`

Expected: Should compile without errors

**Step 4: Commit**

```bash
git add scripts/calculate-fork-risk.ts
git commit -m "refactor: update fork detection result - remove timestamp/nextUpdate/method, add cacheValidation"
```

---

## Task 4: Update Backend Script - Error Path

**Files:**
- Modify: `scripts/calculate-fork-risk.ts:873-897`

**Step 1: Read getErrorResult function**

Run: `sed -n '873,897p' scripts/calculate-fork-risk.ts`

Expected: Shows error handling path returning ForkRiskData

**Step 2: Update getErrorResult**

Replace lines 873-897 with:

```typescript
function getErrorResult(errorMessage: string): ForkRiskData {
	return {
		lastRiskChange: new Date().toISOString(),
		riskLevel: 'unknown',
		riskPercentage: 0,
		error: errorMessage,
		metrics: {
			largestDisputeBond: 0,
			forkThresholdPercent: 0,
			activeDisputes: 0,
			disputeDetails: [],
		},
		rpcInfo: {
			endpoint: null,
			latency: null,
			fallbacksAttempted: 0,
		},
		calculation: {
			forkThreshold: FORK_THRESHOLD_REP,
		},
		cacheValidation: { isHealthy: false, discrepancy: errorMessage },
	}
}
```

**Step 3: Verify no syntax errors**

Run: `npm run build:scripts 2>&1 | head -20`

Expected: Should compile without errors

**Step 4: Commit**

```bash
git add scripts/calculate-fork-risk.ts
git commit -m "refactor: update error result - remove timestamp/nextUpdate/method, add cacheValidation with error details"
```

---

## Task 5: Update Workflow Bootstrap Data

**Files:**
- Modify: `.github/workflows/build-and-deploy.yml:44-54`

**Step 1: Read current bootstrap section**

Run: `sed -n '39,57p' .github/workflows/build-and-deploy.yml`

Expected: Shows jq command creating initial fork-risk.json

**Step 2: Update bootstrap jq command**

Replace lines 44-54 with:

```yaml
            jq -n '{
              lastRiskChange: "'$NOW'",
              blockNumber: 0,
              riskLevel: "none",
              riskPercentage: 0,
              metrics: {largestDisputeBond: 0, forkThresholdPercent: 0, activeDisputes: 0, disputeDetails: []},
              rpcInfo: {endpoint: "pending", latency: 0, fallbacksAttempted: 0},
              calculation: {forkThreshold: 275000},
              cacheValidation: {isHealthy: true}
            }' > public/data/fork-risk.json
```

**Step 3: Verify YAML syntax**

Run: `yamllint .github/workflows/build-and-deploy.yml 2>&1 | grep -A2 "line 4[4-9]" || echo "✓ No syntax errors in bootstrap section"`

Expected: No syntax errors

**Step 4: Commit**

```bash
git add .github/workflows/build-and-deploy.yml
git commit -m "chore: update workflow bootstrap - remove timestamp/nextUpdate/method, use lastRiskChange"
```

---

## Task 6: Implement Phase 2 - Cache Validation Signal in Workflow

**Files:**
- Modify: `.github/workflows/build-and-deploy.yml:149-156`

**Step 1: Read current validate-cache step**

Run: `sed -n '149,156p' .github/workflows/build-and-deploy.yml`

Expected: Shows hardcoded `echo "needs-rebuild=false"`

**Step 2: Replace validate-cache step**

Replace lines 149-156 with:

```yaml
      - name: Validate cache health
        id: validate-cache
        run: |
          if [ ! -f public/data/fork-risk.json ]; then
            echo "needs-rebuild=false" >> $GITHUB_OUTPUT
            exit 0
          fi

          HEALTH=$(jq -r '.cacheValidation.isHealthy' public/data/fork-risk.json)

          if [ "$HEALTH" = "false" ]; then
            echo "needs-rebuild=true" >> $GITHUB_OUTPUT
            echo "⚠️ Cache validation failed - rebuilding cache" >> $GITHUB_STEP_SUMMARY
          else
            echo "needs-rebuild=false" >> $GITHUB_OUTPUT
          fi
```

**Step 3: Verify YAML syntax**

Run: `yamllint .github/workflows/build-and-deploy.yml 2>&1 | grep -A2 "line 14[9-9]\|line 15[0-9]" || echo "✓ No syntax errors in validate-cache section"`

Expected: No syntax errors

**Step 4: Verify cache-rebuild condition is wired**

Run: `sed -n '181,185p' .github/workflows/build-and-deploy.yml`

Expected: Shows `if: needs.risk-monitor.outputs.needs-rebuild == 'true'` - this is correct

**Step 5: Commit**

```bash
git add .github/workflows/build-and-deploy.yml
git commit -m "feat: implement phase 2 - wire cache validation to needs-rebuild signal"
```

---

## Task 7: Update ForkDetailsCard Component

**Files:**
- Modify: `src/components/ForkDetailsCard.tsx:107`

**Step 1: Read current ForkDetailsCard**

Run: `sed -n '100,110p' src/components/ForkDetailsCard.tsx`

Expected: Shows line 107 displaying `formatTime(rawData.timestamp)`

**Step 2: Update timestamp reference**

Change line 107 from:

```typescript
{formatTime(rawData.timestamp)}
```

To:

```typescript
{formatTime(rawData.lastRiskChange)}
```

**Step 3: Verify TypeScript compilation**

Run: `npm run typecheck 2>&1 | grep -i forkdetails || echo "✓ ForkDetailsCard typecheck passed"`

Expected: No errors

**Step 4: Commit**

```bash
git add src/components/ForkDetailsCard.tsx
git commit -m "refactor: update ForkDetailsCard to use lastRiskChange instead of timestamp"
```

---

## Task 8: Update ForkDataProvider - Default Data

**Files:**
- Modify: `src/providers/ForkDataProvider.tsx:36-53`

**Step 1: Read current default data**

Run: `sed -n '36,53p' src/providers/ForkDataProvider.tsx`

Expected: Shows defaultData with old field structure

**Step 2: Update defaultData object**

Replace lines 36-53 with:

```typescript
	const [defaultData] = useState<ForkRiskData>(() => ({
		lastRiskChange: new Date().toISOString(),
		blockNumber: 0,
		riskLevel: 'none',
		riskPercentage: 0,
		metrics: {
			largestDisputeBond: 0,
			forkThresholdPercent: 0,
			activeDisputes: 0,
			disputeDetails: [],
		},
		calculation: {
			forkThreshold: 275000,
		},
	}))
```

**Step 3: Verify TypeScript compilation**

Run: `npm run typecheck 2>&1 | grep -i provider || echo "✓ ForkDataProvider typecheck passed"`

Expected: No errors

**Step 4: Commit**

```bash
git add src/providers/ForkDataProvider.tsx
git commit -m "refactor: update ForkDataProvider defaultData - remove timestamp/nextUpdate/method, use lastRiskChange"
```

---

## Task 9: Update ForkDataProvider - formatLastUpdated Function

**Files:**
- Modify: `src/providers/ForkDataProvider.tsx:136-142`

**Step 1: Read current formatLastUpdated function**

Run: `sed -n '136,142p' src/providers/ForkDataProvider.tsx`

Expected: Shows function reading `data.timestamp`

**Step 2: Update formatLastUpdated function**

Replace lines 136-142 with:

```typescript
	const formatLastUpdated = (data: ForkRiskData): string => {
		try {
			return new Date(data.lastRiskChange).toLocaleString()
		} catch {
			return 'Unknown'
		}
	}
```

**Step 3: Verify TypeScript compilation**

Run: `npm run typecheck 2>&1 | grep -i provider || echo "✓ ForkDataProvider typecheck passed"`

Expected: No errors

**Step 4: Commit**

```bash
git add src/providers/ForkDataProvider.tsx
git commit -m "refactor: update formatLastUpdated to read from lastRiskChange"
```

---

## Task 10: Update Demo Data Generator

**Files:**
- Modify: `src/utils/demoDataGenerator.ts:104-127`

**Step 1: Read current demo data return**

Run: `sed -n '104,127p' src/utils/demoDataGenerator.ts`

Expected: Shows return object with old field structure

**Step 2: Update demo data return object**

Replace lines 104-127 with:

```typescript
	return {
		lastRiskChange: now.toISOString(),
		blockNumber: Math.floor(Math.random() * 1000000) + 20000000,
		riskLevel,
		riskPercentage: Math.round(riskPercentage * 100) / 100,
		metrics: {
			largestDisputeBond,
			forkThresholdPercent: Math.round(forkThresholdPercent * 100) / 100,
			activeDisputes,
			disputeDetails,
		},
		rpcInfo: {
			endpoint: 'Demo Mode - Dispute Bond Simulation',
			latency: Math.floor(Math.random() * 200) + 100,
			fallbacksAttempted: 0,
		},
		calculation: {
			forkThreshold: FORK_THRESHOLD_REP,
		},
	}
}
```

**Step 3: Verify TypeScript compilation**

Run: `npm run typecheck 2>&1 | grep -i demo || echo "✓ Demo data generator typecheck passed"`

Expected: No errors

**Step 4: Commit**

```bash
git add src/utils/demoDataGenerator.ts
git commit -m "refactor: update demo data generator - remove timestamp/nextUpdate/method/isPublicRpc, use lastRiskChange"
```

---

## Task 11: Full Build and Typecheck

**Files:**
- All modified files from tasks 1-10

**Step 1: Run full typecheck**

Run: `npm run typecheck`

Expected: "✓ tsc success" or similar success message, 0 errors

**Step 2: Run linter**

Run: `npm run lint 2>&1 | head -30`

Expected: No critical errors (warnings ok)

**Step 3: Run build**

Run: `npm run build`

Expected: Build completes successfully, "dist/" directory created

**Step 4: Verify fork-risk.json was generated**

Run: `cat dist/data/fork-risk.json | jq 'keys' | head -15`

Expected: Shows keys matching new interface (lastRiskChange, blockNumber, riskLevel, etc., NO timestamp/nextUpdate)

**Step 5: Commit**

```bash
git add .
git commit -m "build: verify all Phase 2 changes compile and build successfully"
```

---

## Task 12: Integration Test - Mock Scenario

**Files:**
- Test: Manual workflow simulation

**Step 1: Simulate risk data generation**

Run: `npm run build:fork-data`

Expected: Script runs successfully, produces `public/data/fork-risk.json`

**Step 2: Verify fork-risk.json structure**

Run: `jq '.' public/data/fork-risk.json | head -20`

Expected: Shows fields: lastRiskChange, blockNumber, riskLevel, riskPercentage, metrics, rpcInfo, calculation, cacheValidation, NO timestamp/nextUpdate

**Step 3: Simulate workflow cache validation step**

Run: `HEALTH=$(jq -r '.cacheValidation.isHealthy' public/data/fork-risk.json); echo "Cache healthy: $HEALTH"; if [ "$HEALTH" = "false" ]; then echo "Would trigger rebuild"; else echo "No rebuild needed"; fi`

Expected: Shows "Cache healthy: true" and "No rebuild needed"

**Step 4: Change risk to verify fields update correctly**

Run: `npm run dev &` (start in background)
Expected: Dev server starts on port 4321

Run: `sleep 2 && curl -s http://localhost:4321 | grep -i fork`
Expected: Page loads successfully

Run: `kill %1` (kill background job)

**Step 5: Commit**

```bash
git add .
git commit -m "test: verify Phase 2 implementation with mock scenario"
```

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/types/gauge.ts` | Remove timestamp/nextUpdate/method, rename lastUpdated→lastRiskChange, add cacheValidation |
| `scripts/calculate-fork-risk.ts` | 3 updates (main calc, fork result, error result) - consistent field structure |
| `.github/workflows/build-and-deploy.yml` | 2 updates (bootstrap data, Phase 2 validation step) |
| `src/components/ForkDetailsCard.tsx` | Reference lastRiskChange instead of timestamp |
| `src/providers/ForkDataProvider.tsx` | Update defaultData and formatLastUpdated function |
| `src/utils/demoDataGenerator.ts` | Update demo data structure |

---

## Verification Checklist

- [ ] TypeScript interface updated (no timestamp/nextUpdate/method, has lastRiskChange/cacheValidation)
- [ ] All three data-producing paths updated (main calc, fork detection, error)
- [ ] Workflow bootstrap matches new interface
- [ ] Phase 2 validation step reads cacheValidation and sets needs-rebuild
- [ ] UI component references lastRiskChange
- [ ] Data provider reads from lastRiskChange
- [ ] Demo data matches production interface
- [ ] Full typecheck passes (npm run typecheck)
- [ ] Full build passes (npm run build)
- [ ] fork-risk.json has correct structure (verified with jq)
- [ ] Workflow condition `needs.risk-monitor.outputs.needs-rebuild == 'true'` is wired to cache-rebuild job
