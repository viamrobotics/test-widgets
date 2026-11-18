<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		moveStraight: (distanceMm: number, mmPerSec: number) => void
	}

	const { moveStraight }: Props = $props()

	let distanceMm = $state<number | undefined>(200)
	let mmPerSec = $state<number | undefined>(100)

	// An empty field is `undefined`, so it holds back Execute.
	const validDistance: number | undefined = $derived(
		distanceMm !== undefined && Number.isFinite(distanceMm) ? distanceMm : undefined
	)
	const validSpeed: number | undefined = $derived(
		mmPerSec !== undefined && Number.isFinite(mmPerSec) ? mmPerSec : undefined
	)
</script>

<div class="flex w-full flex-col gap-1">
	<NumberField
		label="Distance"
		hint="Positive is forward, negative is backward"
		suffix="mm"
		state={validDistance === undefined ? 'error' : undefined}
		bind:value={distanceMm}
	/>
	<NumberField
		label="Speed"
		hint="Positive is forward, negative is backward"
		suffix="mm/s"
		state={validSpeed === undefined ? 'error' : undefined}
		bind:value={mmPerSec}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={validDistance === undefined || validSpeed === undefined}
			onclick={() => {
				if (validDistance !== undefined && validSpeed !== undefined) {
					moveStraight(validDistance, validSpeed)
				}
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</div>
