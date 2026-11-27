---
title: Power sensor
description: Compose the power sensor widgets into a test card.
---

This page shows how to lay out the `PowerSensor` widgets on one page: a test card with one section per API method, and a live history card. Every widget only reads, so none of them shares a conflict group.

The recipe wraps its widgets in one `<WidgetsProvider>`.

## Test card

`GetVoltage`, `GetCurrent`, `GetPower`, and `GetBatteryPercent` sit side by side from a 672 px container. `GetBatteryPercent` says so when the sensor reports no battery percent. `GetReadings` is below them, polls the full readings once a second, and draws its own Pause and refresh rate controls.

```svelte
<script lang="ts">
	import { PowerSensor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'power-sensor-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-4 @2xl:divide-x @2xl:divide-y-0">
			<PowerSensor.GetVoltage
				{partID}
				{resourceName}
			/>
			<PowerSensor.GetCurrent
				{partID}
				{resourceName}
			/>
			<PowerSensor.GetPower
				{partID}
				{resourceName}
			/>
			<PowerSensor.GetBatteryPercent
				{partID}
				{resourceName}
			/>
		</div>
		<PowerSensor.GetReadings
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```

## Live history

`ReadingHistory` polls voltage, current, and power together and draws a history line beside each reading. It has its own refresh rate control, and the note under the lines names how much time they cover.

```svelte
<script lang="ts">
	import { PowerSensor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'power-sensor-1'
</script>

<WidgetsProvider>
	<PowerSensor.ReadingHistory
		{partID}
		{resourceName}
	/>
</WidgetsProvider>
```
