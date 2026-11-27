---
title: Movement sensor
description: Compose the movement sensor widgets into a test card.
---

This page shows how to lay out the `MovementSensor` widgets on one page: a test card with one section per API method, and a live map card. Every widget only reads, so none of them shares a conflict group.

The recipe wraps its widgets in one `<WidgetsProvider>`. A movement sensor supports only some of these calls. `GetProperties` shows which, so leave out the widgets whose call it reports as unsupported.

## Test card

Paired widgets sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { MovementSensor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'movement-sensor-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<MovementSensor.GetPosition
				{partID}
				{resourceName}
			/>
			<MovementSensor.GetOrientation
				{partID}
				{resourceName}
			/>
		</div>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<MovementSensor.GetCompassHeading
				{partID}
				{resourceName}
			/>
			<MovementSensor.GetAccuracy
				{partID}
				{resourceName}
			/>
		</div>
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-3 @2xl:divide-x @2xl:divide-y-0">
			<MovementSensor.GetLinearVelocity
				{partID}
				{resourceName}
			/>
			<MovementSensor.GetAngularVelocity
				{partID}
				{resourceName}
			/>
			<MovementSensor.GetLinearAcceleration
				{partID}
				{resourceName}
			/>
		</div>
		<MovementSensor.GetProperties
			{partID}
			{resourceName}
		/>
		<MovementSensor.GetReadings
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Map

`PositionMap` draws the sensor's position on a map with Follow, Center, and Satellite controls in a Map view panel. The marker points along the compass heading when the sensor reports one. A sensor that does not support position shows a "Not supported" row instead of the map.

```svelte
<script lang="ts">
	import { MovementSensor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'movement-sensor-1'
</script>

<WidgetsProvider>
	<MovementSensor.PositionMap
		{partID}
		{resourceName}
	/>
</WidgetsProvider>
```
