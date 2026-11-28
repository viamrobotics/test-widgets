---
title: Motor
description: Compose the motor widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Motor` widgets on one page: a test card that exercises each API method, and a control interface for moving the motor by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one motor find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every widget that commands the motor's motion shares one conflict group: `QuickMove`, `Move`, `SetPower`, `SetRpm`, `GoFor`, `GoTo`, and `ResetZeroPosition`. While one call is in flight the others are disabled and a press is dropped, never queued. `Stop` joins no group and always sends.

Each recipe follows the same three-layer order:

1. A glance row with `IsMoving` and `Stop`, the motor's state and the one action that always works.
2. The mutators, the widgets that move the motor.
3. The queries, the widgets that only read.

`SetRpm`, `GoFor`, `GoTo`, `ResetZeroPosition`, `Move`, and `GetPosition` need a motor that reports its position. `QuickMove` and `Move` take an optional `maxRpm`, from the gpio motor config's `max_rpm`, and `QuickMove` takes `minPowerPct` and `maxPowerPct`.

## Test card

Each section is headed by the API method it calls. Paired widgets sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { Motor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'motor-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2 p-2"
		>
			<Motor.IsMoving
				{partID}
				{resourceName}
			/>
			<Motor.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<Motor.QuickMove
			{partID}
			{resourceName}
		/>
		<Motor.SetPower
			{partID}
			{resourceName}
		/>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Motor.SetRpm
				{partID}
				{resourceName}
			/>
			<Motor.GoFor
				{partID}
				{resourceName}
			/>
		</div>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Motor.GoTo
				{partID}
				{resourceName}
			/>
			<Motor.ResetZeroPosition
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Motor.IsPowered
				{partID}
				{resourceName}
			/>
			<Motor.GetPosition
				{partID}
				{resourceName}
			/>
		</div>
		<Motor.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`QuickMove` holds the motor at a speed or power while a button is pressed, and `Move` runs it for a distance or to a position. They share the motion group, so a move in one disables the other.

```svelte
<script lang="ts">
	import { Motor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'motor-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2"
		>
			<Motor.IsMoving
				{partID}
				{resourceName}
			/>
			<Motor.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid min-w-0 grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:items-start @2xl:gap-x-4">
			<Motor.QuickMove
				{partID}
				{resourceName}
			/>
			<Motor.Move
				{partID}
				{resourceName}
			/>
		</div>

		<Motor.IsPowered
			{partID}
			{resourceName}
		/>
		<Motor.GetPosition
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
