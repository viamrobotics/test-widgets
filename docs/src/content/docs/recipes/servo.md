---
title: Servo
description: Compose the servo widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Servo` widgets on one page: a test card that exercises each API method, and a control interface for moving the servo by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one servo find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every widget that moves the servo shares one conflict group: `Move`, `QuickMove`, and `MoveTo`. While one call is in flight the others are disabled and a press is dropped, never queued. `Stop` joins no group and always sends.

Each recipe follows the same three-layer order:

1. A glance row with `IsMoving` and `Stop`, the servo's state and the one action that always works.
2. The mutators, the widgets that move the servo.
3. The queries, the widgets that only read.

`QuickMove` and `MoveTo` take optional `minDegrees` and `maxDegrees`, from the servo config's `min_angle_deg` and `max_angle_deg`. A configured `maxDegrees` removes `MoveTo`'s Max field. Without one, the Max the user sets in `MoveTo` also caps the steps of `QuickMove`.

## Test card

Each section is headed by the API method it calls. Paired widgets sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { Servo, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'servo-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2 p-2"
		>
			<Servo.IsMoving
				{partID}
				{resourceName}
			/>
			<Servo.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Servo.Move
				{partID}
				{resourceName}
			/>
			<Servo.QuickMove
				{partID}
				{resourceName}
			/>
		</div>
		<Servo.MoveTo
			{partID}
			{resourceName}
		/>

		<Servo.GetPosition
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`QuickMove` steps the servo by a chosen angle, and `MoveTo` drags a slider or returns to the minimum. They share the motion group, so a move in one disables the other.

```svelte
<script lang="ts">
	import { Servo, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'servo-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2"
		>
			<Servo.IsMoving
				{partID}
				{resourceName}
			/>
			<Servo.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<Servo.QuickMove
			{partID}
			{resourceName}
		/>
		<Servo.MoveTo
			{partID}
			{resourceName}
		/>

		<Servo.GetPosition
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
