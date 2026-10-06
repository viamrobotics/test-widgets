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
- `@viamrobotics/prime-core`
- `@viamrobotics/sdk`
- `@viamrobotics/svelte-sdk`
- `lodash-es`
- `maplibre-gl`
- `runed`
- `svelte`
- `three`
- `threlte-uikit`

`maplibre-gl` is the heaviest peer. It reaches your bundle only if you import something that renders a map.

## Entry points

Use the root entry when you know which widgets you need.

```ts
import { ArmWidget, CameraWidget } from '@viamrobotics/test-widgets'
```

Use `@viamrobotics/test-widgets/registry` when you resolve widgets at runtime from a resource.

```ts
import { apiWidgetsForResource, widgetForResource } from '@viamrobotics/test-widgets/registry'
```

The registry references every widget, so importing it pulls all widgets into your build.
