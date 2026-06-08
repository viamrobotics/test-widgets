<script lang="ts">
	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import Table from '$lib/components/table.svelte'

	import { type JointLimit } from './joint-position-limits'
	import JointPositionSlider from './joint-position-slider.svelte'

	interface Props {
		desiredPositions: number[]
		positions: number[]
		jointLimitsDegrees: JointLimit[]
		useRadians: boolean
		moveToJointPositions: (jointPositions: number[]) => void
	}

	let {
		desiredPositions = $bindable(),
		positions,
		jointLimitsDegrees,
		useRadians,
		moveToJointPositions,
	}: Props = $props()

	const getSliderMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getSliderMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const execute = () => {
		moveToJointPositions([...desiredPositions])
	}

	const resetToZero = () => {
		desiredPositions = positions.map(() => 0)
	}

	const resetToCurrent = () => {
		desiredPositions = [...positions]
	}
</script>

<Table>
	<thead>
		<tr>
			<th>Joint</th>
			<th>Position ({useRadians ? 'radians' : 'degrees'})</th>
		</tr>
	</thead>
	<tbody>
		{#each [...desiredPositions.keys()] as index (index)}
			<tr>
				<th scope="row">{index}</th>
				<th>
					<JointPositionSlider
						bind:value={desiredPositions[index]}
						minDegrees={getSliderMin(index)}
						maxDegrees={getSliderMax(index)}
						{useRadians}
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
			<span slot="description">Will update the slider values but will not execute</span>
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
	onclick={execute}
>
	Execute
</Button>
