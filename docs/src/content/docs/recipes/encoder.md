---
title: Encoder
description: Compose the encoder widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Encoder` widgets on one page: a test card that exercises each API method, and a control interface for zeroing the encoder while watching its position.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one encoder find each other through it by `partID` and `resourceName`, so no prop wires one widget to another. Every call that zeroes the position shares one conflict group, so a second `ResetPosition` is disabled while one is in flight and a press is dropped, never queued. `GetPosition` and `GetProperties` are queries and stay live.

Each recipe follows the same three-layer order:

1. A glance row. The encoder has no state worth a row of its own, so both recipes skip it.
2. The mutators, here `ResetPosition`.
3. The queries, here `GetPosition` and `GetProperties`.

## Test card

Each section is headed by the API method it calls. The two queries sit side by side from a 672 px container.

```svelte
<script lang="ts">
	import { Encoder, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'encoder-1'
</script>

<WidgetsProvider>
	<div class="@container flex flex-col divide-y">
		<Encoder.ResetPosition
			{partID}
			{resourceName}
		/>

		<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
			<Encoder.GetPosition
				{partID}
				{resourceName}
			/>
			<Encoder.GetProperties
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

The control interface puts the live position next to a two-step reset, so a person sees the value they are about to zero. `ZeroPosition` shows an angle and a ticks readout for an encoder that supports both, and arms on the first press and sends on a confirming second press. It joins the `ResetPosition` conflict group.

```svelte
<script lang="ts">
	import { Encoder, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'encoder-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col">
		<Encoder.ZeroPosition
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
