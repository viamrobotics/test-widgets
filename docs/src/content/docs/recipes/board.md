---
title: Board
description: Compose the board widgets into a test card or a control interface.
---

This page shows two ways to lay out the `Board` widgets on one page: a test card that exercises each API method, and a control interface for driving pins by hand.

Both recipes wrap their widgets in one `<WidgetsProvider>`. The widgets for one board find each other through it by `partID` and `resourceName`, so no prop wires one widget to another.

Conflicts are per target, not per board. Every write to one GPIO pin shares that pin's conflict group: `SetGpio`, `SetPwm`, `SetPwmFrequency`, the GPIO Sets in `Pins`, and the High, Low, duty cycle, and frequency writes in `Pin`. While a write to pin 7 is in flight, the other writes to pin 7 are disabled and a press is dropped, never queued. A write to pin 8 stays live. Each analog writer has its own group, shared by `WriteAnalog` and the analog Set in `Pins`. `SetPowerMode` and `PowerMode` share one group of their own. Reads and streams join no group.

Each recipe follows the same three-layer order:

1. A glance row with the resource's state and the one action that always works. A board has neither, so both recipes start at the second layer.
2. The mutators, the widgets that write a pin or change the power mode.
3. The queries, the widgets that only read.

## Test card

Each section is headed by the API method it calls. Each pin widget draws its own Pin field. A host that holds one pin for all seven, such as a shared Pin field of its own, passes it as `pin` to `SetGpio`, `GetGpio`, `SetPwm`, `Pwm`, `SetPwmFrequency`, `PwmFrequency`, and `WriteAnalog`. Each then hides its Pin field, and an empty `pin` disables its button with a hint. The layers take a second column from a 672 px container and a third from 896 px. The hidden cell fills the short mutator row at two columns.

```svelte
<script lang="ts">
	import { Board, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'board-1'

	const LAYER_GRID_CLASS =
		'grid grid-cols-1 border-t border-light @2xl:grid-cols-2 @4xl:grid-cols-3 *:min-w-0 *:*:grow *:border-b *:border-light @2xl:*:border-r @2xl:*:nth-[2n]:border-r-0 @4xl:*:nth-[2n]:border-r @4xl:*:nth-[3n]:border-r-0'
</script>

<WidgetsProvider>
	<div class="@container mx-auto max-w-4xl">
		<div
			role="group"
			aria-label="Mutators"
			class={LAYER_GRID_CLASS}
		>
			<div class="flex flex-col">
				<Board.SetGpio
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.SetPwm
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.SetPwmFrequency
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.WriteAnalog
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.SetPowerMode
					{partID}
					{resourceName}
				/>
			</div>
			<div
				aria-hidden="true"
				class="hidden @2xl:block"
			></div>
		</div>

		<div
			role="group"
			aria-label="Queries"
			class={LAYER_GRID_CLASS}
		>
			<div class="flex flex-col">
				<Board.GetGpio
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.Pwm
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.PwmFrequency
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.ReadAnalogReader
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.GetDigitalInterruptValue
					{partID}
					{resourceName}
				/>
			</div>
			<div class="flex flex-col">
				<Board.StreamTicks
					{partID}
					{resourceName}
				/>
			</div>
		</div>
	</div>
</WidgetsProvider>
```

## Control interface

Each control keeps a list of the pins, analog readers, or digital interrupts the person adds in its field, one row per name, and polls each row. Remove drops a row and sends nothing. The lists persist per board in local storage, keyed by `partID` and `resourceName`, so a reload keeps them. `Pin` reads a pin's level, duty cycle, and frequency, and drives each. `AnalogReader` and `DigitalInterrupt` only read. Pass `analogReaders` to `AnalogReader` or `digitalInterrupts` to `DigitalInterrupt` to seed its list when nothing is saved for that board. A saved list wins over the seed. A failed read stops its own poll until Retry succeeds. `PowerMode` arms before it sends Offline deep. Each control's status line reads its latest row's step.

```svelte
<script lang="ts">
	import { Board, WidgetsProvider } from '@viamrobotics/test-widgets'

	const partID = 'my-part-id'
	const resourceName = 'board-1'
</script>

<WidgetsProvider>
	<div class="@container flex min-w-0 flex-col gap-3 p-2">
		<Board.Pin
			{partID}
			{resourceName}
		/>
		<Board.AnalogReader
			{partID}
			{resourceName}
			analogReaders={['a1']}
		/>
		<Board.DigitalInterrupt
			{partID}
			{resourceName}
			digitalInterrupts={['d1']}
		/>
		<Board.PowerMode
			{partID}
			{resourceName}
		/>
	</div>
</WidgetsProvider>
```
