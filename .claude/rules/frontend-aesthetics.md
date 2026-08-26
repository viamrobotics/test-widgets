---
paths:
  - '**/*.svelte'
  - '**/*.css'
---

# Frontend Aesthetics

Every widget change should look intentional and match the rest of the Viam product. The failure mode to avoid is "AI slop": hardcoded hex instead of tokens, inconsistent spacing and density, re-inventing components PRIME already ships, missing interaction states, and weak hierarchy. Do not add new fonts, color schemes, gradients, or "creative" layouts.

**Source of truth: https://design.viam.com**, implemented as `@viamrobotics/tailwind-config` (tokens and utilities) and `@viamrobotics/prime-core` (components). `viam-context.md` covers how and when to fetch design.viam.com. Generic token, scale, and contrast mechanics live in the kit's `design.md`, and `node .claude/scripts/design.mjs` answers value questions from this repo's Tailwind theme. Svelte conventions live in `svelte.md` and accessibility in `accessibility-svelte.md`. Do not duplicate them here.

## Components first

Prefer PRIME components over native or hand-rolled ones: `Button`, `IconButton`, `Icon`, `Tooltip`, `Input`, `Select`, `Switch`, `Label`, `Badge`, `Pill`, `Tabs`, `Modal`, toasts. Before building a control, check design.viam.com. If PRIME has it, use it and extend PRIME rather than replacing it.

- Numeric control panels (sliders, ranges) use `svelte-tweakpane-ui`, as the arm joint slider does. Do not restyle tweakpane ad hoc.
- Icons: prime-core `Icon` with a typed `IconName`. Decorative icons get `aria-hidden="true"`.

## Color and tokens

Use the semantic Tailwind tokens from `@viamrobotics/tailwind-config`, imported once in `src/app.css`. Never hardcode hex for UI chrome.

- Text: `text-heading`, `text-default`, `text-subtle-1`, `text-subtle-2`, `text-disabled`, `text-link`.
- Surfaces: `bg-extralight`, `bg-light`, `bg-medium`, `bg-dark`. Hover fills `ghost-light` and `ghost-medium`.
- Borders: `border-light`, `border-medium`, `border-dark`.
- Status: `danger`, `warning`, `success`, `info`, each with `-dark`, `-medium`, `-light`. Use for meaning, not decoration.

Legitimate hex: WebGL and canvas drawing (shaders, Three.js materials, `<canvas>` fills, MapLibre layers) cannot use Tailwind tokens. Do not flag those.

`src/app.css` also carries a Tailwind v3 border-color compatibility block (`@layer base` setting `border-color: var(--color-gray-200, currentcolor)`). It stays until every element sets an explicit border color. Do not "clean it up".

## Typography

Fonts are loaded by the demo app only: `src/routes/+layout.svelte` imports `@viamrobotics/tailwind-config/fonts`. Library consumers supply their own, so a component must not assume a family is loaded. Apply the role classes and let the host decide: `font-space-grotesk` for display, `font-public-sans` for body and UI, `font-roboto-mono` for numeric and data (poses, readings, IDs). Build hierarchy with weight, size, and color tokens, not invented type scales.

## Spacing, layout, density

Use Tailwind's spacing scale consistently. Match the density of neighboring widgets. This is a dense tooling UI, not a marketing page. Reuse the existing layout idioms in `src/lib/components/` (`section-group`, `section-title`, `api-section`, `mutation-section`, `readings-list`) rather than inventing a new layout per widget.

## Component states and interaction

A control is not done until every state is handled. Missing states is the most common slop tell.

- hover, focus-visible, active, and disabled on every interactive element.
- loading and empty states for any async or list view (a placeholder, not a blank box). The `query.svelte` and `queries.svelte` wrappers already handle the async branches. Use them instead of hand-rolling `{#if}` chains.
- Prefer `aria-disabled` over `disabled` when the element must stay focusable.
- Lean on PRIME components for correct states instead of re-deriving them.

## Motion

Restrained and purposeful. CSS-only transitions on hover, focus, and expand. Respect `prefers-reduced-motion`.

## Self-check before finishing any UI change

- [ ] Used a PRIME component where one exists.
- [ ] Semantic tokens only. No hardcoded hex for chrome.
- [ ] Correct font role class. No assumption that a font is loaded.
- [ ] Spacing and density consistent with neighboring widgets.
- [ ] hover, focus-visible, active, and disabled handled. loading and empty for async views.
- [ ] Matches design.viam.com and looks intentional, not generic.
