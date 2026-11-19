<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		spin: (angleDeg: number, degsPerSec: number) => void
	}

	const { spin }: Props = $props()

	let angle = $state<number | undefined>(90)
	let degsPerSec = $state<number | undefined>(45)

	// An empty field is `undefined`, so it holds back Execute.
	const validAngle: number | undefined = $derived(
		angle !== undefined && Number.isFinite(angle) ? angle : undefined
	)
	const validDegsPerSec: number | undefined = $derived(
		degsPerSec !== undefined && Number.isFinite(degsPerSec) ? degsPerSec : undefined
	)
</script>

<div class="flex w-full flex-col gap-1">
	<NumberField
		label="Angle"
		hint="The angle to spin in degrees. Positive is left, negative is right."
		suffix="°"
		state={validAngle === undefined ? 'error' : undefined}
		bind:value={angle}
	/>
	<NumberField
		label="Angular velocity"
		hint="The angular velocity at which to spin in degrees per second. Given a positive angle and a positive velocity, the base turns to the left (for built-in base models)."
		suffix="°/s"
		state={validDegsPerSec === undefined ? 'error' : undefined}
		bind:value={degsPerSec}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={validAngle === undefined || validDegsPerSec === undefined}
			onclick={() => {
				if (validAngle !== undefined && validDegsPerSec !== undefined) {
					spin(validAngle, validDegsPerSec)
				}
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</div>
