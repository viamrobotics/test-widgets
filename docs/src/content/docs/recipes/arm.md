---
title: Arm
description: Compose the arm widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Arm` widgets on one page: a test card that exercises each API method, and a control interface for moving the arm by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one arm find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every widget that moves the arm shares one conflict group, so while one move is in flight the others are disabled and a press is dropped, never queued. `ManualMode` and `SetManualMode` share a second group. `Stop` joins no group and always sends. It also ends any hold in progress in `Jog` or `Joints`, wherever they render.

Each recipe follows the same three-layer order:

1. A glance row with `IsMoving` and `Stop`, the arm's state and the one action that always works.
2. The mutators, the widgets that move the arm or change its mode.
3. The queries, the widgets that only read.

## Test card

Each section is headed by the API method it calls. The two move widgets sit side by side from a 672 px container, and so do the two position readouts.

```svelte
<script lang="ts">
	import { Arm, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'arm-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2 p-2"
		>
			<Arm.IsMoving
				{partID}
				{resourceName}
			/>
			<Arm.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<Arm.ManualMode
			{partID}
			{resourceName}
		/>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Arm.MoveToJointPositions
				{partID}
				{resourceName}
			/>
			<Arm.MoveToPosition
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Arm.GetJointPositions
				{partID}
				{resourceName}
			/>
			<Arm.GetEndPosition
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

Jog moves the end effector and Joints moves one joint at a time. They read the same step sizes and share the motion group, so a hold in one disables the other. Joints needs the builtin motion service, and ManualMode renders nothing for an arm without manual mode.

```svelte
<script lang="ts">
	import { Arm, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'arm-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2"
		>
			<Arm.IsMoving
				{partID}
				{resourceName}
			/>
			<Arm.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid min-w-0 grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:items-start @2xl:gap-x-4">
			<Arm.Jog
				{partID}
				{resourceName}
			/>
			<Arm.Joints
				{partID}
				{resourceName}
			/>
			<Arm.ManualMode
				{partID}
				{resourceName}
			/>
		</div>

		<Arm.GetJointPositions
			{partID}
			{resourceName}
		/>
		<Arm.GetEndPosition
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
