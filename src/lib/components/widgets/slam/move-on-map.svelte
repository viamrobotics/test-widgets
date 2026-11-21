<script lang="ts">
	import { mdiPlayCircleOutline, mdiStopCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Destination {
		x: number
		y: number
	}

	interface Props {
		/** End position X in meters. Bound, because a map click also sets it. */
		x?: number
		/** End position Y in meters. Bound, because a map click also sets it. */
		y?: number
		moveOnMap: (destination: Destination, planDeviationM: number | undefined) => void
		stopPlan: () => void
		/** True while a MoveOnMap call is in flight. Execute shows in-progress and ignores presses. */
		isMoving: boolean
	}

	let { x = $bindable(), y = $bindable(), moveOnMap, stopPlan, isMoving }: Props = $props()

	const endPositionID = $props.id()

	let planDeviationM = $state<number>()

	const finiteOrUndefined = (value: number | undefined) =>
		value !== undefined && Number.isFinite(value) ? value : undefined

	// An empty X or Y field is `undefined`, so it holds back Execute.
	const destination = $derived.by((): Destination | undefined => {
		const validX = finiteOrUndefined(x)
		const validY = finiteOrUndefined(y)
		if (validX === undefined || validY === undefined) return undefined
		return { x: validX, y: validY }
	})

	const execute = () => {
		if (destination && !isMoving) {
			moveOnMap(destination, finiteOrUndefined(planDeviationM))
		}
	}
</script>

<div class="flex flex-col gap-2">
	<NumberField
		label="Plan deviation"
		suffix="m"
		placeholder="1"
		step={0.01}
		bind:value={planDeviationM}
	/>

	<div
		role="group"
		aria-labelledby={endPositionID}
		class="flex flex-col gap-2"
	>
		<p
			id={endPositionID}
			class="text-subtle-1 text-xs font-semibold"
		>
			End position
		</p>
		<NumberField
			label="X"
			aria-label="End position X, meters"
			suffix="m"
			step={0.01}
			bind:value={x}
		/>
		<NumberField
			label="Y"
			aria-label="End position Y, meters"
			suffix="m"
			step={0.01}
			bind:value={y}
		/>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			class="button button-compact"
			aria-disabled={destination === undefined || isMoving || undefined}
			aria-busy={isMoving || undefined}
			onclick={execute}
		>
			{#if isMoving}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{:else}
				<Icon icon={mdiPlayCircleOutline} />
			{/if}
			Execute
		</button>
		<button
			type="button"
			class="button button-danger button-outline button-compact"
			onclick={stopPlan}
		>
			<Icon icon={mdiStopCircleOutline} />
			Stop
		</button>
	</div>
</div>
