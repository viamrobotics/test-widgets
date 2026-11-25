<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		goTo: (rpm: number, pos: number) => void
		/** True while another motion call is in flight, which holds back Execute. @default false */
		isBusy?: boolean
	}

	const { goTo, isBusy = false }: Props = $props()

	let targetPosition = $state<number | undefined>(0.5)
	let rpm = $state<number | undefined>(10)

	// An empty field is `undefined`, so it holds back Execute.
	const validRpm: number | undefined = $derived(
		rpm !== undefined && Number.isFinite(rpm) ? rpm : undefined
	)
	const validTargetPosition: number | undefined = $derived(
		targetPosition !== undefined && Number.isFinite(targetPosition) ? targetPosition : undefined
	)
</script>

<div class="flex w-full flex-col gap-1">
	<NumberField
		label="RPM"
		hint="Speed at which the motor will move in revolutions per minute. Absolute value."
		state={validRpm === undefined ? 'error' : undefined}
		bind:value={rpm}
	/>
	<NumberField
		label="Target position"
		hint="Target position the motor will turn to in revolutions from home/zero."
		step={0.1}
		state={validTargetPosition === undefined ? 'error' : undefined}
		bind:value={targetPosition}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={validRpm === undefined || validTargetPosition === undefined || isBusy}
			onclick={() => {
				if (validRpm !== undefined && validTargetPosition !== undefined) {
					goTo(validRpm, validTargetPosition)
				}
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</div>
