---
title: Post-Fork Landing Page Implementation Plan
tags: [homepage, fork, post-fork, implementation, github-actions]
---

# Post-Fork Landing Page Implementation Plan

## Status

**Implementation and post-deadline verification complete.** This document defines the change from the fork-migration hero to a durable post-fork record. The authoritative evidence is preserved in [[moon-fork-final-record]]. The versioned fork JSON contract and lifecycle derivation are implemented, the generator reads exact migration counters at one observed block, and the defensive post-deadline path preserves the record if a compatible parent reports `isForking() == false`. The deployed Augur v2 parent continued to return `true` after closure, consistent with its “forking or has forked” source semantics. Monitoring continues after closure; reducing its cadence is a separate operational follow-up.

## Local Review Demo

The first visual slice is available locally while the full post-fork transition remains phased:

1. Start the site with `npm run dev`.
2. [Click “DEV: F2 for demo”](http://localhost:4321/) in the upper-left corner, or press `F2`.
3. Select an **Active Fork** scenario to review the original live/main CTA while the winner is unknown.
4. Select **Winner Known — Migration Still Open** to review the closing-window CTA while migration remains actionable.
5. Select **Winner Known — Closing (~1 Day)** to review the same resolved state near the deadline.
6. Select **Migration Closed — Fork Record** to review the historical record and resolution dialog.
7. Select **Migration Closed — Winner Pending** to review the safe post-deadline fallback.
8. Select **Return to Fork JSON Data** to restore the local fork JSON data.

The demo controls are development-only and are not rendered in production builds. They exercise the same lifecycle derivation used by the CTA and lower hero, including the rule that a known winner does not reveal the Fork Record before the deadline.

The local CTA copy is tied to the lifecycle signal: an unknown winner keeps the original live/main copy, while an established winner uses the closing-window copy for as long as migration remains open.

## Protocol Verification Snapshot

A finalized, post-deadline read at Ethereum mainnet block `25,677,103` (`2026-08-03T21:36:23Z`) established the durable record:

- The migration deadline was `2026-08-03T01:00:59Z`, 20 hours, 35 minutes, and 24 seconds before the observation.
- `getWinningChildUniverse()` returned `0x281171519Fb41540528398d8ED3EA257f0F32A9f`, outcome index `1` (`Yes`).
- The winning universe's REP token was `REPv2_Yes_1` at `0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D`.
- Final migration counters were `6,398,081.4136814946108694 REP` for Yes, `1,786.227400866527400056 REP` for No, and `0 REP` for Invalid.
- Two RPC endpoints reproduced the material values at the same finalized block.

See [[moon-fork-final-record]] for exact wei values, the block hash, contract methods, source-code permalinks, conflict resolution, and final versus observed-only fields.

## Confirmed Product Decisions

- After the migration deadline, the landing page presents the Fork Record while monitoring continues.
- Revisit monitoring cadence after closure; a future protocol change or new oracle work can justify a later schedule change.
- `VIEW RESOLUTION` opens a dialog.
- Etherscan is the initial verification destination.
- The Fork Record remains in the hero temporarily; its eventual move to a historical section can be decided later.
- Migration CTAs link to the full guide at `/learn/fork/migration/`.

## Goal

Turn the lower landing-page hero from an action-oriented migration warning into a state-aware account of the fork:

- While migration is open, preserve the urgent REP migration action, countdown, and progress.
- If a winning child universe is known before the deadline, switch only the CTA to the closing-window copy; keep the existing countdown and migration progress presentation.
- After migration closes, remove the action CTA and replace the countdown with a factual, inspectable Fork Record.
- Ground every canonical-universe claim in the fork JSON data generated from on-chain state.
- Revisit the monitoring cadence separately after the historical record is stable; this landing-page change does not retire the fork monitor.

The core post-fork message remains:

> The protocol reached consensus. A canonical universe emerged. The reboot continues.

The page should present that as provenance, not as a security score, victory claim, or request for trust.

## Non-Goals

- Redesigning the entire homepage, navigation, featured posts, mission page, FAQ, or migration guide in the first release.
- Removing the migration experience before the migration window closes.
- Inventing a numerical confidence or security score.
- Treating a client-side countdown reaching zero as proof that a winner exists.
- Renaming the public `/data/fork-risk.json` endpoint during the transition.
- Deleting scripts, components, cache files, or workflow jobs before their consumers and fallback value are audited.

## Current-State Audit

### User interface

The hero now renders two coordinated elements that are semantically one experience:

1. **State-aware CTA** in `src/features/fork-monitor/fork-action.tsx`: “THE FORK IS HERE! OWN REP? ACT NOW.” or the closing-window copy.
2. **Lifecycle monitor** in `src/features/fork-monitor/display.tsx`.

The CTA and monitor now share `ForkExperience` and derive the state from the fork record. The monitor previously chose the active-fork card when:

```ts
rawData.metrics.disputeDetails[0]?.marketId === "FORKING"
```

This sentinel remains in the compatibility fields, but it is no longer the UI lifecycle contract. The browser derives the presentation from the versioned fork record and current time, so the CTA disappears at the verified deadline and the lower hero cannot render a zeroed migration countdown as a post-fork record.

### Fork JSON data

`public/data/fork-risk.json` currently contains:

- pre-fork risk metrics;
- an artificial `FORKING` dispute record;
- `forkActive.forkEndTime`;
- the forking market;
- the reputation goal;
- parent-universe REP supply;
- outcome labels, child universes, migrated REP totals, and the contract-reported winner.

Schema version 2 now adds the explicit fork record, winner, outcome mapping, generation timestamp, and observed block while preserving the existing fields and `forkActive` shape.

### Script and protocol access

`scripts/calculate-fork-risk.ts` checks `universe.isForking()`. When true, it emits a maximum-risk result and active-fork details, including `getWinningChildUniverse()`, child REP token addresses, and the normalized fork record. The generated result is validated before it is written.

`scripts/probe-fork-state.ts` already includes `getWinningChildUniverse()` and can walk from a parent universe into the winning child. It is diagnostic-only and does not write the fork JSON data.

### GitHub Actions

`.github/workflows/build-and-deploy.yml` currently runs hourly and on push, pull request, and manual dispatch:

```text
risk-monitor → build → deploy
```

Every hourly run recalculates the fork JSON data, rebuilds the entire site, and deploys the result on `main`. The landing-page change does not alter that workflow; a later cadence adjustment belongs to a separate CI change.

The existing event cache uses an immutable exact key (`event-cache-v1`), so its updated contents are not persisted across warm runs as intended. That issue is relevant only while dispute discovery remains active.

### Migration warning content

The hero is not the only place that presents migration as an active emergency. These surfaces now derive their active/closed treatment from the same build-time fork JSON lifecycle:

- `src/pages/faq.astro`: urgent intro, red migration CTA, “Open now” timeline copy, deadline instructions, and current ForkWatch wording.
- `src/features/learn/migration-cta.tsx`: active critical CTA remains available while migration is open.
- `src/content/learn/fork/index.mdx`: critical migration banner becomes a closed-window record notice.
- `src/content/learn/fork/what-to-do.mdx`: risk guidance is explicitly framed as historical after the migration window closes.
- `src/layouts/MigrationGuideLayout.astro` and `src/content/learn/fork/migration.mdx`: deadline alert, navigation marker, description, and closed-window framing are state-aware.
- `src/layouts/LearnLayout.astro` and `src/features/learn/navigation.tsx`: the migration guide's `ACT NOW` treatment is removed after closure through the `critical` state.
- `src/pages/mission.astro`: current-tense migration-window timeline copy becomes a historical milestone.
- `src/lib/fork-data.ts`: build-time state reader used by Astro pages and layouts.

Historical blog posts should remain available as historical material. They should not be rewritten as if they describe the current state, but can receive an archive/date treatment if the release review finds the context unclear.

## Lifecycle Contract

The user experience must distinguish resolution from the migration deadline. The fork can resolve early when one child receives more than the reputation goal, while REP migration remains available for the full migration window.

### Required states

| State | Winner known | Migration deadline passed | Hero CTA | Lower hero |
|---|---:|---:|---|---|
| `monitoring` | No | No fork | None or existing monitor treatment | Pre-fork risk monitor |
| `migration-open` | No | No | `THE FORK IS HERE! OWN REP? ACT NOW.` | Countdown and migration progress |
| `migration-open-resolved` | Yes | No | `MIGRATION WINDOW CLOSING, ACT NOW!` | Existing countdown and migration progress |
| `migration-closed-resolved` | Yes | Yes | No migration CTA | Fork Record |
| `migration-closed-unverified` | No/unknown | Yes | No migration CTA | Resolution pending verification |
| `data-unavailable` | Unknown | Unknown | No consequential CTA | Honest unavailable/stale state |

### Authoritative inputs

- **Winner known:** a non-zero `getWinningChildUniverse()` result from the parent universe contract, matched to an emitted outcome. An outcome exceeding the reputation goal is supporting evidence.
- **Migration open:** current time is earlier than the verified migration deadline represented by the existing `forkEndTime` field. Phase 0 confirmed that this contract value is the active migration deadline for the deployed Augur implementation.
- **Migration closed:** current time is at or after that deadline.
- **Canonical universe:** the exact winning child universe returned by the contract, matched to the corresponding outcome record.

### Time handling

The generated lifecycle field is a snapshot, but the browser remains open while time passes. The UI therefore derives presentation from both the fork JSON data and current time:

```text
winner signal from fork JSON data
        +
fork deadline from fork JSON data
        +
current browser time
        ↓
derived hero state
```

The browser may hide the migration CTA once a verified deadline passes, even if the fork JSON data is stale. It must not declare a canonical universe unless the fork JSON data contains the authoritative winner signal.

## Proposed Fork JSON Data Contract

Keep `/data/fork-risk.json` during the migration to avoid breaking the UI or external consumers. Make the change additive and versioned.

Illustrative shape:

```json
{
  "schemaVersion": 2,
  "generatedAt": "2026-08-02T00:00:00.000Z",
  "fork": {
    "status": "migration-open-resolved",
    "parentUniverse": "0x...",
    "forkingMarket": "0x...",
    "migrationDeadline": 1785718859,
    "reputationGoal": 5497186.88,
    "winningChildUniverse": "0x...",
    "outcomes": [
      {
        "index": 1,
        "label": "Yes",
        "childUniverse": "0x...",
        "reputationToken": "0x...",
        "migratedRep": 6454838.02,
        "isWinner": true
      }
    ]
  },
  "metrics": {}
}
```

Final field names should follow what the contract actually exposes. During the compatibility period, preserve `forkActive` and the existing risk fields while the new `fork` object is introduced. The UI should prefer schema version 2 and retain a tested adapter for the current shape until the transition deploy is stable.

### Runtime validation

Before writing the fork JSON data, the calculation script should reject internally inconsistent states, including:

- `status` claims resolution but `winningChildUniverse` is zero or absent;
- a winning child does not match any emitted outcome;
- migration deadline is missing during an active or resolved fork;
- duplicate child universe addresses;
- negative or non-finite REP values;
- malformed Ethereum addresses;
- generated timestamp or observed block is missing.

A validation failure should fail the data job. The existing deployed site then remains on its last good fork JSON data rather than publishing a false canonical claim.

## Proposed User Experience

### Migration open, winner not yet known

Preserve the current experience, with copy and layout refinement only if needed:

```text
THE FORK IS HERE! OWN REP? ACT NOW.

FORK ACTIVE, MIGRATING
01 DAYS 08 HRS 28 MIN 55 SEC
58.7% REP MIGRATED
```

### Migration open, winner known

Migration remains actionable. The winner signal changes only the CTA copy; the lower hero stays on the existing migration countdown and progress presentation. Do not show the Fork Record, canonical-universe declaration, or `VIEW RESOLUTION` before the migration window closes:

```text
MIGRATION WINDOW CLOSING, ACT NOW!

FORK ACTIVE, MIGRATING
01 DAYS 08 HRS 28 MIN 55 SEC
58.7% REP MIGRATED
```

This is the transitional state demonstrated locally. The historical record begins only after the verified migration deadline passes.

### Migration closed, winner known

Remove the urgent CTA and countdown. The lower hero becomes the historical record:

```text
THE FORK RECORD

A canonical universe emerged.
The reboot continues.

CANONICAL UNIVERSE
0x2811...A9f

[ VIEW RESOLUTION ]
```

`VIEW RESOLUTION` is disclosure, not a required action. It opens an accessible dialog using the project’s existing dialog primitives. The first version should contain:

```text
Legacy Universe
      ↓
Fork Triggered
      ↓
REP Migration
      ↓
Canonical Universe
      ↓
Reboot Continues
```

Each step presents factual fields only: addresses, block or timestamp where available, outcome, migration totals, and external verification links. Editorial claims should remain outside the data layer.

### Migration closed, winner unverified

Do not retain a zeroed countdown and do not guess the winner:

```text
MIGRATION WINDOW CLOSED

Resolution pending verification.
Last checked: ...
```

This is the safe state for RPC failure, a stale fork JSON file, or an unexpected contract transition.

## Component Architecture

The CTA and monitor need one data owner so they cannot disagree.

```text
HeroBanner
└── ForkExperienceProvider
    ├── HeroForkAction
    ├── ForkExperienceDisplay
    │   ├── ActiveMigrationCard
    │   ├── ForkRecord
    │   └── ForkDataUnavailable
    └── ForkControls (development only)
```

Recommended implementation details:

- Move `ForkDataProvider` and `ForkMockProvider` high enough to serve both the CTA and lower display.
- Extract lifecycle derivation into a pure function such as `derive-fork-lifecycle.ts`.
- Keep time-dependent rendering in one hook so the CTA and countdown transition together.
- Keep `active-card.tsx` during migration; do not overload it with post-fork presentation.
- Add `post-fork-record.tsx` for the historical state and its resolution dialog.
- Keep the existing error boundary around the complete fork experience.
- Preserve development-only F2 controls and add explicit lifecycle scenarios.

## Expected File Changes

| File | Change |
|---|---|
| `src/features/home/hero-banner.tsx` | Remove the unconditional migration CTA; render state-aware action and display under one provider |
| `src/features/fork-monitor/monitor.tsx` | Evolve into the shared fork-experience boundary or deprecate after its provider responsibilities move |
| `src/features/fork-monitor/clock.tsx` | Provide one ticking timestamp so CTA, countdown, and closed-state transition together |
| `src/features/fork-monitor/display.tsx` | Switch on the derived lifecycle instead of the `FORKING` sentinel |
| `src/features/fork-monitor/active-card.tsx` | Preserve active migration behavior; accept normalized lifecycle data |
| `src/features/fork-monitor/fork-action.tsx` | State-aware migration CTA that preserves the original copy until a winner is known, then uses the closing copy while migration remains open |
| `src/features/fork-monitor/derive-fork-lifecycle.ts` | New pure lifecycle derivation and safety rules |
| `src/features/fork-monitor/validate-fork-data.ts` | Validate versioned data before it reaches the UI or build-time content |
| `src/features/fork-monitor/data-provider.tsx` | Parse versioned fork JSON data and expose normalized state |
| `src/features/fork-monitor/types.ts` | Add schema version, fork resolution fields, and normalized lifecycle types |
| `src/features/fork-monitor/demo-data.ts` | Add open-unresolved, open-resolved, closed-resolved, and closed-unverified fixtures |
| `src/features/fork-monitor/controls.tsx` | Make the local demo trigger clickable, expose the closing-window scenario, and rename “Return to Live Data” to “Return to Fork JSON Data” |
| `src/features/fork-monitor/post-fork-record.tsx` | Render the closed Fork Record, resolution dialog, and unverified fallback |
| `src/pages/faq.astro` | Replace or state-gate active migration warnings after the deadline while retaining useful fork mechanics and safety information |
| `src/features/learn/migration-cta.tsx` | Preserve the shared critical CTA for the open-migration state |
| `src/content/learn/fork/index.mdx` | Update the fork explainer’s time-bound migration banner |
| `src/content/learn/fork/what-to-do.mdx` | State-gate active fork-risk guidance and label it historical after closure |
| `src/layouts/MigrationGuideLayout.astro` | Replace the post-deadline critical alert and migration navigation treatment |
| `src/content/learn/fork/migration.mdx` | Preserve the guide as historical/reference material and update its closed-window framing |
| `src/layouts/LearnLayout.astro` | Remove or state-gate the critical migration navigation marker |
| `src/features/learn/navigation.tsx` | Remove or state-gate the `ACT NOW` label after closure |
| `src/pages/mission.astro` | Convert current-tense migration timeline copy into a historical milestone |
| `src/lib/fork-data.ts` | Read the generated fork JSON during static builds for state-gated content |
| `src/styles/global.css` | Coordinate CTA/record spacing, entrance animation, responsive layout, and reduced motion |
| `scripts/calculate-fork-risk.ts` | Read winner and parent/child data, emit schema v2, validate before writing |
| `scripts/probe-fork-state.ts` | Confirm and retain diagnostic coverage for the exact resolution signals |
| `public/data/fork-risk.json` | Generated fixture/snapshot updated to the compatible schema |
| `package.json` | Add targeted lifecycle/data tests if needed; retain dual-tsconfig commands |
| `scripts/fork-lifecycle.test.ts` | Exercise lifecycle boundaries and malformed winner data |
| `docs/public-data-endpoints.md` | Document the additive schema and compatibility window |
| `docs/technical-architecture.md` | Update the homepage component hierarchy and state ownership |

## Delivery Phases

Estimates are implementation effort, not calendar commitments. Review and protocol verification can extend elapsed time.

### Phase 0 — Verify protocol signals and lifecycle semantics — COMPLETE FOR CURRENT SNAPSHOT

**Estimate:** 0.5–1 day

**Work:**

- Run the diagnostic probe against the parent universe and forking market.
- Confirm the behavior of `isForking()`, `getForkEndTime()`, and `getWinningChildUniverse()` before and after early resolution.
- Confirm whether `forkEndTime` is the full REP migration deadline in this deployed contract.
- Match the winning child address to the correct outcome and REP token.
- Record the exact block and timestamp used for acceptance fixtures.
- Resolve terminology: “winning universe” is protocol language; “canonical universe” is presentation language.

**Gate:** Satisfied for the current contract snapshot. The generated data must continue to re-read these values on each run.

### Phase 1 — Data contract and lifecycle foundation — COMPLETE LOCALLY

**Estimate:** 1–1.5 days

**Work:**

- Add schema version 2 fields additively.
- Extract lifecycle derivation into a pure, testable function.
- Implement backward compatibility for the current fork JSON shape.
- Add deterministic fixtures for every lifecycle state.
- Add runtime validation to the data generation path.
- Add tests for deadline boundaries, winner absence, stale data, and malformed records.

**Gate:** Lifecycle tests pass without rendering UI, including one second before, exactly at, and one second after the migration deadline.

### Phase 2 — Local visual implementation — COMPLETE LOCALLY

**Estimate:** 1.5–2.5 days plus visual review

**Work:**

- Bring the CTA and monitor under one provider and lifecycle state.
- Preserve the current active migration card.
- Add the open-resolved transitional presentation.
- Build the closed-resolved Fork Record and resolution dialog.
- Add the closed-unverified fallback.
- Extend F2 controls for side-by-side local review.
- Test desktop, tablet, and mobile layouts plus reduced motion.

**Gate:** Every lifecycle can be selected locally without editing source or the fork JSON file, and the CTA never contradicts the lower panel.

### Phase 3 — Script integration with on-chain state — COMPLETE LOCALLY

**Estimate:** 1–2 days

**Work:**

- Move the verified winner-reading logic from the probe into the calculation path.
- Emit parent universe, winning child, outcome mapping, observed block, and generated timestamp.
- Preserve RPC fallback behavior.
- Fail safely on contradictory or incomplete resolution data.
- Run the script locally and compare output with the Phase 0 acceptance fixture.

**Gate:** Two independent reads against the same finalized block produce equivalent lifecycle and winner data.

### Phase 4 — Fork data handoff — COMPLETE LOCALLY; CI FOLLOW-UP SEPARATE

**Estimate:** 0.5–1 day

**Work:**

- Preserve the fork record if the parent universe stops reporting `isForking()` immediately after the migration deadline.
- Keep the existing CI schedule and artifact flow unchanged in this landing-page PR.
- Handle monitoring cadence and event-cache persistence in the separate CI workstream.

**Gate:** The generated data preserves the fork record after closure, and the existing build continues to receive the JSON artifact.

### Phase 5 — Content, accessibility, and release verification — COMPLETE LOCALLY; RELEASE GATE PENDING

**Estimate:** 0.5–1 day

**Work:**

- Finalize hero and Fork Record copy.
- Review every active migration warning and convert closed-window content to historical or post-fork guidance.
- Validate canonical addresses, labels, links, timestamps, and migrated REP totals.
- Verify keyboard navigation, focus return, dialog labeling, contrast, reduced motion, and screen-reader names.
- Run `npm run typecheck`, `npm run typecheck:scripts`, `npm run lint`, lifecycle/data tests, and `npm run build`.
- Render all lifecycle states locally and capture screenshots for review.

**Gate:** Product, data, responsive, and accessibility success criteria are all met.

### Phase 6 — Post-fork monitoring follow-up

**Earliest timing:** after the migration deadline, authoritative winner verification, and a stable post-close deployment. A 24–48 hour observation buffer is recommended.

**Estimate:** 0.5–1.5 days, depending on the ongoing-monitor decision

- Revisit the monitoring cadence and cache persistence separately.
- Decide whether monitoring should follow the winning universe or remain a historical fork-state monitor.
- Preserve the Fork Record as part of the public state surface.

**Gate:** The follow-up has an explicit cadence, stale-data policy, and ownership decision before any schedule or cache changes are made.

## CI and Rollout Strategy

### Before migration closes

- Keep hourly calculation, build, and deployment.
- Publish additive fork JSON fields.
- Deploy UI compatibility before relying on the new fields.
- Keep migration CTA and countdown available whenever the deadline is still open.

### At the deadline

- The browser removes the migration CTA based on the verified deadline.
- The UI shows the Fork Record only if the winner is present and valid in the fork JSON data.
- Otherwise it shows “Resolution pending verification.”
- The next successful hourly run confirms the post-close state and republishes the site.

### After the deadline

- Keep monitoring while the post-close state is observed.
- Keep the Fork Record as the historical presentation.
- Decide the lower-frequency schedule in the separate CI follow-up.

### Rollback

- UI rollback: select the compatibility adapter and render the existing active card from the current fork JSON shape.
- Data rollback: schema v2 is additive, so older UI continues reading existing fields.
- CI rollback: preserve the existing artifact/build/deploy chain; schedule and cache changes are outside this PR.
- Content rollback: if canonical verification becomes questionable, force the closed-unverified presentation without restoring a migration CTA after the deadline.

## Test Matrix

| Scenario | Expected result |
|---|---|
| No `fork` and no `forkActive` | Existing pre-fork monitor or safe unavailable state |
| Migration open, no winner | Migration CTA, countdown, progress |
| Migration open, winner known | Closing CTA with the existing countdown and migration progress; no Fork Record or resolution disclosure |
| One second before deadline | Migration CTA present |
| Exactly at deadline | Migration CTA removed |
| After deadline, winner known | Fork Record shown |
| After deadline, winner absent | Resolution pending verification |
| Winner does not match an outcome | Data validation fails; no deploy |
| Fork JSON fetch fails | Honest unavailable state; no false canonical claim |
| Fork JSON is stale across deadline | CTA closes by deadline; canonical claim still requires winner data |
| Reduced motion | No entrance, pulse, bob, or countdown motion required to understand state |
| Mobile viewport | Record and dialog remain readable without horizontal overflow |

## Success Criteria

### Product and messaging

- The page answers what happened, where the protocol is now, and how the result can be verified.
- No migration action is shown after the verified deadline.
- A migration action remains visible while migration is still possible, even if a winner has already been established.
- The Fork Record and resolution dialog never appear before the verified migration deadline.
- “Canonical universe” is never asserted from migration percentages alone.
- The post-fork experience reads as a record, not a status dashboard or victory announcement.

### Data integrity

- Winner, child universe, outcome, deadline, and totals trace to the fork JSON data.
- The fork JSON data identifies its schema version, generation time, and observed block.
- Contradictory resolution data is rejected before it reaches the UI or build-time content.
- The UI has an explicit unverified fallback and never guesses.

### User interface

- CTA and lower hero always represent the same lifecycle state.
- All lifecycle states are available through local F2 demo controls.
- The Fork Record works at supported viewport sizes and with reduced motion.
- Resolution disclosure is keyboard accessible and returns focus correctly.
- The hero remains coherent when no CTA is rendered.

### Engineering and CI

- `npm run typecheck`, `npm run typecheck:scripts`, `npm run lint`, targeted tests, and `npm run build` pass.
- Pull requests validate both current and versioned fork JSON fixtures.
- A failed fork-state read cannot deploy a fabricated or incomplete record.
- The deployment can be rolled back without changing the public data URL.

### Monitoring follow-up

- Monitoring cadence changes only after a defined post-close observation period.
- Any schedule or cache change is handled as a separate operational PR.
- The public endpoint remains compatible while the Fork Record is presented.

## Remaining Decisions and Revisit Points

- Decide whether the canonical universe address appears in the collapsed record or only inside the resolution dialog.
- Define what future protocol change or oracle release triggers the documented reactivation review.
- Revisit whether the resolved record should remain in the hero or move into a dedicated historical section later.

## Documentation Updates on Completion

- Update [[technical-architecture]] for shared fork-state ownership and the new component hierarchy.
- Update [[public-data-endpoints]] for schema version 2 and compatibility guarantees.
- Update [[fork-monitoring-pipeline]] separately when the monitoring cadence or cache strategy changes.
- Update [[fork-monitoring-methodology]] if monitoring follows the winning universe.
- Update [[fork-mechanics]] only if implementation verification reveals that the current deadline or early-resolution wording is inaccurate.
