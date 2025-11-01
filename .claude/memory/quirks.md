# Quirks

Non-standard behaviors and workarounds.

## Tailwind v4 CSS-First
No tailwind.config.js file. All customization via @theme/@utility directives in src/styles/global.css.

## Astro Scoped Styles Default
Component <style> blocks auto-scoped with data-astro-cid-* attributes. Use is:global for truly global styles.

## Fork Risk Formula
(Largest Dispute Bond / 275,000 REP) × 100 = Risk %. Smaller denominator would severely underestimate risk.

## F2 Demo Mode
Press F2 in development to toggle 5 fork risk scenarios. Dev-only feature with production guards.

## RPC Endpoint Failover
Uses 4 public endpoints (LlamaRPC, LinkPool, PublicNode, 1RPC) with auto-fallback. No API keys needed.

## Dialog TypeScript imports: Must add baseUrl and paths to tsconfig.app.json (not inherited from root tsconfig.json) for @/* aliases to work in UI components

---
## Dialog Close Button: Custom-styled text button '[ X ] Close' (not lucide icon) via linter. Uses fx-glow hover effect and matches terminal aesthetic. Icon div has pointer-events-none.

---
## Icon Library: Project uses lucide-react exclusively. Remove @radix-ui/react-icons and use lucide icons (X for close, etc) for consistency.

---
