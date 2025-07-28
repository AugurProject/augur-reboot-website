# Astro View Transitions Knowledge Extract

## Executive Summary
Key new knowledge: ClientRouter component for SPA-mode, transition directives system, lifecycle events for script management, and programmatic navigation patterns not commonly documented in basic Astro guides.

## Novel Concepts

### SPA Mode Implementation
```astro
// Enable site-wide client-side routing
import { ClientRouter } from "astro:transitions";
<ClientRouter />
```

### Transition Directives System
```astro
<!-- Name matching for element pairs -->
<aside transition:name="hero">

<!-- Persist state across navigation -->
<video transition:persist controls autoplay>

<!-- Control props persistence -->
<Counter client:load transition:persist transition:persist-props />

<!-- Animation control -->
<main transition:animate="slide">
<html transition:animate="none">
```

### Custom Animation Definitions
```astro
---
const customTransition = {
  forwards: {
    old: { name: "bump", duration: "0.5s", direction: "reverse" },
    new: { name: "bump", duration: "0.5s", easing: "ease-in-out" }
  },
  backwards: { /* same structure */ }
};
---
<header transition:animate={customTransition}>
```

### Programmatic Navigation
```astro
<script>
import { navigate } from "astro:transitions/client";

// Trigger navigation programmatically
navigate(href, {
  history: "push" | "replace" | "auto",
  formData: new FormData()
});
</script>
```

## Updated Practices

### Router Control Attributes
```astro
<!-- Force full-page reload -->
<a href="/page" data-astro-reload>

<!-- Control browser history -->
<a href="/page" data-astro-history="replace">
```

### Script Re-execution Management
```astro
<!-- Force inline script re-execution -->
<script is:inline data-astro-rerun>
  // Runs on every navigation
</script>

<!-- Event-driven script execution -->
<script>
document.addEventListener("astro:page-load", () => {
  // Setup after navigation
});
</script>
```

### Lifecycle Events Pattern
Five key events for navigation control:
- `astro:before-preparation` - Loading indicators, content override
- `astro:after-preparation` - Post-load setup
- `astro:before-swap` - DOM modification, custom swap logic
- `astro:after-swap` - State restoration
- `astro:page-load` - Post-navigation setup

## Implementation Notes

### Custom Swap Implementation
```astro
<script>
import { swapFunctions } from "astro:transitions/client";

document.addEventListener("astro:before-swap", (event) => {
  event.swap = () => {
    swapFunctions.deselectScripts(event.newDocument);
    swapFunctions.swapRootAttributes(event.newDocument);
    swapFunctions.swapHeadElements(event.newDocument);
    const restoreFocus = swapFunctions.saveFocus();
    swapFunctions.swapBodyElement(event.newDocument.body, document.body);
    restoreFocus();
  };
});
</script>
```

### Form Integration
```astro
<!-- Forms work with client-side routing -->
<form action="/contact" method="POST" enctype="application/x-www-form-urlencoded">
<!-- Opt-out specific forms -->
<form action="/upload" data-astro-reload>
```

### Fallback Control
```astro
<ClientRouter fallback="animate" /> <!-- Default -->
<ClientRouter fallback="swap" />    <!-- No animation -->
<ClientRouter fallback="none" />    <!-- Full page navigation -->
```

## Learning Priority

1. **High**: ClientRouter setup and transition directives - Core functionality
2. **High**: Lifecycle events for script management - Prevents broken functionality
3. **Medium**: Custom animations and programmatic navigation - Enhanced UX
4. **Low**: Custom swap implementation - Advanced use cases

**Key Difference**: Unlike basic Astro routing, this creates true SPA behavior with fine-grained control over navigation, animations, and state persistence - moving beyond simple page transitions to application-like navigation experiences.