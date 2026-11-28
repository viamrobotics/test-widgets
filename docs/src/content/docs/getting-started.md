---
title: Getting started
description: Install the widgets and pick an entry point.
---

Install the package with your package manager.

```sh
pnpm add @viamrobotics/test-widgets
```

## Peer dependencies

The package needs these peer dependencies installed in your app:

- `@sentry/svelte`
- `@threlte/core`
- `@threlte/extras`
- `@tanstack/svelte-query`
- `@viamrobotics/prime-controls`
- `@viamrobotics/prime-editor`
- `@viamrobotics/prime-ui`
- `@viamrobotics/tailwind-config`
- `@viamrobotics/sdk`
- `@viamrobotics/svelte-sdk`
- `@viamrobotics/visualization`
- `lodash-es`
- `maplibre-gl`
- `runed`
- `svelte`
- `three`
- `threlte-uikit`

`maplibre-gl` is the heaviest peer. The map API on the root comes from `@viamrobotics/prime-map`, a dependency of this package that takes `maplibre-gl` as its own peer. It reaches your bundle through the `MovementSensor.PositionMap` widget and the map exports such as `MapLibre`. The `/widgets` entry imports every widget, so it always pulls `maplibre-gl` in.

## Entry points

Use the root entry when you know which widgets you need. Each resource is a namespace, and each widget is a member of it. Mount one `WidgetsProvider` per page. A widget that shares state with its resource's other widgets, such as any widget in a conflict group, throws when rendered without one.

```svelte
<script lang="ts">
	import { Arm, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
</script>

<WidgetsProvider>
	<Arm.Jog
		{partID}
		resourceName="arm-1"
	/>
</WidgetsProvider>
```

Use `@viamrobotics/test-widgets/widgets` when you resolve widgets at runtime from a resource. `resourceWidgets` is the catalog, and `widgetsForResource` returns one resource's entry.

```ts
import { resourceWidgets, widgetsForResource } from '@viamrobotics/test-widgets/widgets'
```

The catalog references every widget, so importing it pulls all widgets into your build. That is why it is a separate entry and not part of the root.

## Keys and kinds

Each widget in an entry has a `component`, a `kind`, and a `size`. Its key is its namespace member in camelCase, such as `moveToJointPositions` for `Arm.MoveToJointPositions`. A key is safe to persist as a widget id. If you persisted the old kebab slugs, convert each one once, for example `move-to-joint-positions` to `moveToJointPositions`.

`kind` is `api` for a widget that renders one RDK method, and `control` for one bound to no one method, such as `Base.QuickMove`.

## Sizes

Each entry's `size` is a `WidgetSize`. Its width has a `min` and a `max`, each a class named for Tailwind's container sizes: `xs` (320 px), `2xl` (672 px), and `4xl` (896 px). `max` may also be `fill`, which takes any width. Its height is a band: `sm` (up to 120 px), `md` (240), `lg` (480), or `xl`, which is taller and scrolls inside its box. `WIDTH_CLASS_PX` and `HEIGHT_BAND_PX` are root exports.

## Layouts

To lay out several widgets for one resource, such as a test card or a control interface, follow its recipe. The recipes are in the sidebar under Recipes.
