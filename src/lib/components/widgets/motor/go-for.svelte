<script lang="ts">
	import { Button, Icon, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import { numberValueFromEvent } from '$lib/event-handlers'

	interface Props {
		goFor: (rpm: number, revolutions: number) => void
	}

	const { goFor }: Props = $props()

	let revolutions = $state(1)
	let rpm = $state(10)
</script>

<div class="flex flex-row gap-4">
	<Label cx="max-w-[96px] grow gap-1 text-xs">
		<p class="flex flex-row gap-1">
			RPM
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p
					slot="description"
					class="text-xs"
				>
					Speed at which the motor will move in revolutions per minute. Positive is forward,
					negative is backward.
					<br /><br />
					Note: If both “Revolutions” and “RPM” are negative, the motor will spin forward.
				</p>
			</Tooltip>
		</p>

		<NumericInput
			slot="input"
			value={rpm}
			on:change={(event) => {
				rpm = numberValueFromEvent(event) ?? 0
			}}
		/>
	</Label>
	<Label cx="max-w-[96px] grow gap-1 text-xs">
		<p class="flex flex-row gap-1">
			Revolutions
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<p
					slot="description"
					class="text-xs"
				>
					Number of revolutions the motor will run for. Positive is forward, negative is backward.
				</p>
			</Tooltip>
		</p>

		<NumericInput
			slot="input"
			value={revolutions}
			on:change={(event) => {
				revolutions = numberValueFromEvent(event) ?? 0
			}}
		/>
	</Label>
</div>

<div class="mt-auto">
	<Button
		icon="play-circle-outline"
		onclick={() => goFor(rpm, revolutions)}>Execute</Button
	>
</div>
