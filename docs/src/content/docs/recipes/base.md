---
title: Base
description: Compose the base widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Base` widgets on one page: a test card that exercises each API method, and a control interface for driving the base by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one base find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every widget that commands the base's motion shares one conflict group: `QuickMove`, `MoveStraight`, `Spin`, `SetPower`, and `SetVelocity`. While one call is in flight the others are disabled and a press is dropped, never queued. `Stop` joins no group and always sends. `QuickMove` sends the zero power of a release outside the group too, so letting go of a drive button always stops the base.

Each recipe follows the same three-layer order:

1. A glance row with `IsMoving` and `Stop`, the base's state and the one action that always works.
2. The mutators, the widgets that move the base.
3. The queries, the widgets that only read.

## Test card

Each section is headed by the API method it calls. The mutators sit in a grid that gains a column at 672 px and another at 896 px.

```svelte
<script lang="ts">
	import { Base, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'base-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2 p-2"
		>
			<Base.IsMoving
				{partID}
				{resourceName}
			/>
			<Base.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<div
			role="group"
			aria-label="Mutators"
			class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0 @4xl:grid-cols-3"
		>
			<Base.Spin
				{partID}
				{resourceName}
			/>
			<Base.MoveStraight
				{partID}
				{resourceName}
			/>
			<Base.QuickMove
				{partID}
				{resourceName}
			/>
			<Base.SetPower
				{partID}
				{resourceName}
			/>
			<Base.SetVelocity
				{partID}
				{resourceName}
			/>
		</div>

		<Base.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`QuickMove` drives the base while a button or a captured key is held. Press `Stop` or let go to stop it.

```svelte
<script lang="ts">
	import { Base, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'base-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div
			role="group"
			aria-label="At a glance"
			class="flex flex-wrap items-center justify-between gap-2"
		>
			<Base.IsMoving
				{partID}
				{resourceName}
			/>
			<Base.Stop
				{partID}
				{resourceName}
			/>
		</div>

		<Base.QuickMove
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
