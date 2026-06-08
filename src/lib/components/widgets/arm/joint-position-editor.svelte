<script lang="ts">
	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import CopyButton from '$lib/components/copy-button.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import Table from '$lib/components/table.svelte'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'
	import PortalTarget from '$lib/PortalTarget.svelte'

	import { type JointLimit } from './joint-position-limits'
	import JointPositionSlider from './joint-position-slider.svelte'

	interface Props {
		positions: number[]
		jointLimitsDegrees: JointLimit[]
		useRadians: boolean
		moveToJointPositions: (jointPositions: number[]) => void
	}

	let { positions, jointLimitsDegrees, useRadians, moveToJointPositions }: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPositions = $state([...positions])

	const getSliderMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getSliderMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const displayPositions = $derived(desiredPositions.map((degrees) => toDisplayAngle(degrees)))
	const copyData = $derived(`[${displayPositions.map((v) => formatNumeric(v)).join(', ')}]`)

	const handlePaste = (data: string): boolean => {
		try {
			const parsed = JSON.parse(data) as number[]
			desiredPositions = parsed.map((pos, i) => {
				const degrees = useRadians ? radiansToDegrees(pos) : pos
				return Math.min(Math.max(degrees, getSliderMin(i)), getSliderMax(i))
			})
		} catch {
			return false
		}
		return true
	}

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

<PortalTarget name="widget-buttons">
	<CopyButton data={copyData} />
	<PasteButton onPaste={handlePaste} />
</PortalTarget>
