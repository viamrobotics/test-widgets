<script lang="ts">
	import {
		Badge,
		Button,
		Icon,
		type IconName,
		Label,
		Select,
		Tooltip,
	} from '@viamrobotics/prime-core'

	import { degreesToRadians, formatNumeric } from '$lib/format'

	import {
		type JogQueueEntry,
		type JogQueueStatus,
		jogTargetDegrees,
		useJogQueue,
	} from './useJogQueue.svelte'

	const JOG_STEP_OPTIONS_DEGREES = [1, 5, 10, 15] as const
	type JogStepDegrees = (typeof JOG_STEP_OPTIONS_DEGREES)[number]
	const DEFAULT_JOG_STEP_DEGREES: JogStepDegrees = 5

	type JogDirection = 'decrease' | 'increase'

	interface StatusBadge {
		variant: 'pending' | 'progress' | 'success' | 'danger'
		icon?: IconName
	}

	const STATUS_BADGES: Record<JogQueueStatus, StatusBadge> = {
		queuing: { variant: 'pending' },
		sending: { variant: 'progress' },
		sent: { variant: 'success' },
		failed: { variant: 'danger' },
	}

	interface Props {
		positions: number[]
		useRadians: boolean
		isMoving: boolean
		/** Sends the move. Rejects when it fails. */
		moveToJointPositions: (jointPositions: number[]) => Promise<void>
	}

	const { positions, useRadians, isMoving, moveToJointPositions }: Props = $props()

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

	const formatAngle = (degrees: number) =>
		useRadians ? `${formatNumeric(degreesToRadians(degrees))} rad` : `${formatNumeric(degrees)}°`

	const positionOf = (jointIndex: number) => positions[jointIndex] ?? 0

	const stepFor = (direction: JogDirection) =>
		direction === 'decrease' ? -jogStepDegrees : jogStepDegrees

	const handleStepChange = (event: Event) => {
		if (!(event.target instanceof HTMLSelectElement)) return

		const selected = Number(event.target.value)
		const step = JOG_STEP_OPTIONS_DEGREES.find((option) => option === selected)
		if (step !== undefined) jogStepDegrees = step
	}

	const handlePointerDown = (event: PointerEvent, jointIndex: number, direction: JogDirection) => {
		if (isJointDisabled(jointIndex) || event.button !== 0) return

		queue.beginHold(jointIndex, stepFor(direction), positionOf(jointIndex))
	}

	// Keyboard and assistive-technology activation arrive as a click with `detail` 0. Pointer
	// clicks are already counted by the pointer handlers, so they are skipped here.
	const handleClick = (event: MouseEvent, jointIndex: number, direction: JogDirection) => {
		if (isJointDisabled(jointIndex) || event.detail !== 0) return

		queue.tap(jointIndex, stepFor(direction), positionOf(jointIndex))
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
	<Tooltip
		hoverDelayMS={400}
		targetClass="inline-flex"
	>
		<Button
			aria-label="{direction === 'decrease'
				? 'Decrease'
				: 'Increase'} joint {jointIndex} by {jogStepDegrees} degrees"
			disabled={isJointDisabled(jointIndex)}
			onpointerdown={(event) => handlePointerDown(event, jointIndex, direction)}
			onpointerup={queue.endHold}
			onpointerleave={queue.endHold}
			onpointercancel={queue.endHold}
			onclick={(event) => handleClick(event, jointIndex, direction)}
		>
			{direction === 'decrease' ? '−' : '+'}{jogStepDegrees}°
		</Button>
		<span slot="description">
			Tap or hold to {direction === 'decrease' ? 'subtract' : 'add'}
			{jogStepDegrees}°
		</span>
	</Tooltip>
{/snippet}

<div class="flex flex-col gap-x-4 gap-y-2">
	<Label position="left">
		<span class="w-12"> Jog step</span>
		<Select
			slot="input"
			value={String(jogStepDegrees)}
			on:change={handleStepChange}
		>
			{#each JOG_STEP_OPTIONS_DEGREES as step (step)}
				<option value={String(step)}>{step}°</option>
			{/each}
		</Select>
	</Label>
	<Tooltip>
		<span class="flex items-center gap-1 text-xs text-amber-600">
			<Icon
				name="alert"
				size="sm"
				cx="text-amber-600"
			/>
			Jogging executes immediately on release
		</span>
		<span slot="description">
			Jog buttons send a move to the arm as soon as you release them. There is no confirm step.
			Buttons are disabled while the arm is moving.
		</span>
	</Tooltip>
</div>

<ul class="flex flex-col divide-y">
	{#each positions as position, index (index)}
		{@const entry = queue.entryFor(index)}
		<!-- flex-wrap with a stepper that keeps its min-content width: it drops under the label only when the row is too narrow for both. -->
		<li class="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5">
			<span class="font-roboto-mono text-subtle-1 w-14 shrink-0 text-xs">Joint {index}</span>
			<div class="flex flex-1 items-center gap-1.5">
				{@render jogButton(index, 'decrease')}
				<!-- The badge overlays the readout so the row keeps one width in the narrow three-column card. -->
				<span class="grid min-w-20 flex-1 items-center justify-center">
					{#if entry}
						<span
							role="status"
							class="row-start-1l col-start-1"
						>
							<span aria-hidden="true">
								<Badge
									label={formatTarget(entry)}
									cx="font-roboto-mono tabular-nums"
									{...STATUS_BADGES[entry.status]}
								/>
							</span>
							<span class="sr-only">{describeEntry(entry)}</span>
						</span>
					{:else}
						<span class="font-roboto-mono col-start-1 row-start-1 text-xs tabular-nums">
							{formatAngle(position)}
						</span>
					{/if}
				</span>
				{@render jogButton(index, 'increase')}
			</div>
		</li>
	{/each}
</ul>
