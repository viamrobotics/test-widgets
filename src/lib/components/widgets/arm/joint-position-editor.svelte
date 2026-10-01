<script lang="ts">
	import { Button, Icon, IconButton, Tooltip } from '@viamrobotics/prime-core'

	import StatusPill from '$lib/components/status-pill.svelte'
	import Table from '$lib/components/table.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	import type { EditedTargets } from './use-edited-targets.svelte'

	import { type JointLimit } from './joint-position-limits'
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

	interface StatusIndicator {
		status: 'info' | 'warn'
		message: string
	}

	const getSliderMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getSliderMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const formatAngle = (degrees: number) =>
		useRadians ? `${formatNumeric(degreesToRadians(degrees))} rad` : `${formatNumeric(degrees)}°`

	const statusIndicator = (index: number): StatusIndicator | undefined => {
		const drift = targets.drift(index)
		if (drift !== undefined) {
			return {
				status: 'warn',
				message: `Arm moved ${formatAngle(drift)} since you edited joint ${index}.`,
			}
		}
		if (isMoving && targets.isEdited(index)) {
			return { status: 'info', message: 'The arm is moving. Your edit is kept.' }
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

<Table>
	<thead>
		<tr>
			<th>Joint</th>
			<th>Position ({useRadians ? 'radians' : 'degrees'})</th>
		</tr>
	</thead>
	<tbody>
		{#each [...positions.keys()] as index (index)}
			{@const indicator = statusIndicator(index)}
			<tr>
				<th scope="row">{index}</th>
				<th>
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center gap-1">
							<div class="min-w-0 grow">
								<JointPositionSlider
									value={targets.target(index)}
									onValueChange={(degrees) => {
										targets.edit(index, degrees)
									}}
									minDegrees={getSliderMin(index)}
									maxDegrees={getSliderMax(index)}
									{useRadians}
								/>
							</div>
							{#if indicator}
								<Tooltip>
									<Icon
										name={indicator.status === 'warn' ? 'alert' : 'information'}
										cx={indicator.status === 'warn' ? 'text-warning-bright' : 'text-info-dark'}
									/>
									<span slot="description">{indicator.message}</span>
								</Tooltip>
								<!-- The tweakpane slider takes no aria-describedby, so screen readers get the message here. -->
								<span class="sr-only">{indicator.message}</span>
							{/if}
							{#if targets.isEdited(index)}
								<Tooltip>
									<IconButton
										icon="backup-restore"
										label="Reset joint {index} to current"
										onclick={() => {
											targets.reset(index)
										}}
									/>
									<span slot="description">Reset joint {index} to its current value</span>
								</Tooltip>
							{/if}
						</div>
						<span class="text-subtle-2 font-roboto-mono text-xs font-normal">
							Current {formatAngle(positions[index] ?? 0)}
						</span>
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
			<span slot="description">Will update the slider values but will not execute</span>
		</Tooltip>
	</span>
	<div class="flex flex-col gap-2 sm:flex-row">
		<Button onclick={resetToZero}>Zero</Button>
		<Button
			onclick={() => {
				targets.resetAll()
			}}
		>
			Current position
		</Button>
	</div>
</div>

<div class="mt-auto flex items-center gap-2">
	<Button
		class="w-fit"
		icon="play-circle-outline"
		variant="dark"
		disabled={isMoving}
		onclick={execute}
	>
		Execute
	</Button>
	<span role="status">
		{#if isMoving}
			<StatusPill
				isActive
				activeText="Arm is moving"
			/>
		{/if}
	</span>
</div>
