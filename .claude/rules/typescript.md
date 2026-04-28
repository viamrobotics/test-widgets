---
paths:
  - '**/*.ts'
---

# TypeScript Best Practices

Use TypeScript with `strict: true`. See the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/).

## Type Definitions

Prefer `interface` for object shapes (extendable), `type` for unions and computed types:

```typescript
interface Pose {
	x: number
	y: number
	z: number
}

type GeometryKind = 'box' | 'sphere' | 'capsule'
```

## NEVER Use `any` — Use `unknown`

**NEVER** use `any` for untyped external data. Use `unknown` and narrow with type guards:

```typescript
// BAD
const data: any = JSON.parse(raw)

// GOOD
const data: unknown = JSON.parse(raw)
if (isPose(data)) {
	console.log(data.x) // safely typed
}
```

## Assertion Functions & Type Guards

```typescript
// Assert value exists (narrows to NonNullable<T>)
export const assertExists = <T>(value: T, message: string): asserts value is NonNullable<T> => {
	if (value == null) throw new Error(message)
}
```

## Utility Functions

Write pure functions with JSDoc `@param`, `@returns`, and `@example` for non-obvious utilities:

```typescript
/**
 * Safely parses a string as an integer.
 * @param value - String to parse
 * @returns Parsed integer or undefined if invalid
 * @example safeParseInt('42') // 42
 */
export const safeParseInt = (value: string): number | undefined => {
	const parsed = Number.parseInt(value, 10)
	return Number.isNaN(parsed) ? undefined : parsed
}
```

## Verify Your Work

```
pnpm check    # svelte-check + go vet
pnpm test     # vitest unit tests
```
