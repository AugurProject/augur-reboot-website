# Astro Server Islands Knowledge Extract

## Executive Summary
Server islands enable on-demand rendering of dynamic components while maintaining static HTML performance. Key pattern: use `server:defer` directive with fallback content for progressive loading.

## Novel Concepts

### server:defer Implementation
```astro
// Basic server island
<Avatar server:defer />

// With fallback content
<Avatar server:defer>
  <GenericAvatar slot="fallback" />
</Avatar>
```

### Dynamic Component Pattern
```astro
// src/components/Avatar.astro
---
import { getUserAvatar } from '../sessions';
const userSession = Astro.cookies.get('session');
const avatarURL = await getUserAvatar(userSession);
---
<img alt="User avatar" src={avatarURL} />
```

### URL Access in Islands
```astro
---
const referer = Astro.request.headers.get('Referer');
const url = new URL(referer);
const productId = url.searchParams.get('product');
---
```

## Updated Practices

### Prop Serialization Constraints
- Supported: `number`, `string`, `Array`, `Map`, `Set`, `RegExp`, `Date`, `BigInt`, `URL`, typed arrays
- Unsupported: functions, circular references
- Keep props minimal to avoid POST requests (>2048 bytes)

### Performance Optimization
- Islands load independently, preventing cascade delays
- Fallback content renders immediately with page
- GET requests enable standard HTTP caching
- Build-time component splitting into special routes

## Implementation Notes

### Caching Strategy
- GET requests: cacheable with `Cache-Control` headers
- POST requests: non-cacheable, triggered by large prop payloads
- Minimize prop size to maintain GET request pattern

### Key Management
```bash
# Generate reusable encryption key
astro create-key
# Set as ASTRO_KEY environment variable
```

## Learning Priority

1. **High**: `server:defer` directive usage and fallback patterns
2. **High**: Prop serialization limitations and optimization
3. **Medium**: URL access patterns via Referer header
4. **Low**: Encryption key management for advanced deployments

## What Makes This New
- Progressive loading pattern distinct from standard SSR
- Build-time component splitting mechanism
- Encrypted prop passing system
- Independent island loading preventing cascade failures