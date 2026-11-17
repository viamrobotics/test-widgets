<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		setPower: (_: number) => void
	}

	const { setPower }: Props = $props()

	const MIN_POWER = -1
	const MAX_POWER = 1

	let power = $state<number | undefined>(0.5)

	// Typing is not clamped, so an empty or out-of-range field holds back Execute.
	const validPower: number | undefined = $derived(
		power !== undefined && Number.isFinite(power) && power >= MIN_POWER && power <= MAX_POWER
			? power
			: undefined
	)
</script>

<div class="flex w-full flex-wrap items-end gap-2">
	<NumberField
		label="Power"
		hint="The percentage of max power to send to the motor, in the range of –1.0 to 1.0. 1 is 100% power forward, –1 is 100% power backward."
		min={MIN_POWER}
		max={MAX_POWER}
		step={0.1}
		state={validPower === undefined ? 'error' : undefined}
		class="min-w-40 flex-1"
		bind:value={power}
	/>
	<button
		type="button"
		class="button button-compact ml-auto"
		disabled={validPower === undefined}
		onclick={() => {
			if (validPower !== undefined) {
				setPower(validPower)
			}
		}}
	>
		<Icon icon={mdiPlayCircleOutline} />
		Execute
	</button>
</div>
