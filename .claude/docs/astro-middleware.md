# Astro Middleware Implementation Patterns

## Executive Summary
Astro middleware intercepts requests/responses with typed function patterns, context passing, and sequential execution chains.

## Novel Concepts

### defineMiddleware() Type Safety Pattern
```ts
// src/middleware.ts
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  // context and next automatically typed
  return next();
});
```

### sequence() Chain Execution
```js
import { sequence } from "astro:middleware";

async function validation(_, next) { /* validation logic */ }
async function auth(_, next) { /* auth logic */ }
async function greeting(_, next) { /* greeting logic */ }

export const onRequest = sequence(validation, auth, greeting);
```

### onRequest() Core Pattern
```js
export function onRequest(context, next) {
  // intercept response data from request
  // optionally transform response
  // return Response directly or call next()
  return next();
}
```

### Request Rewriting (v4.13.0+)
```js
// next() accepts optional URL path for rewrites
next("/rewritten-path");           // string
next(new URL("/path", request.url)); // URL
next(new Request("/path"));        // Request
```

## Updated Practices
- Use `defineMiddleware()` for automatic TypeScript typing
- Chain middleware with `sequence()` for ordered execution
- Leverage `next()` rewriting for internal route handling

## Implementation Notes
- `onRequest()` signature: `(context: APIContext, next: MiddlewareNext) => Promise<Response> | Response`
- Context mirrors `Astro` global properties
- `next()` calls subsequent middleware and returns Response
- Must return Response either directly or via `next()`

## Learning Priority
1. **High**: `defineMiddleware()` and `onRequest()` patterns
2. **Medium**: `sequence()` chaining and context handling
3. **Low**: Advanced rewriting and serialization utilities