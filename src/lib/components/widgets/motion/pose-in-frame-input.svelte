<script
	lang="ts"
	module
>
	import type { Pose } from '@viamrobotics/sdk'

	const poseLabelsList = Object.entries({
		x: 'X',
		y: 'Y',
		z: 'Z',
		oX: 'OX',
		oY: 'OY',
		oZ: 'OZ',
		theta: 'θ',
	}) as [keyof Pose, string][]
</script>

<script lang="ts">
	import { Button, Icon, Input, Label, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'

	import { parsePastedPose } from './parse-pasted-pose'

	interface Props {
		referenceFrame: string
		pose: Pose
		onReferenceFrameChange: (frame: string) => void
		onPoseChange: (pose: Pose) => void
	}

	const { referenceFrame, pose, onReferenceFrameChange, onPoseChange }: Props = $props()

	let useRadians = $state(false)

	const displayPose = $derived({
		...pose,
		theta: useRadians ? degreesToRadians(pose.theta) : pose.theta,
	})

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

	const zero = () => {
		onPoseChange({ x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 0 })
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
			Destination pose
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>

				<span slot="description">
					The target pose expressed in the given reference frame. Translations are in millimeters.
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

	<Label>
		Reference frame

		<Input
			slot="input"
			value={referenceFrame}
			placeholder="world"
			on:input={(event) => {
				onReferenceFrameChange((event.target as HTMLInputElement).value)
			}}
		/>
	</Label>

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

	<div class="flex flex-col gap-2">
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
		<Button
			class="w-fit"
			onclick={zero}
		>
			Zero
		</Button>
	</div>
</div>
