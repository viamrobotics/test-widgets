<script lang="ts">
	import { mdiAlert, mdiInformationOutline } from '@mdi/js'
	import { Select } from '@viamrobotics/prime-controls'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	import { degreesToRadians, formatNumeric } from '$lib/format'

	import type { JointLimit } from './joint-position-limits'

	import {
		type JogJointRange,
		type JogQueueEntry,
		type JogQueueStatus,
		jogTargetDegrees,
		useJogQueue,
	} from './useJogQueue.svelte'

	const JOG_STEP_OPTIONS_DEGREES = [1, 5, 10, 15] as const
	type JogStepDegrees = (typeof JOG_STEP_OPTIONS_DEGREES)[number]
	const DEFAULT_JOG_STEP_DEGREES: JogStepDegrees = 5
	const JOG_STEP_ITEMS = JOG_STEP_OPTIONS_DEGREES.map((step) => ({
		value: String(step),
		label: `${step}°`,
	}))

	type JogDirection = 'decrease' | 'increase'

	// Queued and sending share the pending color. Sending adds progress dots, so the two still read apart.
	const STATUS_BADGE_CLASSES: Record<JogQueueStatus, string> = {
		queuing: 'badge-pending',
		sending: 'badge-pending',
		sent: 'badge-success',
		failed: 'badge-danger',
	}

	interface Props {
		positions: number[]
		/** Per-joint limits a jog target is clamped to. A joint with no entry is not clamped. */
		jointLimitsDegrees: JointLimit[]
		useRadians: boolean
		isMoving: boolean
		/** Sends the move. Rejects when it fails. */
		moveToJointPositions: (jointPositions: number[]) => Promise<void>
	}

	const { positions, jointLimitsDegrees, useRadians, isMoving, moveToJointPositions }: Props =
		$props()

	const instanceId = $props.id()
	const jogStepLabelId = `${instanceId}-jog-step`
	const jointLabelId = (jointIndex: number) => `${instanceId}-joint-${jointIndex}`

	let jogStepDegrees = $state<JogStepDegrees>(DEFAULT_JOG_STEP_DEGREES)

	const queue = useJogQueue({
		send: (targetsByJoint) =>
			moveToJointPositions(
				positions.map((position, index) => targetsByJoint.get(index) ?? position)
			),
	})

	$effect(() => queue.dispose)

	const isJointDisabled = (jointIndex: number) =>
		isMoving || queue.entryFor(jointIndex)?.status === 'sending'

	const angleSuffix = $derived(useRadians ? 'rad' : '°')

	const formatAngleValue = (degrees: number) =>
		formatNumeric(useRadians ? degreesToRadians(degrees) : degrees)

	const formatAngle = (degrees: number) =>
		`${formatAngleValue(degrees)}${useRadians ? ` ${angleSuffix}` : angleSuffix}`

	const rangeFor = (jointIndex: number): JogJointRange => ({
		startDegrees: positions[jointIndex] ?? 0,
		minDegrees: jointLimitsDegrees[jointIndex]?.minDegrees ?? Number.NEGATIVE_INFINITY,
		maxDegrees: jointLimitsDegrees[jointIndex]?.maxDegrees ?? Number.POSITIVE_INFINITY,
	})

	const stepFor = (direction: JogDirection) =>
		direction === 'decrease' ? -jogStepDegrees : jogStepDegrees

	const selectStep = (next: string | undefined) => {
		const selected = Number(next)
		const step = JOG_STEP_OPTIONS_DEGREES.find((option) => option === selected)
		if (step !== undefined) jogStepDegrees = step
	}

	const handlePointerDown = (event: PointerEvent, jointIndex: number, direction: JogDirection) => {
		if (isJointDisabled(jointIndex) || event.button !== 0) return

		queue.beginHold(jointIndex, stepFor(direction), rangeFor(jointIndex))
	}

	// Keyboard and assistive-technology activation arrive as a click with `detail` 0. Pointer
	// clicks are already counted by the pointer handlers, so they are skipped here.
	const handleClick = (event: MouseEvent, jointIndex: number, direction: JogDirection) => {
		if (isJointDisabled(jointIndex) || event.detail !== 0) return

		queue.tap(jointIndex, stepFor(direction), rangeFor(jointIndex))
	}

	const formatTarget = (entry: JogQueueEntry) => formatAngle(jogTargetDegrees(entry))

	const describeEntry = (entry: JogQueueEntry) => {
		const target = formatTarget(entry)
		switch (entry.status) {
			case 'queuing': {
				return `Joint ${entry.jointIndex} will move to ${target}`
			}
			case 'sending': {
				return `Moving joint ${entry.jointIndex} to ${target}`
			}
			case 'sent': {
				return `Joint ${entry.jointIndex} moved to ${target}`
			}
			case 'failed': {
				return `Move of joint ${entry.jointIndex} to ${target} failed`
			}
			default: {
				const exhaustive: never = entry.status
				return exhaustive
			}
		}
	}
</script>

{#snippet jogButton(jointIndex: number, direction: JogDirection)}
	<button
		type="button"
		class="button button-xs font-roboto-mono"
		aria-label="Joint {jointIndex}, {direction === 'decrease'
			? 'minus'
			: 'plus'} {jogStepDegrees} degrees"
		disabled={isJointDisabled(jointIndex)}
		onpointerdown={(event) => handlePointerDown(event, jointIndex, direction)}
		onpointerup={queue.endHold}
		onpointerleave={queue.endHold}
		onpointercancel={queue.endHold}
		onclick={(event) => handleClick(event, jointIndex, direction)}
	>
		{direction === 'decrease' ? '−' : '+'}{jogStepDegrees}°
	</button>
{/snippet}

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<span
			id={jogStepLabelId}
			class="text-xs font-semibold"
		>
			Jog step
		</span>
		<div class="w-20">
			<Select
				items={JOG_STEP_ITEMS}
				aria-labelledby={jogStepLabelId}
				bind:value={() => String(jogStepDegrees), selectStep}
			/>
		</div>
	</div>
	<div class="flex items-center gap-1">
		<p class="text-warning-text flex items-center gap-1 text-xs">
			<Icon
				icon={mdiAlert}
				size="sm"
			/>
			Jogging executes immediately on release
		</p>
		<Tooltip>
			<Tooltip.Trigger>
				<button
					type="button"
					class="icon-button size-6"
					aria-label="About jogging"
				>
					<Icon
						icon={mdiInformationOutline}
						size="sm"
					/>
				</button>
			</Tooltip.Trigger>
			<Tooltip.Content class="max-w-72">
				Tap or hold a jog button to step its joint. Jog buttons send a move to the arm as soon as
				you release them. There is no confirm step. Buttons are disabled while the arm is moving.
			</Tooltip.Content>
		</Tooltip>
	</div>
</div>

<ul class="divide-gray-3 flex flex-col divide-y">
	{#each positions as position, index (index)}
		{@const entry = queue.entryFor(index)}
		<!-- flex-wrap with a stepper that keeps its min-content width: it drops under the label only when the row is too narrow for both. -->
		<li class="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5">
			<span
				id={jointLabelId(index)}
				class="font-roboto-mono text-subtle-1 w-14 shrink-0 text-xs"
			>
				Joint {index}
			</span>
			<div
				role="group"
				aria-labelledby={jointLabelId(index)}
				class="flex flex-1 items-center gap-1.5"
			>
				{@render jogButton(index, 'decrease')}
				<!-- The badge takes the readout's grid cell, so the row keeps one width while a step is pending. -->
				<span class="grid min-w-20 flex-1 place-items-center">
					<!-- Mounted in every row, empty while idle, so a screen reader is already watching it when a step starts. -->
					<span
						role="status"
						class="col-start-1 row-start-1"
					>
						{#if entry}
							<span
								aria-hidden="true"
								class={['badge font-roboto-mono tabular-nums', STATUS_BADGE_CLASSES[entry.status]]}
							>
								{#if entry.status === 'sending'}
									<span class="progress-dots"></span>
								{/if}
								{formatTarget(entry)}
							</span>
							<span class="sr-only">{describeEntry(entry)}</span>
						{/if}
					</span>
					{#if !entry}
						<span
							class="font-roboto-mono text-default col-start-1 row-start-1 inline-flex items-baseline gap-1 text-xs tabular-nums"
							><span>{formatAngleValue(position)}</span><span class="text-subtle-2"
								>{angleSuffix}</span
							></span
						>
					{/if}
				</span>
				{@render jogButton(index, 'increase')}
			</div>
		</li>
	{/each}
</ul>
