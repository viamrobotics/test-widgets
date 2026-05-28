<script lang="ts">
	import { Button, Icon, Tooltip } from '@viamrobotics/prime-core'

	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import PasteButton from '$lib/components/paste-button.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	import { type JointLimit } from './joint-position-limits'

	const SAFE_THRESHOLD_DEGREES = 5
	const INCREMENT_DEGREES = 5

	interface Props {
		positions: number[]
		moveToJointPositions: (jointPositions: number[]) => void
		lastError: Error | null
		jointLimitsDegrees: JointLimit[]
	}

	const { positions, moveToJointPositions, lastError, jointLimitsDegrees }: Props = $props()

	// svelte-ignore state_referenced_locally
	let desiredPositions = $state([...positions])
	let isUserControlled = $state(false)
	let pendingLargeMovesPerJoint = $state<boolean[]>([])
	let useRadians = $state(false)

	// Sync sliders to live arm positions when the user is not actively controlling them.
	// This is intentional state synchronization (not derivation), so $effect is appropriate here.
	$effect(() => {
		if (!isUserControlled) {
			desiredPositions = [...positions]
		}
	})

	const getSliderMin = (index: number): number => jointLimitsDegrees[index]?.minDegrees ?? -180
	const getSliderMax = (index: number): number => jointLimitsDegrees[index]?.maxDegrees ?? 180

	const toDisplayAngle = (degrees: number) => (useRadians ? degreesToRadians(degrees) : degrees)

	const displayPositions = $derived(desiredPositions.map(toDisplayAngle))

	const copyData = $derived(`[${displayPositions.map((v) => formatNumeric(v)).join(', ')}]`)

	const hasPendingLargeMoves = $derived(pendingLargeMovesPerJoint.some(Boolean))

	const handleSliderInput = (index: number, event: Event) => {
		isUserControlled = true
		desiredPositions[index] = Number((event.target as HTMLInputElement).value)
	}

	/**
	 * After executing a move, keep user control briefly so the slider doesn't snap back
	 * to the stale live position before the arm has had time to reach the target.
	 */
	const releaseControlAfterDelay = () => {
		setTimeout(() => {
			if (!pendingLargeMovesPerJoint.some(Boolean)) {
				isUserControlled = false
			}
		}, 1500)
	}

	const handleSliderChange = (index: number) => {
		const delta = Math.abs((desiredPositions[index] ?? 0) - (positions[index] ?? 0))
		if (delta > SAFE_THRESHOLD_DEGREES) {
			pendingLargeMovesPerJoint[index] = true
		} else {
			pendingLargeMovesPerJoint[index] = false
			moveToJointPositions([...desiredPositions])
			releaseControlAfterDelay()
		}
	}

	const adjustJoint = (index: number, delta: number) => {
		const min = getSliderMin(index)
		const max = getSliderMax(index)
		isUserControlled = true
		desiredPositions[index] = Math.min(Math.max((desiredPositions[index] ?? 0) + delta, min), max)
		handleSliderChange(index)
	}

	const dismissWarning = (index: number) => {
		pendingLargeMovesPerJoint[index] = false
		desiredPositions[index] = positions[index] ?? 0
		if (!pendingLargeMovesPerJoint.some(Boolean)) {
			isUserControlled = false
		}
	}

	const execute = () => {
		moveToJointPositions([...desiredPositions])
		pendingLargeMovesPerJoint = positions.map(() => false)
		releaseControlAfterDelay()
	}

	const resetToZero = () => {
		desiredPositions = positions.map(() => 0)
		isUserControlled = true
		pendingLargeMovesPerJoint = positions.map((pos) => Math.abs(pos) > SAFE_THRESHOLD_DEGREES)
	}

	const resetToCurrent = () => {
		pendingLargeMovesPerJoint = positions.map(() => false)
		isUserControlled = false
	}

	const handlePaste = (data: string): boolean => {
		try {
			const parsed = JSON.parse(data) as number[]
			const clamped = parsed.map((pos, i) =>
				Math.min(Math.max(pos, getSliderMin(i)), getSliderMax(i))
			)
			desiredPositions = clamped
			pendingLargeMovesPerJoint = clamped.map((pos, i) =>
				Math.abs(pos - (positions[i] ?? 0)) > SAFE_THRESHOLD_DEGREES
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

	<!-- Per-joint sliders -->
	<div class="flex flex-col gap-3">
		{#each { length: positions.length } as _, index}
			{@const min = getSliderMin(index)}
			{@const max = getSliderMax(index)}
			{@const hasWarning = pendingLargeMovesPerJoint[index] ?? false}
			{@const delta = (desiredPositions[index] ?? 0) - (positions[index] ?? 0)}
			{@const displayValue = displayPositions[index] ?? 0}
			{@const unit = useRadians ? ' rad' : '°'}

			<div class="flex flex-col gap-0.5">
				<div class="flex items-center gap-2">
					<span class="w-8 shrink-0 text-right text-xs text-gray-500">J{index}</span>
					<button
						aria-label="Decrease joint {index} by 5 degrees"
						class="shrink-0 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
						onclick={() => adjustJoint(index, -INCREMENT_DEGREES)}
					>
						−5°
					</button>
					<input
						type="range"
						class="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-gray-800"
						aria-label="Joint {index} position"
						{min}
						{max}
						step="0.1"
						value={desiredPositions[index] ?? 0}
						oninput={(e) => handleSliderInput(index, e)}
						onchange={() => handleSliderChange(index)}
					/>
					<button
						aria-label="Increase joint {index} by 5 degrees"
						class="shrink-0 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
						onclick={() => adjustJoint(index, INCREMENT_DEGREES)}
					>
						+5°
					</button>
					<span
						class={[
							'w-20 shrink-0 text-right text-xs tabular-nums',
							hasWarning ? 'font-medium text-amber-700' : 'text-gray-700',
						]}
					>
						{formatNumeric(displayValue)}{unit}
					</span>
				</div>

				{#if hasWarning}
					<div
						class="ml-10 flex w-fit items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
					>
						<Icon
							name="alert"
							cx="shrink-0 text-amber-600"
						/>
						<span>
							Large move: {delta > 0 ? '+' : ''}{formatNumeric(toDisplayAngle(delta))}{unit} from current
						</span>
						<button
							aria-label="Dismiss warning for joint {index}"
							class="ml-0.5 shrink-0 hover:text-amber-900"
							onclick={() => dismissWarning(index)}
						>
							<Icon
								name="close"
								cx="text-xs"
							/>
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Quick set -->
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

	{#if hasPendingLargeMoves}
		<p class="text-xs text-amber-700">
			One or more joints have large pending movements. Review warnings above, then click Execute to
			confirm.
		</p>
	{/if}

	<Button
		class="mt-auto w-fit"
		icon="play-circle-outline"
		variant="dark"
		onclick={execute}
	>
		Execute
	</Button>

	<ErrorDisplay {lastError} />
</div>
