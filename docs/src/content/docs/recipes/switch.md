---
title: Switch
description: Compose the switch widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Switch` widgets on one page: a test card that exercises each API method, and a control interface for picking a position.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one switch find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every `SetPosition` widget shares one position group, because two picks in flight would contradict each other. While one is in flight the others are disabled and a press is dropped, never queued. `GetPosition` and `GetNumberOfPositions` stay live.

Each recipe follows the same three-layer order:

1. A glance row with `GetPosition`, the switch's current position.
2. The mutators, `SetPosition`, the widget that changes the position.
3. The queries, `GetNumberOfPositions`, the widget that only reads.

## Test card

Each section is headed by the API method it calls. The mutator and the query sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { Switch, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'switch-1'
</script>

<WidgetsProvider>
	<div class="@container mx-auto max-w-2xl">
		<div class="flex flex-col divide-y">
			<div
				role="group"
				aria-label="At a glance"
				class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
			>
				<Switch.GetPosition
					{partID}
					{resourceName}
				/>
			</div>

			<div class="grid min-w-0 grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
				<Switch.SetPosition
					{partID}
					{resourceName}
				/>
				<Switch.GetNumberOfPositions
					{partID}
					{resourceName}
				/>
			</div>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

`SetPosition` shows the picks as a toggle group, or as a select when there are more than a row holds, and reads `Sending <label>.` while a pick is in flight.

```svelte
<script lang="ts">
	import { Switch, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'switch-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<Switch.GetPosition
			{partID}
			{resourceName}
		/>
		<Switch.SetPosition
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
