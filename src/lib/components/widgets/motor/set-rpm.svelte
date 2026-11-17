<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		setRPM: (_: number) => void
	}

	const { setRPM }: Props = $props()

	let rpm = $state<number | undefined>(20)

	// An empty field is `undefined`, so it holds back Execute.
	const validRpm: number | undefined = $derived(
		rpm !== undefined && Number.isFinite(rpm) ? rpm : undefined
	)
</script>

<div class="flex w-full flex-wrap items-end gap-2">
	<NumberField
		label="RPM"
		hint="Speed in revolutions per minute."
		state={validRpm === undefined ? 'error' : undefined}
		class="min-w-40 flex-1"
		bind:value={rpm}
	/>
	<button
		type="button"
		class="button button-compact ml-auto"
		disabled={validRpm === undefined}
		onclick={() => {
			if (validRpm !== undefined) {
				setRPM(validRpm)
			}
		}}
	>
		<Icon icon={mdiPlayCircleOutline} />
		Execute
	</button>
</div>
