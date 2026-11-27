---
title: Audio output
description: Compose the audio output widgets into a test card or a control interface.
---

This page shows two ways to lay out the `AudioOutput` widgets on one page: a test card that exercises each API method, and a control interface for playing a file or the microphone through the speaker.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one audio output find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. `Play`, `PlayFile`, `PlayStream`, and `HoldToTalk` share one playback group, because two clips or streams at once would talk over each other. While one is in flight the others are disabled and a press is dropped, never queued. `PlayStream` keeps its `Stop` button enabled while it streams. `HoldToTalk` keeps its button enabled from its press until its call settles, and a release always sends.

Each recipe follows the same three-layer order:

1. A glance row. Audio output has no widget that reads one value or always acts, so the recipes have none.
2. The mutators, `Play` and `PlayStream`, the widgets that drive the speaker. The control interface adds `HoldToTalk` and `PlayFile`, which plays a file at the device's own format.
3. The queries, `GetProperties`, the widget that only reads.

`HoldToTalk` sends the microphone to the speaker for as long as its button is held. On a transport that cannot carry `PlayStream`, it records while held and plays the clip once it is released.

## Test card

Each section is headed by the API method it calls.

```svelte
<script lang="ts">
	import { AudioOutput, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'audio-output-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<div
			role="group"
			aria-label="Mutators"
			class="grid grid-cols-1 divide-y"
		>
			<AudioOutput.Play
				{partID}
				{resourceName}
			/>
			<AudioOutput.PlayStream
				{partID}
				{resourceName}
			/>
		</div>
		<div
			role="group"
			aria-label="Queries"
			class="grid grid-cols-1 divide-y"
		>
			<AudioOutput.GetProperties
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

`HoldToTalk` and `PlayFile` come first, side by side from a 672 px container. `Play` and `PlayStream` sit below them in the same way, with the properties last.

```svelte
<script lang="ts">
	import { AudioOutput, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'audio-output-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<div class="grid min-w-0 grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:items-start @2xl:gap-x-4">
			<AudioOutput.HoldToTalk
				{partID}
				{resourceName}
			/>
			<AudioOutput.PlayFile
				{partID}
				{resourceName}
			/>
		</div>

		<div class="grid min-w-0 grid-cols-1 gap-3 @2xl:grid-cols-2 @2xl:items-start @2xl:gap-x-4">
			<AudioOutput.Play
				{partID}
				{resourceName}
			/>
			<AudioOutput.PlayStream
				{partID}
				{resourceName}
			/>
		</div>

		<AudioOutput.GetProperties
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
