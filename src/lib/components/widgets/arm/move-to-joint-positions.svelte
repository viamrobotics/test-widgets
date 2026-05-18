<script lang="ts">
	import { Button, Icon, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'
	import type { JointLimit } from './joint-position-limits'

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
		lastError: Error | null
		jointLimitsDegrees?: JointLimit[]
	}

	const { positions, moveToJointPositions, lastError, jointLimitsDegrees = [] }: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPositions = $state([...positions])
	let useRadians = $state(false)

	const resetToZero = () => {
		desiredPositions = [...desiredPositions].fill(0)
	}

	const resetToCurrent = () => {
		desiredPositions = [...positions]
	}

	const displayPositions = $derived(
		desiredPositions.map((pos) => (useRadians ? degreesToRadians(pos) : pos))
	)

	const copyData = $derived(`[${displayPositions.join(', ')}]`)

	const handleJointInputChange = (index: number, inputValue: number) => {
		// default is degrees, so if user has toggle to radians, convert back to degrees before setting
		// (we only convert to radians when displaying)
		desiredPositions[index] = useRadians ? radiansToDegrees(inputValue) : inputValue
	}

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)
</script>

<div class="flex min-w-0 flex-col gap-4">
	<!-- Controls Header -->
	<div class="flex items-center justify-between">
		<span class="text-sm">Joint Positions</span>
		<div class="flex gap-1">
			<AngleUnitToggle
				{useRadians}
				onToggle={() => {
					useRadians = !useRadians
				}}
			/>
			<CopyButton data={copyData} />
		</div>
	</div>

	<Table>
		<thead>
			<tr>
				<th> Joint </th>
				<th>Move ({useRadians ? 'radians' : 'degrees'})</th>
			</tr>
		</thead>
		<tbody>
			{#each { length: positions.length }, index}
				{@const limit = jointLimitsDegrees[index]}
				{@const value = Number.parseFloat(formatNumeric(displayPositions[index]))}
				<tr>
					<th> {index} </th>
					<th>
						<div class="flex items-center justify-center gap-1.5">
							{#if limit}
								<span
									class="text-subtle-2 w-9 shrink-0 text-right font-roboto-mono text-xs tabular-nums"
									title="Minimum"
								>
									{formatNumeric(toDisplayAngle(limit.minDegrees))}
								</span>
							{/if}
							<NumericInput
								cx="max-w-[76px]"
								{value}
								min={limit ? toDisplayAngle(limit.minDegrees) : undefined}
								max={limit ? toDisplayAngle(limit.maxDegrees) : undefined}
								on:change={(event) => {
									const inputValue = numberValueFromEvent(event) ?? 0
									handleJointInputChange(index, inputValue)
								}}
							/>
							{#if limit}
								<span
									class="text-subtle-2 w-9 shrink-0 text-left font-roboto-mono text-xs tabular-nums"
									title="Maximum"
								>
									{formatNumeric(toDisplayAngle(limit.maxDegrees))}
								</span>
							{/if}
						</div>
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
		<div class="flex flex-col gap-2 sm:flex-row">
			<Button onclick={resetToZero}>Zero</Button>
			<Button onclick={resetToCurrent}>Current position</Button>
		</div>
	</div>
	<Button
		class="mt-auto w-fit"
		icon="play-circle-outline"
		variant="dark"
		onclick={() => moveToJointPositions(desiredPositions)}
	>
		Execute
	</Button>
	<ErrorDisplay {lastError} />
</div>
