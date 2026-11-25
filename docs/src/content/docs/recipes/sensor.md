---
title: Sensor
description: Show a sensor's readings with the Sensor widget.
---

The `Sensor` namespace has one widget, `GetReadings`. It polls the sensor's `GetReadings` call, lists each reading as a term and its value, and offers a refresh rate, Pause, and a button that copies the JSON.

The recipe wraps the widget in a `<WidgetsProvider>` like every other recipe, so you can add widgets for other resources beside it.

## Test card

```svelte
<script lang="ts">
	import { Sensor, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'sensor-1'
</script>

<WidgetsProvider>
	<Sensor.GetReadings
		{partID}
		{resourceName}
	/>
</WidgetsProvider>
```
