---
paths:
  # Threlte components live under src/lib/components/{widgets,navigation-map,slam},
  # not only under a three/ directory, so this loads for all of src/. Two plugin
  # and hook directories hold Threlte code in plain .ts and are listed by path.
  - 'src/**/*.svelte'
  - 'src/**/*.svelte.ts'
  - 'src/lib/components/navigation-map/plugins/**'
  - 'src/lib/components/slam/map2d/hooks/**'
---

# Three.js — Threlte

Assumes `three.md`. This is the Svelte binding residue only, not a restatement of the base rule.

## Handing an object to the scene graph

Use `<T>` to declare Three.js objects in a Threlte scene, and `<T is={obj} />` to hand a
pre-built object from the pure layer to the scene graph instead of rebuilding it
declaratively:

```svelte
<T is={obj} />
```

An object the pure layer built stays that object. Threlte places it, it does not recreate it.
Threlte 8 narrowed automatic disposal to objects a `<T>` directly references, so decide
whether the pure layer or Threlte disposes an object handed in this way.

## Frame loop and renderer access

Use `useTask` for a per-frame callback, and `useThrelte` to reach the renderer, camera, or
scene outside a `<T>` block:

```svelte
<script lang="ts">
  import { useTask, useThrelte } from "@threlte/core";

  const { renderer, camera } = useThrelte();

  useTask((delta) => {
    // ...
  });
</script>
```

## Svelte 5 runes only

Never `export let` or `$:`. Use `$props()`, `$state()`, and `$derived()`.
