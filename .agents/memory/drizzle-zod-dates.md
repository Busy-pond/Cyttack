---
name: Drizzle Date serialization for Zod
description: Drizzle ORM returns Date objects for timestamp columns; Zod z.string() rejects them at parse time.
---

## Rule
Before passing a Drizzle row to `ZodSchema.parse()`, serialize any `Date` fields to ISO strings.

**Why:** Drizzle's `timestamp()` columns return native JS `Date` objects. Zod v4 `z.string()` validates strictly — it rejects `Date` objects with `invalid_type` error. Express's `res.json()` would serialize them correctly, but Zod runs first.

**How to apply:** Add a helper like:
```ts
function serializeAlert(row: Record<string, unknown>) {
  return {
    ...row,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
  };
}
// Usage:
res.json(MyZodSchema.parse(serializeAlert(row as Record<string, unknown>)));
```
This applies to any route that calls `.parse()` on a raw Drizzle result containing timestamp columns.
