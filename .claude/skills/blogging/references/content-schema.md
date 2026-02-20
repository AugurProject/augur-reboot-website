# Content Collection Schema

Defined in `src/content/config.ts`.

## Blog Collection

```typescript
const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    publishDate: z.date(),
    updatedDate: z.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
})
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Used in post card, page title, RSS item |
| `description` | string | Yes | Used in post card, meta description, RSS |
| `author` | string | Yes | Typically "Lituus Foundation" |
| `publishDate` | date | Yes | Format: `YYYY-MM-DD` in frontmatter |
| `updatedDate` | date | No | Format: `YYYY-MM-DD` in frontmatter |
| `tags` | string[] | No | Used for categorization, e.g. `["augur", "roadmap"]` |

Dates in YAML frontmatter are written without quotes: `publishDate: 2026-02-21`

## Learn Collection

```typescript
const learnCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
})
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | Used in learn navigation |
| `description` | string | No | Optional summary |

## Collection Registration

Both collections are exported from `src/content/config.ts`:

```typescript
export const collections = {
  learn: learnCollection,
  blog: blogCollection,
}
```

Adding a new collection requires:
1. Defining it with `defineCollection()` in `config.ts`
2. Adding it to the `collections` export
3. Creating the directory under `src/content/{collection-name}/`

## Querying Collections

In Astro pages and layouts:

```astro
---
import { getCollection, getEntry } from 'astro:content'

// Get all blog posts, sorted by date
const posts = (await getCollection('blog'))
  .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())

// Get a single post by slug
const post = await getEntry('blog', 'augur-reboot-2025')
const { Content } = await post.render()
---

<Content />
```
