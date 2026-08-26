---
paths:
  - 'src/**/*.svelte'
  - 'src/**/*.svelte.ts'
---

# Threlte in This Repo

Assumes the kit's `three-threlte.md` and `three.md`. This records only how this repo uses Threlte.

- **Every 3D widget mounts its own `<Canvas>`**, and a page can show many widgets at once. Keep scenes cheap: no per-frame work unless a frame actually changes, dispose what you create, and share helpers from `src/lib/components/three/`.
- **Rendering is on demand.** After mutating a scene object, call `invalidate()` from `useThrelte()`, usually inside `$effect.pre` so the draw follows the state change in the same flush (`src/lib/components/widgets/pcd/points.svelte`, `src/lib/components/widgets/vision-service/object-point-cloud-scene.svelte`).
- **`<Canvas autoRender={false}>`** where the scene schedules its own renders (`src/lib/components/widgets/navigation/obstacles/obstacles.svelte`, `src/lib/components/navigation-map/components/scene-layer.svelte`).
- **`renderMode="always"` only for live video.** `src/lib/components/widgets/camera/camera.svelte` needs it so the `VideoTexture` advances every frame. Nothing else should opt in.
- **`useTask` is currently unused.** If you add one, its callback must not throw. An uncaught error in a per-frame task stops that canvas's render loop for good, and there is no recovery short of remounting.
- Threlte also lives in plain `.ts` under `src/lib/components/navigation-map/plugins/` and `src/lib/components/slam/map2d/hooks/`. The `three-threlte.md` frontmatter includes those paths so the rule loads there too.
