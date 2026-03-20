<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import { numberValueFromEvent } from '$lib/event-handlers'

	interface Props {
		moveStraight: (distanceMm: number, mmPerSec: number) => void
	}

	const { moveStraight }: Props = $props()

	let distanceMm = $state(200)
	let mmPerSec = $state(100)
</script>

<div class="flex flex-row gap-4">
	<Label cx="max-w-[96px] gap-1 text-xs whitespace-nowrap">
		<span class="flex gap-1">
			Distance
			<abbr class="text-disabled">(mm)</abbr>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>
				<p
					slot="description"
					class="whitespace-normal"
				>
					Positive is forward, negative is backward
				</p>
			</Tooltip>
		</span>
		<NumericInput
			value={distanceMm}
			on:change={(event) => {
				distanceMm = numberValueFromEvent(event) ?? 0
			}}
			slot="input"
		/>
	</Label>
	<Label cx="max-w-[96px] gap-1 text-xs whitespace-nowrap">
		<span class="flex gap-1">
			Speed
			<abbr class="text-disabled">(mm/s)</abbr>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>
				<p
					slot="description"
					class="whitespace-normal"
				>
					Positive is forward, negative is backward
				</p>
			</Tooltip>
		</span>
		<NumericInput
			value={mmPerSec}
			on:change={(event) => {
				mmPerSec = numberValueFromEvent(event) ?? 0
			}}
			slot="input"
		/>
	</Label>
</div>

<Button
	slot="action"
	class="mt-auto"
	icon="play-circle-outline"
	onclick={() => {
		moveStraight(distanceMm, mmPerSec)
	}}
>
	Execute
</Button>
