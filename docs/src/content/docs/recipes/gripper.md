---
title: Gripper
description: Compose the gripper widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Gripper` widgets on one page: a test card that exercises each API method, and a control interface for opening and closing the gripper by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one gripper find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every widget that moves the gripper shares one conflict group: `OpenGrab`, `Open`, `Grab`, and `GoToInputs`. While one call is in flight the others are disabled and a press is dropped, never queued. `Stop` joins no group and always sends.

Each recipe follows the same three-layer order:

1. A glance row with the gripper's state and `Stop`, the one action that always works. The test card shows the state as `IsMoving` and `IsHoldingSomething`, and the control interface as one `Status` pill.
2. The mutators, the widgets that move the gripper.
3. The queries, the widgets that only read.

`GoToInputs` and `GetCurrentInputs` need a gripper that reports inputs.

## Test card

Each section is headed by the API method it calls. Paired widgets sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { Gripper, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'gripper-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2 p-2"
		>
			<Gripper.IsMoving
				{partID}
				{resourceName}
			/>
			<Gripper.IsHoldingSomething
				{partID}
				{resourceName}
			/>
			<Gripper.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Gripper.OpenGrab
				{partID}
				{resourceName}
			/>
			<Gripper.GoToInputs
				{partID}
				{resourceName}
			/>
		</div>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Gripper.Open
				{partID}
				{resourceName}
			/>
			<Gripper.Grab
				{partID}
				{resourceName}
			/>
		</div>

		<Gripper.GetCurrentInputs
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`Status` reads IsMoving and IsHoldingSomething as one pill. `OpenGrab` holds Open and Grab in one section. It shares the motion group, so a press in it disables `GoToInputs`, `Open`, and `Grab`.

```svelte
<script lang="ts">
	import { Gripper, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'gripper-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2"
		>
			<Gripper.Status
				{partID}
				{resourceName}
			/>
			<Gripper.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<Gripper.OpenGrab
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
