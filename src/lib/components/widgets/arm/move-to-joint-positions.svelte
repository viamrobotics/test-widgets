<script lang="ts">
	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'
	import { Slider, ThemeUtils } from 'svelte-tweakpane-ui'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	import { type JointLimit } from './joint-position-limits'

	const INCREMENT_DEGREES = 5

	type ControlMode = 'jointPositions' | 'quickMove'

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
		lastError: Error | null
		jointLimitsDegrees: JointLimit[]
		isMoving?: boolean
	}

	const {
		positions,
		moveToJointPositions,
		lastError,
		jointLimitsDegrees,
		isMoving = false,
	}: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPositions = $state([...positions])
	let isUserControlled = $state(false)
	let useRadians = $state(false)
	let controlMode = $state<ControlMode>('jointPositions')

	const isQuickMoveMode = $derived(controlMode === 'quickMove')

	// Sync sliders to live arm positions when the user is not actively controlling them.
	$effect(() => {
		if (!isUserControlled) {
			desiredPositions = [...positions]
		}
	})

	const getSliderMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getSliderMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const displayPositions = $derived(desiredPositions.map((degrees) => toDisplayAngle(degrees)))
	const currentDisplayPositions = $derived(positions.map((degrees) => toDisplayAngle(degrees)))

	const copyData = $derived(`[${displayPositions.map((v) => formatNumeric(v)).join(', ')}]`)

	const sliderFormat = (value: number) => formatNumeric(value, 1)

	const toggleMode = () => {
		controlMode = isQuickMoveMode ? 'jointPositions' : 'quickMove'
	}

	const handleSliderInternalChange = () => {
		isUserControlled = true
	}

	/**
	 * After executing a move, keep user control briefly so the slider doesn't snap back
	 * to the stale live position before the arm has had time to reach the target.
	 */
	const releaseControlAfterDelay = () => {
		setTimeout(() => {
			isUserControlled = false
		}, 1500)
	}

	const quickMove = (index: number, increment: number) => {
		if (isMoving) {
			return
		}
		const clonedPositions = positions.map((position, positionIndex) =>
			positionIndex === index ? position + increment : position
		)
		moveToJointPositions(clonedPositions)
	}

	const execute = () => {
		moveToJointPositions([...desiredPositions])
		releaseControlAfterDelay()
	}

	const resetToZero = () => {
		desiredPositions = positions.map(() => 0)
		isUserControlled = true
	}

	const resetToCurrent = () => {
		isUserControlled = false
	}

	const handlePaste = (data: string): boolean => {
		try {
			const parsed = JSON.parse(data) as number[]
			desiredPositions = parsed.map((pos, i) =>
				Math.min(Math.max(pos, getSliderMin(i)), getSliderMax(i))
			)
			isUserControlled = true
		} catch {
			return false
		}
		return true
	}
</script>

<div class="flex min-w-0 flex-col gap-4">
	<!-- Controls header -->
	<div class="flex items-center justify-between">
		<span class="flex flex-row items-center gap-1 text-sm">
			Joint Positions
			<Tooltip>
				<Icon
					name="information-outline"
					cx="text-gray-6"
				/>
				<span slot="description">
					Joint position limits are based solely on the arm kinematics and do not take into account
					motion service limit overrides.
				</span>
			</Tooltip>
		</span>
		<div class="flex items-center gap-2">
			<div class="flex gap-1">
				{#if !isQuickMoveMode}
					<CopyButton data={copyData} />
					<PasteButton onPaste={handlePaste} />
				{/if}
				<AngleUnitToggle
					{useRadians}
					onToggle={() => {
						useRadians = !useRadians
					}}
				/>
			</div>
			<Tooltip>
				<button
					onclick={toggleMode}
					aria-label={isQuickMoveMode ? 'Exit quick move mode' : 'Enter quick move mode'}
					class={[
						'hover:border-medium hover:bg-medium active:bg-gray-2 rounded p-0.5',
						isQuickMoveMode ? 'text-cyan-600' : 'text-gray-6',
					]}
				>
					<Icon
						name="flash"
						size="xs"
					/>
				</button>
				<span slot="description">
					{isQuickMoveMode ? 'Exit quick move mode' : 'Enter quick move mode'}
				</span>
			</Tooltip>
		</div>
	</div>

	{#if isQuickMoveMode}
		<div class="flex flex-col gap-3">
			<Tooltip>
				<span class="flex items-center gap-1 text-xs text-amber-600">
					<Icon
						name="alert"
						size="sm"
						cx="text-amber-600"
					/>
					Quick move executes immediately
				</span>
				<span slot="description">
					Each ±5° button sends a move command as soon as it is pressed. Buttons are disabled while
					the arm is moving.
				</span>
			</Tooltip>

			{#each positions as position, index (index)}
				{@const currentValue = currentDisplayPositions[index] ?? position}
				{@const unit = useRadians ? ' rad' : '°'}
				<div class="flex items-center justify-between gap-2">
					<span class="text-xs text-gray-500">J{index}</span>
					<div class="flex items-center gap-1.5">
						<Button
							aria-label="Decrease joint {index} by 5 degrees"
							disabled={isMoving}
							onclick={() => quickMove(index, -INCREMENT_DEGREES)}
						>
							−5°
						</Button>
						<span class="min-w-[4rem] text-center text-xs tabular-nums text-gray-700">
							{formatNumeric(currentValue)}{unit}
						</span>
						<Button
							aria-label="Increase joint {index} by 5 degrees"
							disabled={isMoving}
							onclick={() => quickMove(index, INCREMENT_DEGREES)}
						>
							+5°
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each positions, index (index)}
				{@const min = getSliderMin(index)}
				{@const max = getSliderMax(index)}
				<div class="min-w-0">
					<Slider
						bind:value={desiredPositions[index]}
						label="Joint {index} position"
						{min}
						{max}
						step={0.1}
						format={sliderFormat}
						theme={ThemeUtils.presets.light}
						on:change={(e: CustomEvent<{ origin: string }>) => {
							if (e.detail.origin === 'internal') {
								handleSliderInternalChange()
							}
						}}
					/>
				</div>
			{/each}
		</div>

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
	{/if}

	<ErrorDisplay {lastError} />
</div>
