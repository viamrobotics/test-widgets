---
title: Input controller
description: Compose the input controller widgets into a test card or a control interface.
---

This page shows two ways to lay out the `InputController` widgets on one page: a test card that exercises each API method, and a control interface for forwarding a browser gamepad.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one input controller find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. `TriggerEvent` and `WebGamepad` both send `TriggerEvent` calls, but events for separate controls do not contradict each other, so they share no conflict group. Each sends on every press or gamepad change, and `GetEvents` stays live.

`WebGamepad` works on an input controller named `webgamepad`. It forwards a connected browser gamepad as `TriggerEvent` calls once its Forward gamepad button is on, shows a Connected badge, and sends neutral events when the window loses focus.

Each recipe follows the same three-layer order:

1. A glance row. The input controller has no state worth a row of its own, so the recipes skip it.
2. The mutators, `TriggerEvent`, and `WebGamepad` in the control interface.
3. The queries, here `GetEvents`.

`GetEvents` polls once a second, and draws its own Pause and refresh rate controls.

## Test card

Each section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { InputController, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'input-controller-1'
</script>

<WidgetsProvider>
	<div class="@container mx-auto flex max-w-4xl flex-col divide-y">
		<InputController.TriggerEvent
			{partID}
			{resourceName}
		/>
		<InputController.GetEvents
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`WebGamepad` and `TriggerEvent` sit side by side from a 672 px container, with `GetEvents` below to show what the controller reports.

```svelte
<script lang="ts">
	import { InputController, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'webgamepad'
</script>

<WidgetsProvider>
	<div class="@container mx-auto flex max-w-4xl flex-col divide-y">
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0">
			<InputController.WebGamepad
				{partID}
				{resourceName}
			/>
			<InputController.TriggerEvent
				{partID}
				{resourceName}
			/>
		</div>
		<InputController.GetEvents
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
