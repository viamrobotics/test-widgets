<script lang="ts">
	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import Table from '$lib/components/table.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	const INCREMENT_DEGREES = 5

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
		useRadians: boolean
		isMoving: boolean
	}

	const { positions, moveToJointPositions, useRadians, isMoving }: Props = $props()

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const currentDisplayPositions = $derived(positions.map((degrees) => toDisplayAngle(degrees)))

	const quickMove = (index: number, increment: number) => {
		if (isMoving) {
			return
		}
		const clonedPositions = positions.map((position, positionIndex) =>
			positionIndex === index ? position + increment : position
		)
		moveToJointPositions(clonedPositions)
	}
</script>

<Tooltip>
	<span class="flex items-center gap-1 text-xs text-amber-600">
		<Icon
			name="alert"
			size="sm"
			cx="text-amber-600"
		/>
		Quick move executes immediately
	</span>
	<span slot="description">
		Each ±5° button sends a move command as soon as it is pressed. Buttons are disabled while the
		arm is moving.
	</span>
</Tooltip>

<Table>
	<thead>
		<tr>
			<th>Joint</th>
			<th>Move (degrees)</th>
		</tr>
	</thead>
	<tbody>
		{#each positions as position, index (index)}
			{@const currentValue = currentDisplayPositions[index] ?? position}
			{@const unit = useRadians ? ' rad' : '°'}
			<tr>
				<th scope="row">{index}</th>
				<th>
					<div class="flex h-full max-h-6.5 w-full items-center justify-center gap-1.5">
						<Button
							aria-label="Decrease joint {index} by 5 degrees"
							disabled={isMoving}
							onclick={() => quickMove(index, -INCREMENT_DEGREES)}
						>
							−5°
						</Button>
						<span class="min-w-16 grow text-center text-xs text-gray-700 tabular-nums">
							{formatNumeric(currentValue)}{unit}
						</span>
						<Button
							aria-label="Increase joint {index} by 5 degrees"
							disabled={isMoving}
							onclick={() => quickMove(index, INCREMENT_DEGREES)}
						>
							+5°
						</Button>
					</div>
				</th>
			</tr>
		{/each}
	</tbody>
</Table>
