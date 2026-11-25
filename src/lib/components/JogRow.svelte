<script lang="ts">
	import type { JogDirection } from './jog-target'

	import { pressAndHold } from './press-and-hold'

	interface Props {
		/** Visible row name, such as "Axis 0" or "Position". Names the group and both steppers. */
		label: string
		/** The live value. Shows a placeholder while undefined. */
		value: number | undefined
		formatValue: (value: number) => string
		unit: string
		step: number
		/** The lowest reachable value. With `max`, it also draws the track. */
		min: number | undefined
		/** The highest reachable value. With `min`, it also draws the track. */
		max: number | undefined
		/** True while the row's conflict group has a call in flight. Both steppers turn aria-disabled. */
		isBusy: boolean
		/** Fires once when a hold starts on an enabled stepper. */
		onPress: (direction: JogDirection) => void
		/** Fires once when a hold that `onPress` accepted ends. */
		onRelease: () => void
		/** The stepper whose hold is running. It renders busy, and the other stepper is aria-disabled. */
		busyDirection?: JogDirection
		/** An element id that both steppers reference with `aria-describedby`. */
		describedBy?: string
	}

	const {
		label,
		value,
		formatValue,
		unit,
		step,
		min,
		max,
		isBusy,
		onPress,
		onRelease,
		busyDirection,
		describedBy,
	}: Props = $props()

	const VALUE_PLACEHOLDER = '-'
	const PERCENT = 100

	const instanceId = $props.id()
	const labelId = `${instanceId}-label`

	let isHeld = false

	const isAtBound = (direction: JogDirection) => {
		if (value === undefined) {
			return false
		}
		if (direction === 'decrease') {
			return min !== undefined && value <= min
		}
		return max !== undefined && value >= max
	}

	const isStepperDisabled = (direction: JogDirection) =>
		isBusy || busyDirection !== undefined || isAtBound(direction)

	const press = (direction: JogDirection) => {
		if (isHeld || isStepperDisabled(direction)) {
			return
		}
		isHeld = true
		onPress(direction)
	}

	const release = () => {
		if (!isHeld) {
			return
		}
		isHeld = false
		onRelease()
	}

	const trackRange = $derived.by(() => {
		if (min === undefined || max === undefined || max <= min) {
			return undefined
		}
		return { min, max }
	})

	const markerPercent = $derived.by(() => {
		if (trackRange === undefined || value === undefined) {
			return undefined
		}
		const fraction = (value - trackRange.min) / (trackRange.max - trackRange.min)
		return Math.min(Math.max(fraction, 0), 1) * PERCENT
	})

	const STEPPER_SIGN: Record<JogDirection, string> = {
		decrease: '−',
		increase: '+',
	}

	// A degree sign sits flush against its number. Every other unit takes a space.
	const UNITS_WITHOUT_SPACE = new Set(['°'])

	const unitSeparator = $derived(UNITS_WITHOUT_SPACE.has(unit) ? '' : ' ')

	const stepperText = (direction: JogDirection) =>
		`${STEPPER_SIGN[direction]}${step}${unitSeparator}${unit}`
</script>

{#snippet stepper(direction: JogDirection)}
	<!-- The name starts with the visible text, so a voice command that reads the button matches it (WCAG 2.5.3). -->
	<button
		type="button"
		class="button button-xs font-roboto-mono shrink-0 touch-none"
		aria-label="{stepperText(direction)}, {label}"
		aria-disabled={isStepperDisabled(direction) || undefined}
		aria-busy={busyDirection === direction || undefined}
		aria-describedby={describedBy}
		{@attach pressAndHold({
			onPress: () => {
				press(direction)
			},
			onRelease: release,
		})}
	>
		{stepperText(direction)}
		{#if busyDirection === direction}
			<span
				class="progress-dots"
				aria-hidden="true"
			></span>
		{/if}
	</button>
{/snippet}

<!-- flex-wrap with a stepper group that keeps its min-content width: it drops under the label only when the row is too narrow for both. -->
<div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5">
	<span
		id={labelId}
		title={label}
		class="font-roboto-mono text-subtle-1 max-w-32 min-w-12 shrink-0 truncate text-xs"
	>
		{label}
	</span>
	<div
		role="group"
		aria-labelledby={labelId}
		class="flex flex-1 items-center gap-1.5"
	>
		{@render stepper('decrease')}
		<div class="flex min-w-20 flex-1 flex-col gap-0.5">
			<span class="grid min-h-5.5 place-items-center">
				<span
					class="font-roboto-mono text-default inline-flex items-baseline gap-1 text-xs tabular-nums"
				>
					{#if value === undefined}
						<span>{VALUE_PLACEHOLDER}</span>
					{:else}
						<span>{formatValue(value)}</span><span class="text-subtle-2">{unit}</span>
					{/if}
				</span>
			</span>
			{#if trackRange}
				<div
					aria-hidden="true"
					data-testid="jog-track"
					class="bg-gray-3 relative mt-1 h-1 rounded-full"
				>
					{#if markerPercent !== undefined}
						<span
							class="bg-gray-8 absolute -top-0.5 h-2 w-0.5 -translate-x-1/2"
							style:left="{markerPercent}%"
						></span>
					{/if}
				</div>
			{/if}
		</div>
		{@render stepper('increase')}
	</div>
</div>
