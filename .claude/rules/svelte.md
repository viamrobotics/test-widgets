---
paths:
  - '**/*.svelte'
  - '**/*.svelte.ts'
  - '**/*.svelte.js'
---

# Svelte 5 Best Practices

We use Svelte 5 with runes. See the [Svelte 5 Documentation](https://svelte.dev/docs/svelte) and [Runes Guide](https://svelte.dev/docs/svelte/what-are-runes).

## Component Structure

```svelte
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements'

	interface Props extends HTMLButtonAttributes {
		/** Visual variant */
		variant?: 'primary' | 'secondary' | 'danger'
	}

	let { variant = 'primary', disabled = false, children, ...restProps }: Props = $props()
	const classes = $derived(['btn', `btn-${variant}`, disabled && 'btn-disabled'])
</script>

<button
	{...restProps}
	aria-disabled={disabled || undefined}
	class={classes}
>
	{@render children?.()}
</button>
```

**Key patterns:** typed `Props` interface extending HTML attributes; `$props()` with defaults and rest spread; `$derived` for computed values; `{@render children?.()}` for slot-like composition.

## Runes Quick Reference

| Old Syntax              | Svelte 5                | Purpose                   |
| ----------------------- | ----------------------- | ------------------------- |
| `export let prop`       | `$props()`              | Component props           |
| `$: derived = x + y`    | `$derived(x + y)`       | Computed values           |
| `$: { complex }`        | `$derived.by(() => {})` | Complex computations      |
| `let count = 0`         | `$state(0)`             | Deeply reactive state     |
| (no equivalent)         | `$state.raw(value)`     | Non-deeply reactive state |
| `export let` (bindable) | `$bindable()`           | Two-way binding           |
| `onMount`               | `$effect(() => {})`     | Side effects / lifecycle  |

Use `$state.raw` for values where you don't need deep reactivity (large arrays replaced wholesale, class instances). Use `untrack(() => value)` to read reactive state without registering a dependency.

## Snippets — Svelte 5 Replacement for Slots

**ALWAYS** use snippets instead of `<slot>` in Svelte 5:

```svelte
<!-- Parent: define a typed snippet prop -->
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		header: Snippet
		children: Snippet<[{ item: string }]>
	}
	let { header, children }: Props = $props()
</script>

{@render header()}
{#each items as item}
	{@render children({ item })}
{/each}
```

```svelte
<!-- Consumer: pass snippets inline -->
<MyList>
	{#snippet header()}
		<h2>My List</h2>
	{/snippet}
	{#snippet children({ item })}
		<li>{item}</li>
	{/snippet}
</MyList>
```

## `$derived` vs `$effect` — The Critical Distinction

**`$derived`** — pure computation only, no side effects:

```typescript
const fullName = $derived(`${firstName} ${lastName}`)
const sorted = $derived.by(() => [...items].sort((a, b) => a.name.localeCompare(b.name)))
```

**`$effect`** — side effects only (DOM mutations, subscriptions, analytics):

```typescript
$effect(() => {
	document.title = `${count} items`
	return () => cleanup()
})
```

**NEVER** use `$effect` to derive state:

```typescript
// BAD
let doubled = $state(0)
$effect(() => {
	doubled = count * 2
}) // creates a loop, hard to reason about

// GOOD
const doubled = $derived(count * 2)
```

## State Management with Koota ECS

This project uses [Koota](https://github.com/pmndrs/koota) (Entity Component System) for shared state — not stores or TanStack Query.

- **Traits** are defined in `src/lib/ecs/traits.ts`. Marker traits return `() => true`; data traits return a default value factory.
- **World** is injected via Svelte context: call `provideWorld()` at the root, `useWorld()` to consume.
- **Reactive queries** subscribe to all entities with a given set of traits via `useQuery` from `$lib/ecs`:
  ```typescript
  import { traits, useQuery } from '$lib/ecs'
  const meshEntities = useQuery(traits.Mesh)
  ```
- **Trait access** on a specific entity via `useTrait` from `$lib/ecs`:
  ```typescript
  import { traits, useTrait } from '$lib/ecs'
  const pose = useTrait(entity, traits.Pose)
  ```
- **Relations** (`ChildOf`, `SubEntityLink`) are in `src/lib/ecs/relations.ts`.

Default to local component state (`$state`, `$derived`) for UI-only values. Use Koota ECS for shared scene/entity data. Use Svelte context (below) for shared service/config objects.

## Context Providers

Use `.svelte.ts` files with `getContext`/`setContext` for reactive shared state. **ALWAYS** use `Symbol` keys.

```typescript
// theme-context.svelte.ts
import { getContext, setContext } from 'svelte'

const key = Symbol('theme')

interface ThemeContext {
	readonly current: 'light' | 'dark'
	toggle: () => void
}

export const provideTheme = () => {
	let theme = $state<'light' | 'dark'>('light')
	const context: ThemeContext = {
		get current() {
			return theme
		},
		toggle: () => {
			theme = theme === 'light' ? 'dark' : 'light'
		},
	}
	setContext(key, context)
	return context
}

export const useTheme = (): ThemeContext => getContext(key)
```

**Key conventions:**

- `.svelte.ts` extension for files using runes outside `.svelte` components
- `Symbol()` for context keys — prevents accidental collisions
- Return objects with **getters**, not plain properties, to preserve reactivity
- Naming: `provide*` to inject into context, `use*` to consume

## 3D Rendering with Threlte

This project renders a 3D scene using [Threlte](https://threlte.xyz/) (Svelte bindings for Three.js).

- All 3D components must live inside a Threlte `<Canvas>` context.
- Use `@threlte/core` for scene, camera, and renderer access.
- Use `@threlte/extras` for common utilities, `@threlte/rapier` for physics, `@threlte/xr` for VR/AR.
- Custom Three.js extensions (e.g. `InstancedArrows`) live in `src/lib/three/`.

## Accessibility

- Use semantic elements and correct ARIA roles; label all interactive elements.
- Hide decorative icons with `aria-hidden="true"`.
- Use `aria-disabled` instead of `disabled` when the element must remain focusable.

## Styling

Use array/object syntax for conditional classes:

```svelte
<button class={[
  'inline-flex items-center font-medium rounded',
  { 'bg-blue-600': variant === 'primary', 'bg-red-600': variant === 'danger' },
  disabled && 'opacity-50 cursor-not-allowed',
]}>
```

## Svelte MCP Server

Use the Svelte MCP server for authoritative Svelte 5 / SvelteKit docs and validation. Delegate to the `svelte-file-editor` agent when creating or editing `.svelte`, `.svelte.ts`, or `.svelte.js` files — it handles MCP calls efficiently.

- `list-sections` — call FIRST on any Svelte/SvelteKit question to discover relevant docs (returns titles, use_cases, paths).
- `get-documentation` — fetch every section whose `use_cases` matches the task. Batch multiple sections in one call.
- `svelte-autofixer` — run on any Svelte code you write before handing it to the user. Keep iterating until it returns no issues or suggestions.
- `playground-link` — only offer after code is complete AND the user confirms. NEVER call it for code written to files in the project.

## Verify Your Work

```
pnpm check    # svelte-check + go vet
pnpm lint     # prettier + eslint + golangci-lint
```
