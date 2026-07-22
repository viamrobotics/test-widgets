<script
	lang="ts"
	module
>
	import type { Pose } from '@viamrobotics/sdk'

	const poseLabelsList: [keyof Pose, string][] = [
		['x', 'X'],
		['y', 'Y'],
		['z', 'Z'],
		['oX', 'OX'],
		['oY', 'OY'],
		['oZ', 'OZ'],
		['theta', 'θ'],
	]
</script>

<script lang="ts">
	import { Icon, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'
	import { parsePastedPose } from '$lib/parse-pasted-pose'

	interface Props {
		pose: Pose
		onPoseChange: (pose: Pose) => void
		/** Heading shown above the input table. */
		title: string
		/** Optional info-tooltip text shown next to the title. */
		description?: string
	}

	const { pose, onPoseChange, title, description }: Props = $props()

	let useRadians = $state(false)

	const displayPose = $derived({
		...pose,
		theta: useRadians ? degreesToRadians(pose.theta) : pose.theta,
	})

	// Copy the stored pose (theta in degrees) so it round-trips through paste
	// regardless of the display unit currently selected.
	const copyData = $derived(JSON.stringify(pose))

	const handlePaste = (data: string): boolean => {
		const parsed = parsePastedPose(data)
		if (!parsed) {
			return false
		}
		onPoseChange(parsed)
		return true
	}

	const handleValueChange = (key: keyof Pose, inputValue: number) => {
		const nextValue = key === 'theta' && useRadians ? radiansToDegrees(inputValue) : inputValue
		onPoseChange({ ...pose, [key]: nextValue })
	}

	const poseUnits = $derived({
		x: 'mm',
		y: 'mm',
		z: 'mm',
		oX: '',
		oY: '',
		oZ: '',
		theta: useRadians ? 'rad' : 'deg',
	})
</script>

<div class="flex min-w-0 flex-col gap-4">
	<div class="flex items-center justify-between">
		<span class="flex flex-row items-center gap-1 text-sm">
			{title}
			{#if description}
				<Tooltip>
					<Icon
						name="information-outline"
						cx="text-gray-6"
					/>

					<span slot="description">{description}</span>
				</Tooltip>
			{/if}
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
				<th>Pose</th>
				<th>Value</th>
			</tr>
		</thead>
		<tbody>
			{#each poseLabelsList as labelList (labelList)}
				{@const [key, label] = labelList}
				{@const value = Number.parseFloat(formatNumeric(displayPose[key]))}
				<tr>
					<th>
						<span class="relative inline-flex justify-center">
							{label}
							<abbr class="text-subtle-2 absolute left-full ml-1">{poseUnits[key]}</abbr>
						</span>
					</th>
					<th>
						<NumericInput
							cx="max-w-[76px]"
							{value}
							on:change={(event) => {
								handleValueChange(key, numberValueFromEvent(event) ?? 0)
							}}
						/>
					</th>
				</tr>
			{/each}
		</tbody>
	</Table>
</div>
