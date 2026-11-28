---
title: Audio input
description: Compose the audio input widgets into a test card or a control interface.
---

This page shows two ways to lay out the `AudioInput` widgets on one page: a test card that exercises each API method, and a control interface for checking what the microphone hears.

Both recipes wrap their widgets in one `<WidgetsProvider>`, as every recipe does. The audio input widgets share no state, so no prop wires one widget to another, and no widget disables another. `GetAudio` streams chunks for the set duration from one press of Start capture, or until Stop when the duration is 0, and reads out the last chunk. `Listen` plays the microphone through the browser while it runs, draws a level meter for each channel, and its Record button records that playback for download.

Each recipe follows the same three-layer order:

1. A glance row. Audio input has no widget that reads a single value, so the recipes have none.
2. The mutators. Audio input has none, because capturing audio changes nothing on the device.
3. The queries, `GetAudio` and `GetProperties`, the widgets that only read.

## Test card

Each section is headed by the API method it calls. Paired widgets sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { AudioInput, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'audio-input-1'
</script>

<WidgetsProvider>
	<div class="@container">
		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0">
			<AudioInput.GetAudio
				{partID}
				{resourceName}
			/>
			<AudioInput.GetProperties
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

`Listen` first, for hearing the microphone live, then the same two widgets, stacked, for a narrow pane. `GetProperties` shows the sample rate, channels, and codecs the device reports. The codecs are the choices `GetAudio` offers.

```svelte
<script lang="ts">
	import { AudioInput, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'audio-input-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col divide-y">
		<AudioInput.Listen
			{partID}
			{resourceName}
		/>
		<AudioInput.GetProperties
			{partID}
			{resourceName}
		/>
		<AudioInput.GetAudio
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
