<script lang="ts">
	import { mdiArrowUp } from '@mdi/js'
	import { Slider } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		setPower: (_: number) => void
	}

	type Direction = 'forward' | 'backward'

	const DEFAULT_POWER_FRACTION = 0.5
	const POWER_STEP = 0.05
	const HOLD_KEYS = new Set([' ', 'Enter'])

	const { setPower }: Props = $props()

	// Two quick moves can share a page (the composite and its own pane), so the hint id is per instance.
	const instanceId = $props.id()
	const holdHintId = `${instanceId}-hold-hint`

	let powerFraction = $state(DEFAULT_POWER_FRACTION)
	let heldDirection = $state<Direction | null>(null)

	const start = (direction: Direction) => {
		if (heldDirection !== null) {
			return
		}
		heldDirection = direction
		setPower((direction === 'forward' ? 1 : -1) * powerFraction)
	}

	const stop = () => {
		if (heldDirection === null) {
			return
		}
		heldDirection = null
		setPower(0)
	}

	const onPointerDown = (
		event: PointerEvent & { currentTarget: HTMLButtonElement },
		direction: Direction
	) => {
		if (event.button !== 0) {
			return
		}
		event.currentTarget.setPointerCapture(event.pointerId)
		start(direction)
	}

	const onKeyDown = (event: KeyboardEvent, direction: Direction) => {
		if (!HOLD_KEYS.has(event.key)) {
			return
		}
		event.preventDefault()
		if (!event.repeat) {
			start(direction)
		}
	}

	const onKeyUp = (event: KeyboardEvent) => {
		if (HOLD_KEYS.has(event.key)) {
			stop()
		}
	}
</script>

<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') {
			stop()
		}
	}}
/>

<div class="flex flex-col gap-1">
	<Slider
		label="Power"
		min={0}
		max={1}
		step={POWER_STEP}
		bind:value={powerFraction}
	/>

	<div class="mt-1 flex flex-wrap items-center gap-4">
		<button
			type="button"
			class={['button button-xs touch-none', heldDirection === 'forward' && 'button-dark']}
			aria-describedby={holdHintId}
			onpointerdown={(event) => {
				onPointerDown(event, 'forward')
			}}
			onpointerup={stop}
			onpointercancel={stop}
			onlostpointercapture={stop}
			onkeydown={(event) => {
				onKeyDown(event, 'forward')
			}}
			onkeyup={onKeyUp}
			onblur={stop}
		>
			<Icon
				icon={mdiArrowUp}
				size="sm"
			/>
			Forward
		</button>
		<button
			type="button"
			class={['button button-xs touch-none', heldDirection === 'backward' && 'button-dark']}
			aria-describedby={holdHintId}
			onpointerdown={(event) => {
				onPointerDown(event, 'backward')
			}}
			onpointerup={stop}
			onpointercancel={stop}
			onlostpointercapture={stop}
			onkeydown={(event) => {
				onKeyDown(event, 'backward')
			}}
			onkeyup={onKeyUp}
			onblur={stop}
		>
			<Icon
				icon={mdiArrowUp}
				size="sm"
				class="rotate-180"
			/>
			Backward
		</button>
		<p
			id={holdHintId}
			class="text-subtle-2 ml-auto text-xs"
		>
			Press and hold
		</p>
	</div>
</div>
