---
title: Gantry
description: Compose the gantry widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Gantry` widgets on one page: a test card that exercises each API method, and a control interface for moving the gantry by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one gantry find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every widget that commands the gantry's motion shares one conflict group: `Home`, `QuickMove`, and `MoveToPosition`. Every move carries every axis, so two moves contradict, and Home moves them all. While one call is in flight the others are disabled and a press is dropped, never queued. `Stop` joins no group and always sends. It also ends a `QuickMove` hold in progress, so no further step goes out. While `Home` is in flight, `QuickMove`'s status line and `HomingStatus` read its progress.

Each recipe follows the same three-layer order:

1. A glance row with `IsMoving` and `Stop`, the gantry's state and the one action that always works.
2. The mutators, the widgets that move the gantry.
3. The queries, the widgets that only read.

`QuickMove` takes `axisNames`, from a multi-axis gantry's `subaxes_list` config key, and `defaultSpeedsMmPerSec`, from each single-axis `gantry_mm_per_sec` config key.

## Test card

Each section is headed by the API method it calls. From a 672 px container, `QuickMove` and `Home` stack on the left, and `MoveToPosition`, the taller, takes the right.

```svelte
<script lang="ts">
	import { Gantry, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'gantry-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2 p-2"
		>
			<Gantry.IsMoving
				{partID}
				{resourceName}
			/>
			<Gantry.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<div
			role="group"
			aria-label="Mutators"
			class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
		>
			<div class="flex min-w-0 flex-col divide-y">
				<Gantry.QuickMove
					{partID}
					{resourceName}
				/>
				<Gantry.Home
					{partID}
					{resourceName}
				/>
				<Gantry.HomingStatus
					{partID}
					{resourceName}
				/>
			</div>
			<Gantry.MoveToPosition
				{partID}
				{resourceName}
			/>
		</div>

		<div
			role="group"
			aria-label="Queries"
			class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
		>
			<Gantry.GetPosition
				{partID}
				{resourceName}
			/>
			<Gantry.GetLengths
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

`QuickMove` steps one axis at a time while a jog button is held, and `Home` sends the gantry to its origin. They share the motion group, so a step in one disables the other. `HomingStatus` reads Home's progress.

```svelte
<script lang="ts">
	import { Gantry, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'gantry-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2"
		>
			<Gantry.IsMoving
				{partID}
				{resourceName}
			/>
			<Gantry.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<Gantry.QuickMove
			{partID}
			{resourceName}
		/>
		<Gantry.Home
			{partID}
			{resourceName}
		/>
		<Gantry.HomingStatus
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
