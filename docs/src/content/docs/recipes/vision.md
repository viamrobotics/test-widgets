---
title: Vision
description: Compose the vision widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Vision` widgets on one page: a test card that exercises each API method, and a control interface for watching what a vision service sees.

Both recipes wrap their widgets in one `<WidgetsProvider>`, the one wrapper every resource's recipe uses. The vision widgets share no state today. Each widget that reads from a camera draws its own `Camera` row, preselected to the service's default camera, and a pick in one widget does not change another. To fix the camera instead, pass `cameraName` to `CaptureAllFromCamera`, `GetDetectionsFromCamera`, `GetClassificationsFromCamera`, or `GetObjectPointClouds`. With it set, the widget reads that camera and draws no `Camera` row, and `''` is the service's default camera. No vision widget commands a device, so none is disabled while another runs.

Each recipe follows the same three-layer order:

1. A glance row with `GetProperties`, which reports what the service supports.
2. The mutators. A vision service has none, so this layer is empty.
3. The queries, the widgets that only read: the ones that read a camera, then the ones that read an image you choose. In the control interface, `OverlayFeed` leads this layer.

`GetDetections`, `GetClassifications`, and `GetObjectPointClouds` need a service that reports the matching support in `GetProperties`. A widget for an unsupported capability still renders. Leave it out of your page when `GetProperties` reports `false`.

## Test card

Each section is headed by the API method it calls. Paired widgets sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { Vision, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'vision-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<Vision.GetProperties
			{partID}
			{resourceName}
		/>

		<Vision.CaptureAllFromCamera
			{partID}
			{resourceName}
		/>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Vision.GetDetectionsFromCamera
				{partID}
				{resourceName}
			/>
			<Vision.GetClassificationsFromCamera
				{partID}
				{resourceName}
			/>
		</div>
		<Vision.GetObjectPointClouds
			{partID}
			{resourceName}
		/>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Vision.GetDetections
				{partID}
				{resourceName}
			/>
			<Vision.GetClassifications
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

`OverlayFeed` is the main view. It polls `CaptureAllFromCamera` and draws the camera's feed at the full container width with the detection boxes on it and a legend of labels and classifications, with its controls below. For a service that reports object point cloud support, its Mode toggle switches the frame to the object point clouds. Pass the mlmodel service's `default_minimum_confidence` as `minimumConfidence` and its `label_confidences` as `labelConfidences` to show which detections the service keeps, under the feed. `GetDetectionsFromCamera` and `GetClassificationsFromCamera` poll the camera on their own, and `GetObjectPointClouds` reads the point clouds.

```svelte
<script lang="ts">
	import { Vision, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'vision-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<Vision.GetProperties
			{partID}
			{resourceName}
		/>

		<Vision.OverlayFeed
			{partID}
			{resourceName}
		/>

		<div class="grid min-w-0 grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:items-start @2xl:gap-x-4">
			<Vision.GetDetectionsFromCamera
				{partID}
				{resourceName}
			/>
			<Vision.GetClassificationsFromCamera
				{partID}
				{resourceName}
			/>
		</div>

		<Vision.GetObjectPointClouds
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
