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

	export interface PoseFieldStatus {
		current: number
		isEdited: boolean
		drift: number | undefined
		isMoving: boolean
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon, IconButton, NumericInput, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import Table from '$lib/components/table.svelte'
	import { numberValueFromEvent } from '$lib/event-handlers'
	import { degreesToRadians, formatNumeric, radiansToDegrees } from '$lib/format'
	import { parsePastedPose } from '$lib/parse-pasted-pose'

	interface Props {
		pose: Pose
		heading: Snippet
		onPoseChange: (pose: Pose) => void
		description?: Snippet
		fieldStatus?: (key: keyof Pose) => PoseFieldStatus
		onFieldReset?: (key: keyof Pose) => void
	}

	const { pose, heading, description, fieldStatus, onFieldReset, onPoseChange }: Props = $props()

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

	const toDisplay = (key: keyof Pose, value: number) =>
		key === 'theta' && useRadians ? degreesToRadians(value) : value

	interface StatusIndicator {
		status: 'info' | 'warn'
		message: string
	}

	const statusIndicator = (
		key: keyof Pose,
		label: string,
		status: PoseFieldStatus | undefined
	): StatusIndicator | undefined => {
		if (status?.drift !== undefined) {
			const unit = poseUnits[key] ? ` ${poseUnits[key]}` : ''
			const amount = formatNumeric(toDisplay(key, status.drift))
			return { status: 'warn', message: `Arm moved ${amount}${unit} since you edited ${label}.` }
		}
		if (status?.isEdited && status.isMoving) {
			return { status: 'info', message: 'The arm is moving. Your edit is kept.' }
		}
		return undefined
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<div class="flex items-center justify-between">
		<span class="flex flex-row items-center gap-1 text-sm">
			{@render heading()}
			{#if description}
				<Tooltip>
					<Icon
						name="information-outline"
						cx="text-gray-6"
					/>

					<span slot="description">{@render description()}</span>
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
				{@const status = fieldStatus?.(key)}
				{@const indicator = statusIndicator(key, label, status)}
				<tr>
					<th>
						<span class="relative inline-flex justify-center">
							{label}
							<abbr class="text-subtle-2 absolute left-full ml-1">{poseUnits[key]}</abbr>
						</span>
					</th>
					<th>
						<div class="flex flex-col items-center gap-1 pt-2">
							<div class="relative w-24">
								<Tooltip
									state={indicator ? undefined : 'invisible'}
									targetClass="block"
									let:tooltipID
								>
									<NumericInput
										cx={['max-w-24', indicator && 'pr-7']}
										{value}
										state={indicator?.status}
										aria-label="{label} target"
										aria-describedby={indicator ? tooltipID : undefined}
										on:change={(event) => {
											handleValueChange(key, numberValueFromEvent(event) ?? 0)
										}}
									/>
									<span slot="description">{indicator?.message}</span>
								</Tooltip>
								{#if status?.isEdited && onFieldReset}
									<span class="absolute top-1/2 left-full ml-1 -translate-y-1/2">
										<Tooltip>
											<IconButton
												icon="backup-restore"
												label="Reset {label} to current"
												onclick={() => {
													onFieldReset(key)
												}}
											/>
											<span slot="description">Reset {label} to its current value</span>
										</Tooltip>
									</span>
								{/if}
							</div>
							{#if status}
								<span class="text-subtle-2 font-roboto-mono text-xs font-normal">
									Current {formatNumeric(toDisplay(key, status.current))}
								</span>
							{/if}
						</div>
					</th>
				</tr>
			{/each}
		</tbody>
	</Table>
</div>
