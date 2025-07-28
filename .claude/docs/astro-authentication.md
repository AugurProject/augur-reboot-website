# Astro Authentication Implementation Patterns

## Executive Summary
Key authentication patterns extracted from Astro docs covering Auth.js, Better Auth, Clerk, and Lucia integrations with focus on session handling, middleware protection, and client-server auth flow.

## Novel Concepts

### Auth.js Integration Pattern
```ts
// auth.config.ts - Root-level config approach
import GitHub from '@auth/core/providers/github';
import { defineConfig } from 'auth-astro';

export default defineConfig({
  providers: [
    GitHub({
      clientId: import.meta.env.GITHUB_CLIENT_ID,
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
    }),
  ],
});
```

**New**: Root-level auth config file pattern, not component-level. Uses `defineConfig` wrapper for type safety.

### Better Auth API Route Handler
```ts
// src/pages/api/auth/[...all].ts
export const ALL: APIRoute = async (ctx) => {
  return auth.handler(ctx.request);
};
```

**New**: Catch-all API route pattern for auth endpoints. Single handler for all HTTP methods.

## Updated Practices

### Server-Side Session Access
```astro
---
// Auth.js approach
const session = await getSession(Astro.request);

// Better Auth approach  
const session = await auth.api.getSession({
  headers: Astro.request.headers,
});
---
```

**Change**: Headers-based session retrieval vs request object. Better Auth requires explicit header passing.

### Middleware Route Protection
```ts
// Better Auth middleware pattern
export const onRequest = defineMiddleware(async (context, next) => {
  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });
  if (context.url.pathname === "/dashboard" && !isAuthed) {
    return context.redirect("/");
  }
  return next();
});
```

**New**: Path-based protection with URL pathname checking. Session validation in middleware layer.

### Client-Side Auth Actions
```astro
<script>
  // Auth.js pattern
  const { signIn, signOut } = await import("auth-astro/client")
  document.querySelector("#login").onclick = () => signIn("github")

  // Better Auth pattern
  const { signIn, signOut } = await import("./lib/auth-client")
  document.querySelector("#login").onclick = () => signIn.social({
    provider: "github",
    callbackURL: "/dashboard",
  })
</script>
```

**Change**: Better Auth uses object-based signin with explicit callback URLs vs string provider names.

## Implementation Notes

### Environment Variables Pattern
```sh
AUTH_TRUST_HOST=true
AUTH_SECRET=<32-char-minimum-secret>
```

**Critical**: `AUTH_TRUST_HOST=true` required for deployment environments. Minimum 32-character secret requirement.

### Prerender Disable Pattern
```astro
export const prerender = false; // Required for auth pages
```

**Essential**: Authentication pages must disable prerendering. Not needed in server mode.

### Component-Based Protection (Clerk)
```astro
<SignedIn>
  <UserButton />
</SignedIn>
<SignedOut>
  <SignInButton />
</SignedOut>
```

**New**: Declarative auth state components vs imperative session checks.

## Learning Priority

1. **High**: Middleware route protection patterns - affects entire app security
2. **High**: Session access patterns - different between providers 
3. **Medium**: Client-side auth integration - varies by UI framework
4. **Low**: Provider-specific configuration - documentation-driven setup