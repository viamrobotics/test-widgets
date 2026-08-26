<script lang="ts">
	import { Button, Label, NumericInput } from '@viamrobotics/prime-core'

	import ApiSection from '$lib/components/api-section.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'

	import type { PosePosition } from './pose'

	interface Props {
		destination: PosePosition | undefined
		updateDestination: (_: Partial<PosePosition>) => void
		moveOnMap: (planDeviationM: number | undefined) => void
		stopPlan: () => void
		lastError: Error | null
	}

	const { destination, updateDestination, moveOnMap, stopPlan, lastError }: Props = $props()

	const destinationID = $props.id()

	let planDeviationM = $state<number>()
</script>

<ApiSection
	title="MoveOnMap"
	api="rdk:service:motion"
>
	<Label>
		Plan deviation <abbr>(m)</abbr>

		<NumericInput
			slot="input"
			placeholder="1"
			value={planDeviationM}
			on:change={(event) => {
				planDeviationM = numberValueFromEvent(event)
			}}
		/>
	</Label>
	<section
		class="border-light text-subtle-1 w-fit divide-y border text-xs"
		aria-labelledby={destinationID}
	>
		<h4
			class="bg-light flex flex-row place-content-center gap-1 px-2 py-1.5"
			id={destinationID}
		>
			End position
			<abbr class="text-disabled">(m)</abbr>
		</h4>
		<div class="flex flex-wrap gap-2 px-3 py-2.5">
			<Label>
				X

				<NumericInput
					slot="input"
					cx="text-default"
					value={destination?.x}
					on:change={(event) => {
						updateDestination({
							x: numberValueFromEvent(event) ?? 0,
						})
					}}
				/>
			</Label>
			<Label>
				Y

				<NumericInput
					slot="input"
					cx="text-default"
					value={destination?.y}
					on:change={(event) => {
						updateDestination({
							y: numberValueFromEvent(event) ?? 0,
						})
					}}
				/>
			</Label>
		</div>
	</section>

	<div>
		<Button
			class="mt-auto w-fit"
			icon="play-circle-outline"
			variant="dark"
			disabled={!destination}
			onclick={() => moveOnMap(planDeviationM)}
		>
			Execute
		</Button>
		<Button
			class="mt-auto w-fit"
			icon="stop-circle-outline"
			variant="danger"
			onclick={() => stopPlan()}
		>
			Stop
		</Button>
	</div>
	<ErrorDisplay {lastError} />
</ApiSection>
