---
title: Camera
description: Compose the camera widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Camera` widgets on one page: a test card that exercises each API method, and a control interface for viewing the camera.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one camera find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. The camera widgets share no conflict group, so every one is always live. `LiveFeed`'s Resolution row drops a press while its own call is in flight.

`GetPointCloud` needs a camera that reports point cloud support. Read `supportsPcd` from `GetProperties` and leave the widget out when it is `false`.

Media takes the full container width, with controls below it. `LiveFeed` is the continuous view of the camera: a live or polling feed with its refresh rate, source, fit, stream resolution, and the Screenshot, Picture-in-picture, and Add to dataset actions. It shows a 360° or panorama view for a frame tagged as one. For a camera that reports point cloud support, its Mode toggle switches the frame to the point cloud. Its optional props are `autoplay`, `widthPx` and `heightPx` for the feed's ratio before the first frame, and `defaultFit`.

## Test card

Each section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { Camera, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'camera-1'
</script>

<WidgetsProvider>
	<div class="flex flex-col divide-y">
		<Camera.GetImages
			{partID}
			{resourceName}
		/>
		<Camera.GetPointCloud
			{partID}
			{resourceName}
		/>
		<Camera.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Control interface

`LiveFeed` draws the camera's feed at the full container width, with its controls below, and switches to the point cloud from its Mode toggle. `GetProperties` sits last as the reference for what the camera supports.

```svelte
<script lang="ts">
	import { Camera, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'camera-1'
</script>

<WidgetsProvider>
	<div class="flex min-w-0 flex-col gap-4 p-2">
		<Camera.LiveFeed
			{partID}
			{resourceName}
		/>
		<Camera.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
