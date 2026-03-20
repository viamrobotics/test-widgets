<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import { numberValueFromEvent } from '$lib/event-handlers'

	interface Props {
		spin: (angleDeg: number, degsPerSec: number) => void
	}

	const { spin }: Props = $props()

	let angle = $state(90)
	let degsPerSec = $state(45)
</script>

<div class="flex flex-row gap-4">
	<Label cx="max-w-[96px] gap-1 text-xs">
		<span class="flex gap-1">
			Angle
			<abbr class="text-disabled">(º)</abbr>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p slot="description">The angle to spin in degrees. Positive is left, negative is right.</p>
			</Tooltip>
		</span>

		<NumericInput
			slot="input"
			value={angle}
			on:change={(event) => {
				angle = numberValueFromEvent(event) ?? 0
			}}
		/>
	</Label>
	<Label cx="max-w-[96px] gap-1 text-xs">
		<span class="flex gap-1 whitespace-nowrap">
			Angular velocity
			<abbr class="text-disabled">(º/s)</abbr>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6 "
				/>

				<p
					slot="description"
					class="whitespace-normal"
				>
					The angular velocity at which to spin in degrees per second. Given a positive angle and a
					positive velocity, the base turns to the left (for built-in base models).
				</p>
			</Tooltip>
		</span>

		<NumericInput
			slot="input"
			value={degsPerSec}
			on:change={(event) => {
				degsPerSec = numberValueFromEvent(event) ?? 0
			}}
		/>
	</Label>
</div>

<Button
	class="mt-auto"
	icon="play-circle-outline"
	onclick={() => {
		spin(angle, degsPerSec)
	}}
>
	Execute
</Button>
