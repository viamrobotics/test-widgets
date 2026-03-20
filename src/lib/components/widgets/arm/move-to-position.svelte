<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import { Button, Icon, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error-display.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	interface Props {
		endPosition: Pose
		moveToPosition: (position: Pose) => void
		lastError: Error | null
	}

	const { endPosition, moveToPosition, lastError }: Props = $props()

	let desiredPosition = $state({ ...endPosition })
	let useRadians = $state(false)

	const resetToZero = () => {
		desiredPosition = {
			x: 0,
			y: 0,
			z: 0,
			oX: 0,
			oY: 0,
			oZ: 0,
			theta: 0,
		}
	}

	const resetToCurrent = () => {
		desiredPosition = { ...endPosition }
	}

	const displayPosition = $derived({
		x: desiredPosition.x,
		y: desiredPosition.y,
		z: desiredPosition.z,
		oX: desiredPosition.oX,
		oY: desiredPosition.oY,
		oZ: desiredPosition.oZ,
		theta: useRadians ? degreesToRadians(desiredPosition.theta) : desiredPosition.theta,
	})

	const copyData = $derived(
		`{x: ${displayPosition.x}, y: ${displayPosition.y}, z: ${displayPosition.z}, o_x: ${displayPosition.oX}, o_y: ${displayPosition.oY}, o_z: ${displayPosition.oZ}, theta: ${displayPosition.theta}}`
	)

	const handleAngleInputChange = (key: keyof Pose, inputValue: number) => {
		if (key === 'theta') {
			desiredPosition[key] = useRadians ? radiansToDegrees(inputValue) : inputValue
		} else {
			desiredPosition[key] = inputValue
		}
	}

	const positionLabels: Record<keyof Pose, string> = {
		x: 'X',
		y: 'Y',
		z: 'Z',
		oX: 'OX',
		oY: 'OY',
		oZ: 'OZ',
		theta: 'θ',
	} as const
	const positionLabelsList = Object.entries(positionLabels) as [keyof Pose, string][]
</script>

<div class="flex min-w-0 flex-col gap-4">
	<!-- Controls Header -->
	<div class="flex items-center justify-between">
		<span class="text-sm">Pose Values</span>
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
				<th>Pose</th>
				<th>Value ({useRadians ? 'radians' : 'degrees'})</th>
			</tr>
		</thead>
		<tbody>
			{#each positionLabelsList as labelList (labelList)}
				{@const [key, label] = labelList}
				{@const value = Number.parseFloat(formatNumeric(displayPosition[key]))}
				<tr>
					<th>{label}</th>
					<th>
						<NumericInput
							cx="max-w-[76px]"
							{value}
							on:change={(event) => {
								const inputValue = numberValueFromEvent(event) ?? 0
								handleAngleInputChange(key, inputValue)
							}}
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

				<span slot="description"> Will update the pose values but will not execute </span>
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
		onclick={() => moveToPosition(desiredPosition)}
	>
		Execute
	</Button>
	<ErrorDisplay {lastError} />
</div>
