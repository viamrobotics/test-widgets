---
paths:
  - 'src/**/*.spec.ts'
  # The single browser-mode project documented below is configured here.
  - 'vite.config.ts'
---

# Frontend Testing: Repo Specifics

Generic testing practice (whether a test is worth writing, placement, structure, naming, what to mock in principle) lives in the kit rules `testing.md`, `testing-typescript.md`, `testing-svelte.md`, and `testing-3d.md`. This rule records only what is particular to this repo.

## One browser-mode project, deliberately

`vite.config.ts` defines a single Vitest project, `client`, that runs every `src/**/*.spec.ts` in headless Chromium through `@vitest/browser-playwright`. There is no jsdom and no client/ssr/server split. This deviates from the three-project recommendation in `testing-svelte.md` on purpose, so do not "fix" it. `ResizeObserver`, `canvas`, WebGL, and the rest of the DOM API are available in any spec with no opt-in.

A cold run can fail while Vite optimizes dependencies. Re-run once before investigating.

## Suffixes carry no runtime meaning

`*.spec.ts` and `*.svelte.spec.ts` both run in the browser. Use `.svelte.spec.ts` when the subject is a `.svelte` component or a `.svelte.ts` rune module, and plain `.spec.ts` otherwise. There are no `*.test.ts` files. Do not introduce that suffix.

## Config already handles teardown

`vite.config.ts` sets `mockReset`, `restoreMocks`, and `unstubGlobals`, so `vi.clearAllMocks()` in a `beforeEach` is redundant. `expect.requireAssertions` is on, so a test with no assertion fails. DOM cleanup between tests comes from the `svelteTesting()` plugin. jest-dom matchers such as `toBeInTheDocument` come from `@vitest/browser`, not from a setup file. `src/vitest.setup.ts` is referenced by no config and does nothing.

## What to mock here

Where a spec needs SDK data, mock the SDK boundary rather than the widget: `vi.mock('@viamrobotics/svelte-sdk')` or `vi.mock('@viamrobotics/sdk')`, then `vi.mocked(createResourceQuery).mockReturnValue(...)` per test. Threlte scenes are tested with `render` and `cleanup` from `@threlte/test`, asserting on the returned `scene` and `camera` rather than on pixels (see `src/lib/components/widgets/pcd/__tests__/scene.spec.ts`).

The `fix-prime-core-theme` plugin in `vite.config.ts` rewrites Tailwind v3 `theme(...)` calls inside prime-core CSS so it compiles under Tailwind v4. A prime-core style error in a spec usually traces there.

## Layout

Specs colocate under `__tests__/` beside the subject. Shared host components go in `__tests__/__fixtures__/`, for example `with-host-scene.svelte`, which mounts a `<Canvas>` around the component under test. The `__screenshots__/` directories are leftovers from removed screenshot assertions, not a convention. Do not add new ones.

## Playwright

`playwright.config.ts` matches `**/*.e2e.{ts,js}` and no such file exists. E2E is configured but unused. Do not add an e2e test because a kit rule or the Playwright MCP server suggests one. Browser-mode unit specs cover what e2e would here.

## Reading results

`Tests N passed` alone is not a green run. A spec that fails to import reports zero failures, so read the `Test Files` line too and check the count against what you expected to collect.
