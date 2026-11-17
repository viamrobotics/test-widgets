<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		goFor: (rpm: number, revolutions: number) => void
	}

	const { goFor }: Props = $props()

	let revolutions = $state<number | undefined>(1)
	let rpm = $state<number | undefined>(10)

	// An empty field is `undefined`, so it holds back Execute.
	const validRpm: number | undefined = $derived(
		rpm !== undefined && Number.isFinite(rpm) ? rpm : undefined
	)
	const validRevolutions: number | undefined = $derived(
		revolutions !== undefined && Number.isFinite(revolutions) ? revolutions : undefined
	)
</script>

<div class="flex w-full flex-col gap-1">
	<NumberField
		label="RPM"
		hint="Speed at which the motor will move in revolutions per minute. Positive is forward, negative is backward. Note: If both “Revolutions” and “RPM” are negative, the motor will spin forward."
		state={validRpm === undefined ? 'error' : undefined}
		bind:value={rpm}
	/>
	<NumberField
		label="Revolutions"
		hint="Number of revolutions the motor will run for. Positive is forward, negative is backward."
		state={validRevolutions === undefined ? 'error' : undefined}
		bind:value={revolutions}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={validRpm === undefined || validRevolutions === undefined}
			onclick={() => {
				if (validRpm !== undefined && validRevolutions !== undefined) {
					goFor(validRpm, validRevolutions)
				}
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</div>
