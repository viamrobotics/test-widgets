---
title: SLAM
description: Compose the SLAM widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Slam` widgets on one page: a test card that exercises each API method, and a control interface for watching the map and the robot's place on it.

Both recipes wrap their widgets in one `<WidgetsProvider>`, as every resource's recipe does. `Map` and `MoveOnMap` share the base name, the motion service name, and the destination through it, so a click on the map fills MoveOnMap's end position, and the map draws the plan of the base MoveOnMap names. Every `MoveOnMap` widget shares one conflict group, so a second Execute while a move is in flight is dropped, never queued. Stop is in no group. The queries stay live.

Each recipe follows the same three-layer order:

1. A glance row with `GetPosition`, where the robot is now.
2. The mutators. `MoveOnMap` sends the motion service's MoveOnMap call. The test card has none.
3. The queries, the widgets that only read.

## Test card

Each section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { Slam, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'slam-1'
</script>

<WidgetsProvider>
	<div class="flex flex-col divide-y">
		<Slam.GetPosition
			{partID}
			{resourceName}
		/>
		<Slam.GetPointCloudMap
			{partID}
			{resourceName}
		/>
		<Slam.GetInternalState
			{partID}
			{resourceName}
		/>
		<Slam.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`Map` draws the SLAM service's 2D map with the base's pose and its current plan, and shows a Cloud SLAM notice in place of the map when the service uses Cloud SLAM. A click on the map sets the destination. `MoveOnMap` moves the base there, or to a typed end position, through the motion service it names.

```svelte
<script lang="ts">
	import { Slam, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'slam-1'
</script>

<WidgetsProvider>
	<div class="flex min-w-0 flex-col divide-y">
		<Slam.Map
			{partID}
			{resourceName}
		/>
		<Slam.MoveOnMap
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
