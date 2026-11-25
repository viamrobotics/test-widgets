---
title: Navigation
description: Compose the navigation widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Navigation` widgets on one page: a test card that exercises each API method, and a control interface for steering the service by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one navigation service find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every `SetMode` and `Mode` widget shares one conflict group, so while a mode change is in flight the others are disabled and a press is dropped, never queued. `AddWaypoint`, `RemoveWaypoint`, and the waypoints `Map` adds and removes are in no group, so a removal never waits on another call. The queries stay live.

Each recipe follows the same three-layer order:

1. A glance row with `GetMode`, the service's current mode.
2. The mutators: `SetMode`, `AddWaypoint`, and `RemoveWaypoint`.
3. The queries, the widgets that only read.

## Test card

Each section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { Navigation, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'navigation-1'
</script>

<WidgetsProvider>
	<div class="flex flex-col divide-y">
		<Navigation.GetMode
			{partID}
			{resourceName}
		/>
		<Navigation.SetMode
			{partID}
			{resourceName}
		/>
		<Navigation.AddWaypoint
			{partID}
			{resourceName}
		/>
		<Navigation.RemoveWaypoint
			{partID}
			{resourceName}
		/>
		<Navigation.GetLocation
			{partID}
			{resourceName}
		/>
		<Navigation.GetWaypoints
			{partID}
			{resourceName}
		/>
		<Navigation.GetObstacles
			{partID}
			{resourceName}
		/>
		<Navigation.GetPaths
			{partID}
			{resourceName}
		/>
		<Navigation.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`Map` draws the robot's position and heading, its paths, obstacles, and waypoints on a map, with a compass and a Map view panel for the 2D or 3D view, satellite imagery, follow, and center. A click on the map adds a waypoint, and the waypoint list under the map focuses or removes each one. `Mode` switches the service between Manual and Waypoint on a press.

```svelte
<script lang="ts">
	import { Navigation, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'navigation-1'
</script>

<WidgetsProvider>
	<div class="flex min-w-0 flex-col divide-y">
		<Navigation.Map
			{partID}
			{resourceName}
		/>
		<Navigation.Mode
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
