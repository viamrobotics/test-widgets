<script lang="ts">
	import { Button, Icon, NumericInput, Tooltip } from '@viamrobotics/prime-core'
	import { isEqual, zip } from 'lodash-es'

	import ErrorDisplay from '$lib/components/error.svelte'
	import Table from '$lib/components/table.svelte'

	import { matchArrayLength } from './match-array-length'

	interface Props {
		positions: number[]
		moveTo: (newPos: number[], speeds: number[]) => void
		lastError: Error | null
	}

	const { positions, moveTo, lastError }: Props = $props()

	let desiredSpeeds: number[] = $state([])

	$effect(() => {
		const nextDesiredSpeeds = matchArrayLength(desiredSpeeds, positions, 50)

		if (!isEqual(nextDesiredSpeeds, desiredSpeeds)) {
			desiredSpeeds = nextDesiredSpeeds
		}
	})

	let desiredPositions: number[] = $state([])

	$effect(() => {
		const nextDesiredPositions = matchArrayLength(desiredPositions, positions, 0)

		if (!isEqual(nextDesiredPositions, desiredPositions)) {
			desiredPositions = nextDesiredPositions
		}
	})

	const onChangePos = (index: number, event: Event) => {
		const target = event.target as HTMLInputElement
		desiredPositions[index] = target.valueAsNumber
	}
	const onChangeSpeed = (index: number, event: Event) => {
		const target = event.target as HTMLInputElement
		desiredSpeeds[index] = target.valueAsNumber
	}
	const resetToZero = () => {
		desiredSpeeds = matchArrayLength([], positions, 50)
		desiredPositions = matchArrayLength([], positions, 0)
	}
	const resetToCurrent = () => {
		desiredPositions = positions
	}

	const id = $props.id()
	const moveToHeadingID = `${id}-move-to-heading`
	const speedHeadingID = `${id}-speed-heading`
</script>

<div class="flex flex-col gap-4">
	<Table>
		<thead>
			<tr>
				<th> Axis </th>
				<th id={moveToHeadingID}> Move to <abbr>(mm)</abbr> </th>
				<th id={speedHeadingID}> Speed <abbr>(mm/s)</abbr> </th>
			</tr>
		</thead>
		<tbody>
			{#each zip(desiredPositions, desiredSpeeds) as [position, speed], index (index)}
				<tr>
					<th> {index} </th>
					<th>
						<NumericInput
							cx="max-w-[80px]"
							step={0.01}
							aria-labelledby={moveToHeadingID}
							value={position}
							on:change={(event) => onChangePos(index, event)}
						/>
					</th>
					<th>
						<NumericInput
							cx="max-w-[80px]"
							aria-labelledby={speedHeadingID}
							step={0.1}
							value={speed}
							on:change={(event) => onChangeSpeed(index, event)}
						/>
					</th>
				</tr>
			{/each}
		</tbody>
	</Table>
	<div class="mb-2 flex flex-col gap-2">
		<span class="flex flex-row gap-2">
			<h4 class="text-xs font-semibold">Quick set</h4>
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>
				<span slot="description">
					Will update the "Move to" input values but will not execute
				</span>
			</Tooltip>
		</span>
		<div class="flex flex-row gap-2">
			<Button onclick={resetToZero}>Zero</Button>
			<Button onclick={resetToCurrent}>Current position</Button>
		</div>
	</div>
	<Button
		class="mt-auto w-fit"
		icon="play-circle-outline"
		variant="dark"
		onclick={() => moveTo(desiredPositions, desiredSpeeds)}
	>
		Execute
	</Button>
	<ErrorDisplay {lastError} />
</div>
