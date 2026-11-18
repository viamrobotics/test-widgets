<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { mdiArrowUp, mdiUndo } from '@mdi/js'
	import { Slider } from '@viamrobotics/prime-controls'
	import { clickOutside, Icon } from '@viamrobotics/prime-ui'

	import { createKeyboardCapture } from './keyboard-capture.svelte'

	interface Props {
		setPower: (linear: Vector3, angular: Vector3) => void
		/**
		 * Sent once when keyboard capture ends while a drive key is held, since that key's release
		 * never arrives. Without it, a zero power is sent instead.
		 */
		stop?: () => void
		/** While false, keyboard capture is released and cannot hold. @default true */
		isConnected?: boolean
	}

	type Direction = 'forward' | 'left' | 'backward' | 'right'

	interface DriveButton {
		direction: Direction
		label: string
		key: string
		icon: string
		iconClass?: string
		gridClass: string
		linear: number
		angular: number
	}

	const DEFAULT_POWER_FRACTION = 0.5
	const POWER_STEP = 0.05
	const HOLD_KEYS = new Set([' ', 'Enter'])

	// When setPower commands are sent in quick succession, the RDK base model sometimes handles the
	// responses out of order. To make sure the base truly stops, a second zero follows 50 ms later.
	const SECOND_STOP_DELAY_MS = 50

	// Source order is the tab order of the cross: Forward on the top row, then Left, Backward, Right.
	const DRIVE_BUTTONS: DriveButton[] = [
		{
			direction: 'forward',
			label: 'Forward',
			key: 'W',
			icon: mdiArrowUp,
			gridClass: 'col-start-2 row-start-1',
			linear: 1,
			angular: 0,
		},
		{
			direction: 'left',
			label: 'Left',
			key: 'A',
			icon: mdiUndo,
			gridClass: 'col-start-1 row-start-2',
			linear: 0,
			angular: 1,
		},
		{
			direction: 'backward',
			label: 'Backward',
			key: 'S',
			icon: mdiArrowUp,
			iconClass: 'rotate-180',
			gridClass: 'col-start-2 row-start-2',
			linear: -1,
			angular: 0,
		},
		{
			direction: 'right',
			label: 'Right',
			key: 'D',
			icon: mdiUndo,
			iconClass: '-scale-x-100',
			gridClass: 'col-start-3 row-start-2',
			linear: 0,
			angular: -1,
		},
	]

	const DIRECTION_BY_KEY = new Map<string, Direction>([
		['w', 'forward'],
		['arrowup', 'forward'],
		['a', 'left'],
		['arrowleft', 'left'],
		['s', 'backward'],
		['arrowdown', 'backward'],
		['d', 'right'],
		['arrowright', 'right'],
	])

	const NON_TEXT_INPUT_TYPES = new Set([
		'button',
		'checkbox',
		'color',
		'file',
		'hidden',
		'image',
		'radio',
		'range',
		'reset',
		'submit',
	])

	const { setPower, stop, isConnected = true }: Props = $props()

	// Two quick moves can share a page (the composite and its own pane), so ids are per instance.
	const instanceId = $props.id()
	const holdHintId = `${instanceId}-hold-hint`

	let powerFraction = $state(DEFAULT_POWER_FRACTION)
	let pointerDirection = $state<Direction | null>(null)
	const pressedKeys = $state<Record<Direction, boolean>>({
		forward: false,
		left: false,
		backward: false,
		right: false,
	})
	let isStopSentOnRelease = $state(false)

	let secondStopTimeoutId: ReturnType<typeof setTimeout> | undefined

	const setPowerScalar = (linearFraction: number, angularFraction: number) => {
		clearTimeout(secondStopTimeoutId)
		setPower({ x: 0, y: linearFraction, z: 0 }, { x: 0, y: 0, z: angularFraction })
		if (linearFraction === 0 && angularFraction === 0) {
			secondStopTimeoutId = setTimeout(() => {
				setPower({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 })
			}, SECOND_STOP_DELAY_MS)
		}
	}

	const isAnyKeyPressed = () => Object.values(pressedKeys).some(Boolean)

	const releaseHeldKeys = () => {
		if (!isAnyKeyPressed()) {
			return
		}
		pressedKeys.forward = false
		pressedKeys.left = false
		pressedKeys.backward = false
		pressedKeys.right = false
		isStopSentOnRelease = true
		if (stop) {
			clearTimeout(secondStopTimeoutId)
			stop()
		} else {
			setPowerScalar(0, 0)
		}
	}

	const capture = createKeyboardCapture(releaseHeldKeys)

	const isTextField = (target: EventTarget | null) => {
		if (target instanceof HTMLTextAreaElement) {
			return true
		}
		if (target instanceof HTMLInputElement) {
			return !NON_TEXT_INPUT_TYPES.has(target.type)
		}
		return target instanceof HTMLElement && target.isContentEditable
	}

	const driveFromKeys = () => {
		const linear = (pressedKeys.forward ? 1 : 0) - (pressedKeys.backward ? 1 : 0)
		const angular = (pressedKeys.left ? 1 : 0) - (pressedKeys.right ? 1 : 0)
		setPowerScalar(linear * powerFraction, angular * powerFraction)
	}

	const driveKeyDirection = (event: KeyboardEvent) => {
		if (!capture.isCaptured || event.ctrlKey || event.metaKey || event.altKey) {
			return undefined
		}
		if (isTextField(event.target)) {
			return undefined
		}
		return DIRECTION_BY_KEY.get(event.key.toLowerCase())
	}

	// stopImmediatePropagation in the capture phase, so a captured drive key never reaches a sibling
	// window listener, such as the config builder's "A" hotkey. stopPropagation leaves siblings running.
	const onWindowKeydown = (event: KeyboardEvent) => {
		if (capture.isCaptured && event.key === 'Escape') {
			capture.release()
			return
		}
		const direction = driveKeyDirection(event)
		if (!direction) {
			return
		}
		event.stopImmediatePropagation()
		event.preventDefault()
		if (event.repeat) {
			return
		}
		pressedKeys[direction] = true
		driveFromKeys()
	}

	const onWindowKeyup = (event: KeyboardEvent) => {
		const direction = driveKeyDirection(event)
		if (!direction) {
			return
		}
		event.stopImmediatePropagation()
		event.preventDefault()
		if (!pressedKeys[direction]) {
			return
		}
		pressedKeys[direction] = false
		driveFromKeys()
	}

	const engageOrRelease = () => {
		if (!isConnected) {
			return
		}
		if (!capture.isCaptured) {
			isStopSentOnRelease = false
		}
		capture.toggle()
	}

	const startButtonDrive = ({ direction, linear, angular }: DriveButton) => {
		if (pointerDirection !== null) {
			return
		}
		pointerDirection = direction
		setPowerScalar(linear * powerFraction, angular * powerFraction)
	}

	const endButtonDrive = () => {
		if (pointerDirection === null) {
			return
		}
		pointerDirection = null
		setPowerScalar(0, 0)
	}

	const onPointerDown = (
		event: PointerEvent & { currentTarget: HTMLButtonElement },
		button: DriveButton
	) => {
		if (event.button !== 0) {
			return
		}
		event.currentTarget.setPointerCapture(event.pointerId)
		startButtonDrive(button)
	}

	const onButtonKeydown = (event: KeyboardEvent, button: DriveButton) => {
		if (!HOLD_KEYS.has(event.key)) {
			return
		}
		event.preventDefault()
		if (!event.repeat) {
			startButtonDrive(button)
		}
	}

	const onButtonKeyup = (event: KeyboardEvent) => {
		if (HOLD_KEYS.has(event.key)) {
			endButtonDrive()
		}
	}

	// An effect, not $derived: a dropped connection must end capture and send one Stop, a side effect.
	$effect(() => {
		if (!isConnected && capture.isCaptured) {
			capture.release()
		}
	})

	$effect(() => {
		return () => {
			capture.release()
			clearTimeout(secondStopTimeoutId)
		}
	})
</script>

<svelte:window
	onkeydowncapture={onWindowKeydown}
	onkeyupcapture={onWindowKeyup}
	onblur={() => {
		capture.release()
	}}
	onfocusin={(event) => {
		if (isTextField(event.target)) {
			capture.release()
		}
	}}
/>

<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') {
			capture.release()
			endButtonDrive()
		}
	}}
/>

<div
	class="flex flex-col gap-1"
	{@attach clickOutside(() => {
		capture.release()
	})}
>
	<div class="flex flex-wrap items-center gap-2">
		<button
			type="button"
			class={['button button-xs', capture.isCaptured && 'button-dark']}
			aria-pressed={capture.isCaptured}
			aria-disabled={!isConnected || undefined}
			onclick={engageOrRelease}
		>
			Keyboard control
		</button>
	</div>

	<!-- Always mounted so screen readers announce it. Empty, its -mt-1 cancels the gap-1 above. -->
	<p
		role="status"
		class="text-subtle-2 text-xs empty:-mt-1"
	>
		{#if capture.isCaptured}
			Keyboard captured. W A S D and arrows drive. <span class="text-link">Esc</span> to release.
		{:else if isStopSentOnRelease}
			Keyboard released while driving. Stop sent.
		{/if}
	</p>

	<Slider
		label="Power"
		min={0}
		max={1}
		step={POWER_STEP}
		bind:value={powerFraction}
	/>

	<div class="mt-1 flex flex-wrap items-start gap-2">
		<div class="grid grid-cols-[repeat(3,max-content)] gap-2">
			{#each DRIVE_BUTTONS as button (button.direction)}
				{@const { direction, label, key, icon, iconClass, gridClass } = button}
				<button
					type="button"
					class={[
						'button button-xs w-full touch-none',
						gridClass,
						(pointerDirection === direction || pressedKeys[direction]) && 'button-dark',
					]}
					aria-label="{label} ({key})"
					aria-describedby={holdHintId}
					onpointerdown={(event) => {
						onPointerDown(event, button)
					}}
					onpointerup={endButtonDrive}
					onpointercancel={endButtonDrive}
					onlostpointercapture={endButtonDrive}
					onkeydown={(event) => {
						onButtonKeydown(event, button)
					}}
					onkeyup={onButtonKeyup}
					onblur={endButtonDrive}
				>
					<Icon
						{icon}
						size="sm"
						class={iconClass}
					/>
					{label}
					<span class={['font-semibold', capture.isCaptured ? 'text-default' : 'text-subtle-2']}>
						{key}
					</span>
				</button>
			{/each}
		</div>
		<p
			id={holdHintId}
			class="text-subtle-2 ml-auto text-xs"
		>
			Press and hold
		</p>
	</div>
</div>
