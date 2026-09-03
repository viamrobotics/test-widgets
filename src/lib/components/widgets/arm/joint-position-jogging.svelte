<script lang="ts">
	import { Button, Icon, Label, Progress, Select, Tooltip } from '@viamrobotics/prime-core'

	import Table from '$lib/components/table.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	import { type JogDirection, type JogQueueEntry, useJogQueue } from './useJogQueue.svelte'

	const JOG_STEP_OPTIONS_DEGREES = [1, 5, 10, 15] as const
	type JogStepDegrees = (typeof JOG_STEP_OPTIONS_DEGREES)[number]
	const DEFAULT_JOG_STEP_DEGREES: JogStepDegrees = 5

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
		send: (jointIndex, deltaDegrees) =>
			moveToJointPositions(
				positions.map((position, index) =>
					index === jointIndex ? position + deltaDegrees : position
				)
			),
	})

	$effect(() => queue.dispose)

	const isSending = $derived(queue.entry?.status === 'sending')
	const isDisabled = $derived(isMoving || isSending)

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)
	const currentDisplayPositions = $derived(positions.map((degrees) => toDisplayAngle(degrees)))

	const stepFor = (direction: JogDirection) =>
		direction === 'decrease' ? -jogStepDegrees : jogStepDegrees

	const handleStepChange = (event: Event) => {
		if (!(event.target instanceof HTMLSelectElement)) return

		const selected = Number(event.target.value)
		const step = JOG_STEP_OPTIONS_DEGREES.find((option) => option === selected)
		if (step !== undefined) jogStepDegrees = step
	}

	const handlePointerDown = (event: PointerEvent, jointIndex: number, direction: JogDirection) => {
		if (isDisabled || event.button !== 0) return

		queue.beginHold(jointIndex, stepFor(direction))
	}

	// Keyboard and assistive-technology activation arrive as a click with `detail` 0. Pointer
	// clicks are already counted by the pointer handlers, so they are skipped here.
	const handleClick = (event: MouseEvent, jointIndex: number, direction: JogDirection) => {
		if (isDisabled || event.detail !== 0) return

		queue.tap(jointIndex, stepFor(direction))
	}

	const isAnchoredTo = (
		entry: JogQueueEntry | undefined,
		jointIndex: number,
		direction: JogDirection
	) => entry?.jointIndex === jointIndex && entry.anchor === direction

	const formatSignedDegrees = (degrees: number) => {
		if (degrees < 0) return `−${Math.abs(degrees)}°`
		return degrees > 0 ? `+${degrees}°` : '0°'
	}

	const describeEntry = (entry: JogQueueEntry | undefined) => {
		if (!entry) return ''

		const amount = formatSignedDegrees(entry.deltaDegrees)
		switch (entry.status) {
			case 'queuing': {
				return `Queued ${amount} for joint ${entry.jointIndex}`
			}
			case 'sending': {
				return `Sending ${amount} to joint ${entry.jointIndex}`
			}
			case 'sent': {
				return `Moved joint ${entry.jointIndex} by ${amount}`
			}
			case 'failed': {
				return `Move of ${amount} on joint ${entry.jointIndex} failed`
			}
			default: {
				const exhaustive: never = entry.status
				return exhaustive
			}
		}
	}

	const announcement = $derived(describeEntry(queue.entry))
</script>

{#snippet queueStatus(entry: JogQueueEntry)}
	{#if entry.status === 'sending'}
		<Progress variant="light" />
	{:else if entry.status === 'sent'}
		<Icon
			name="check"
			size="sm"
		/>
	{:else if entry.status === 'failed'}
		<Icon
			name="alert-circle-outline"
			size="sm"
		/>
	{:else}
		<span class="font-roboto-mono tabular-nums">{formatSignedDegrees(entry.deltaDegrees)}</span>
	{/if}
{/snippet}

{#snippet jogButton(jointIndex: number, direction: JogDirection)}
	{@const entry = queue.entry}
	{@const isAnchor = isAnchoredTo(entry, jointIndex, direction)}
	<Tooltip
		location="top"
		state={isAnchor ? 'visible' : 'invisible'}
		targetClass="inline-flex"
	>
		<Button
			aria-label="{direction === 'decrease'
				? 'Decrease'
				: 'Increase'} joint {jointIndex} by {jogStepDegrees} degrees"
			disabled={isDisabled}
			onpointerdown={(event) => handlePointerDown(event, jointIndex, direction)}
			onpointerup={queue.endHold}
			onpointerleave={queue.endHold}
			onpointercancel={queue.endHold}
			onclick={(event) => handleClick(event, jointIndex, direction)}
		>
			{direction === 'decrease' ? '−' : '+'}{jogStepDegrees}°
		</Button>
		<span slot="description">
			{#if entry && isAnchor}
				{@render queueStatus(entry)}
			{/if}
		</span>
	</Tooltip>
{/snippet}

<div class="flex flex-wrap items-center justify-between gap-2">
	<Label
		position="top"
		cx="w-auto"
	>
		Jog amount
		<Select
			slot="input"
			cx="w-20"
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
			Jogging moves the arm on release
		</span>
		<span slot="description">
			Each press queues one jog amount. Holding a button keeps adding to it. The total is sent as a
			single move shortly after you release. Buttons are disabled while the arm is moving.
		</span>
	</Tooltip>
</div>

<Table>
	<thead>
		<tr>
			<th>Joint</th>
			<th>Move (degrees)</th>
		</tr>
	</thead>
	<tbody>
		{#each positions as position, index (index)}
			{@const currentValue = currentDisplayPositions[index] ?? position}
			{@const unit = useRadians ? ' rad' : '°'}
			<tr>
				<th scope="row">{index}</th>
				<th>
					<div class="flex h-full max-h-6.5 w-full items-center justify-center gap-1.5">
						{@render jogButton(index, 'decrease')}
						<span class="min-w-16 grow text-center text-xs text-gray-700 tabular-nums">
							{formatNumeric(currentValue)}{unit}
						</span>
						{@render jogButton(index, 'increase')}
					</div>
				</th>
			</tr>
		{/each}
	</tbody>
</Table>

<span
	class="sr-only"
	aria-live="polite"
>
	{announcement}
</span>
