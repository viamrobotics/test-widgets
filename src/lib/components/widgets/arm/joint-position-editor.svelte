<script lang="ts">
	import { mdiInformationOutline, mdiPlayCircleOutline } from '@mdi/js'
	import { type FieldState, FieldStates, Icon, Tooltip } from '@viamrobotics/prime-ui'

	import ResetToCurrentButton from '$lib/components/reset-to-current-button.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	import type { EditedTargets } from './use-edited-targets.svelte'

	import { isOutsideJointLimit, type JointLimit } from './joint-position-limits'
	import JointPositionSlider from './joint-position-slider.svelte'

	interface Props {
		targets: EditedTargets<number>
		positions: number[]
		jointLimitsDegrees: JointLimit[]
		useRadians: boolean
		moveToJointPositions: (jointPositions: number[]) => Promise<void>
		isMoving?: boolean
	}

	const {
		targets,
		positions,
		jointLimitsDegrees,
		useRadians,
		moveToJointPositions,
		isMoving = false,
	}: Props = $props()

	const DEFAULT_LIMIT_DEGREES = 180

	interface StatusIndicator {
		state: FieldState
		message: string
	}

	const quickSetLabelId = $props.id()

	const getSliderMin = (index: number): number =>
		jointLimitsDegrees[index]?.minDegrees ?? -DEFAULT_LIMIT_DEGREES
	const getSliderMax = (index: number): number =>
		jointLimitsDegrees[index]?.maxDegrees ?? DEFAULT_LIMIT_DEGREES

	const formatAngle = (degrees: number) =>
		useRadians ? `${formatNumeric(degreesToRadians(degrees))} rad` : `${formatNumeric(degrees)}°`

	// A typed target is never clamped, so a joint with known limits says so before Execute sends it.
	const limitIndicator = (index: number): StatusIndicator | undefined => {
		const limit = jointLimitsDegrees[index]
		if (!limit) return undefined
		if (!isOutsideJointLimit(targets.target(index), limit.minDegrees, limit.maxDegrees)) {
			return undefined
		}
		return {
			state: FieldStates.Error,
			message: `Joint ${index} is outside its limits, ${formatAngle(limit.minDegrees)} to ${formatAngle(limit.maxDegrees)}.`,
		}
	}

	const statusIndicator = (index: number): StatusIndicator | undefined => {
		const outsideLimit = limitIndicator(index)
		if (outsideLimit) return outsideLimit

		const drift = targets.drift(index)
		if (drift !== undefined) {
			return {
				state: FieldStates.Warn,
				message: `Arm moved ${formatAngle(drift)} since you edited joint ${index}.`,
			}
		}
		if (isMoving && targets.isEdited(index)) {
			return { state: FieldStates.Info, message: 'The arm is moving. Your edit is kept.' }
		}
		return undefined
	}

	const execute = async () => {
		try {
			await moveToJointPositions(positions.map((_, index) => targets.target(index)))
		} catch {
			// The parent renders the failure from the mutation's error state.
		}
	}

	const resetToZero = () => {
		for (const index of positions.keys()) {
			targets.edit(index, 0)
		}
	}
</script>

<div class="flex flex-col gap-2">
	{#each [...positions.keys()] as index (index)}
		{@const indicator = statusIndicator(index)}
		{@const current = formatAngle(positions[index] ?? 0)}
		<div class="flex flex-col gap-1">
			<Tooltip disabled={!indicator}>
				<Tooltip.Trigger class="block min-w-0">
					<JointPositionSlider
						label="Joint {index}"
						value={targets.target(index)}
						onValueChange={(degrees) => {
							targets.edit(index, degrees)
						}}
						minDegrees={getSliderMin(index)}
						maxDegrees={getSliderMax(index)}
						{useRadians}
						state={indicator?.state}
					>
						{#snippet trailing()}
							<ResetToCurrentButton
								label="joint {index}"
								{current}
								isEdited={targets.isEdited(index)}
								onreset={() => {
									targets.reset(index)
								}}
							/>
						{/snippet}
					</JointPositionSlider>
				</Tooltip.Trigger>
				<Tooltip.Content class="max-w-72">{indicator?.message}</Tooltip.Content>
			</Tooltip>
			{#if indicator}
				<!-- The tooltip is not in the page until it opens, and Slider takes no aria-describedby, so screen readers get the message here. -->
				<span class="sr-only">{indicator.message}</span>
			{/if}
		</div>
	{/each}
</div>

<div class="flex flex-col gap-1">
	<div class="flex items-center gap-1">
		<span
			id={quickSetLabelId}
			class="text-xs font-semibold"
		>
			Quick set
		</span>
		<Tooltip>
			<Tooltip.Trigger>
				<button
					type="button"
					class="icon-button size-6"
					aria-label="About Quick set"
				>
					<Icon
						icon={mdiInformationOutline}
						size="sm"
					/>
				</button>
			</Tooltip.Trigger>
			<Tooltip.Content>Will update the slider values but will not execute</Tooltip.Content>
		</Tooltip>
	</div>
	<div
		role="group"
		aria-labelledby={quickSetLabelId}
		class="flex flex-wrap gap-2"
	>
		<button
			type="button"
			class="button button-compact"
			onclick={resetToZero}
		>
			Zero
		</button>
		<button
			type="button"
			class="button button-compact"
			onclick={() => {
				targets.resetAll()
			}}
		>
			Current position
		</button>
	</div>
</div>

<div class="flex items-center gap-2">
	<button
		type="button"
		class="button button-dark button-compact"
		disabled={isMoving}
		onclick={execute}
	>
		<Icon
			icon={mdiPlayCircleOutline}
			size="sm"
		/>
		Execute
	</button>
	<span role="status">
		{#if isMoving}
			<span class="badge badge-success">Arm is moving</span>
		{/if}
	</span>
</div>
