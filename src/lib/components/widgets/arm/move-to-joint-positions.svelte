<script lang="ts">
	import { Button, Icon, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	import { getOutOfBoundsSide, isOutsideJointLimit, type JointLimit } from './joint-position-limits'

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
		lastError: Error | null
		jointLimitsDegrees: JointLimit[]
	}

	const { positions, moveToJointPositions, lastError, jointLimitsDegrees }: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPositions = $state([...positions])
	let useRadians = $state(false)

	const resetToZero = () => {
		desiredPositions = [...desiredPositions].fill(0)
	}

	const resetToCurrent = () => {
		desiredPositions = [...positions]
	}

	const handleJointInputChange = (index: number, inputValue: number) => {
		// default is degrees, so if user has toggle to radians, convert back to degrees before setting
		// (we only convert to radians when displaying)
		desiredPositions[index] = useRadians ? radiansToDegrees(inputValue) : inputValue
	}

	const handlePaste = (data: string): boolean => {
		try {
			desiredPositions = JSON.parse(data) as number[]
		} catch {
			return false
		}
		return true
	}
	const degreesToDisplayAngle = (degrees: number) => {
		return useRadians ? degreesToRadians(degrees) : degrees
	}

	const outOfBoundsMessage = (displayValue: number, limit: JointLimit) => {
		const min = degreesToDisplayAngle(limit.minDegrees)
		const max = degreesToDisplayAngle(limit.maxDegrees)
		const unit = useRadians ? 'rad' : 'deg'
		const side = getOutOfBoundsSide(displayValue, min, max)

		if (side === 'below-min') {
			return `Min value is ${formatNumeric(min)} ${unit}`
		}

		if (side === 'above-max') {
			return `Max value is ${formatNumeric(max)} ${unit}`
		}
	}

	const displayPositions = $derived(desiredPositions.map((pos) => degreesToDisplayAngle(pos)))

	const copyData = $derived(`[${displayPositions.join(', ')}]`)

	const outOfBoundsByIndex = $derived(
		displayPositions.map((displayValue, index) => {
			const limit = jointLimitsDegrees[index]
			if (!limit) {
				return false
			}
			return isOutsideJointLimit(
				displayValue,
				degreesToDisplayAngle(limit.minDegrees),
				degreesToDisplayAngle(limit.maxDegrees)
			)
		})
	)

	const hasOutOfBoundsPositions = $derived(outOfBoundsByIndex.some(Boolean))
</script>

<div class="flex min-w-0 flex-col gap-4">
	<!-- Controls Header -->
	<div class="flex items-center justify-between">
		<span class="flex flex-row items-center gap-1 text-sm">
			Joint Positions
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<span slot="description">
					Joint position limits are based solely on the arm kinematics and do not take into account
					motion service limit overrides.
				</span>
			</Tooltip>
		</span>
		<div class="flex gap-1">
			<AngleUnitToggle
				{useRadians}
				onToggle={() => {
					useRadians = !useRadians
				}}
			/>
			<CopyButton data={copyData} />
			<PasteButton onPaste={handlePaste} />
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
				{@const outOfBounds = outOfBoundsByIndex[index]}
				<tr>
					<th>{index}</th>
					<th>
						<div class="flex flex-col items-center gap-0.5 py-0.5">
							<NumericInput
								cx="max-w-[76px]"
								{value}
								on:change={(event) => {
									const inputValue = numberValueFromEvent(event) ?? 0
									handleJointInputChange(index, inputValue)
								}}
							/>
							{#if limit && outOfBounds}
								<p class="text-danger-dark text-center text-[10px] leading-snug whitespace-normal">
									{outOfBoundsMessage(displayPositions[index], limit)}
								</p>
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
		disabled={hasOutOfBoundsPositions}
		icon="play-circle-outline"
		variant="dark"
		onclick={() => moveToJointPositions(desiredPositions)}
	>
		Execute
	</Button>
	<ErrorDisplay {lastError} />
</div>
