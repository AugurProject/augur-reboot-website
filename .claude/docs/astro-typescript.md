# Astro TypeScript Knowledge Extract

## Executive Summary
Key insights: Astro's TypeScript plugin for cross-file imports, built-in utility types for HTML attributes, polymorphic components, and advanced type inference for dynamic routes.

## Novel Concepts

### Astro TypeScript Plugin for Cross-File Imports
```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [{ "name": "@astrojs/ts-plugin" }]
  }
}
```
```ts
// Import .astro files in .ts files
import MyComponent from './Component.astro';
```

### Built-in HTML Attribute Types
```astro
---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"a"> {
  myProp?: boolean;
}
const { href, ...attrs } = Astro.props;
---
<a href={href} {...attrs}><slot /></a>
```

### Polymorphic Component Pattern
```astro
---
import type { HTMLTag, Polymorphic } from "astro/types";

type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>;
const { as: Tag, ...props } = Astro.props;
---
<Tag {...props} />
```

### Dynamic Route Type Inference
```astro
---
import type { GetStaticPaths, InferGetStaticParamsType } from "astro";

export const getStaticPaths = (() => {
  return [{ params: { id: "1" }, props: { title: "Post" } }];
}) satisfies GetStaticPaths;

type Params = InferGetStaticParamsType<typeof getStaticPaths>;
const { id } = Astro.params as Params; // fully typed
---
```

## Updated Practices

### Explicit Type Imports
```ts
// Enforce with verbatimModuleSyntax: true
import type { SomeType } from "./script";
```

### Component Props Interface Pattern
```astro
---
interface Props {
  name: string;
  greeting?: string;
}
const { greeting = "Hello", name } = Astro.props;
---
```

### Global Type Extensions
```ts
// src/env.d.ts
declare namespace astroHTML.JSX {
  interface HTMLAttributes {
    "data-count"?: number;
  }
}
```

## Implementation Notes
- Use `ComponentProps<typeof Component>` to reference another component's prop types
- Set `verbatimModuleSyntax: true` to enforce type-only imports
- Extend `astroHTML.JSX` namespace for custom HTML attributes
- Use `/// <reference types="astro/astro-jsx" />` in TS files for JSX types

## Learning Priority
1. HTMLAttributes type for component props (immediate productivity)
2. ComponentProps utility for component composition
3. Polymorphic components for flexible APIs
4. Dynamic route type inference for type-safe routing