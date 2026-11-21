<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk'

	import { mdiArrowUp, mdiUndo } from '@mdi/js'
	import { Slider } from '@viamrobotics/prime-controls'
	import { clickOutside, Icon } from '@viamrobotics/prime-ui'

	import { pressAndHold } from '$lib/components/press-and-hold'

	import { createKeyboardCapture } from './keyboard-capture.svelte'

	interface Props {
		/**
		 * Sent at once on every press, release, and key change, with no guard or queue. Every returned
		 * promise is caught here, so its error reaches the host only through the mutation it reports to.
		 */
		setPower: (linear: Vector3, angular: Vector3) => Promise<unknown>
		/**
		 * Sent once when keyboard capture ends while a drive key is held, since that key's release
		 * never arrives, and once when the zero sent on an emptied hold fails. Without it, a lost
		 * capture sends a zero power instead.
		 */
		stop?: () => void
		/** While false, keyboard capture is released and cannot hold. @default true */
		isConnected?: boolean
	}

	type Direction = 'forward' | 'left' | 'backward' | 'right'

	type Notice = 'stop-sent' | 'engage-refused'

	interface DriveButton {
		direction: Direction
		label: string
		key: string
		icon: string
		iconClass?: string
		gridClass: string
	}

	const DEFAULT_POWER_FRACTION = 0.5
	const POWER_STEP = 0.05
	const ZERO: Vector3 = { x: 0, y: 0, z: 0 }

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
		},
		{
			direction: 'left',
			label: 'Left',
			key: 'A',
			icon: mdiUndo,
			gridClass: 'col-start-1 row-start-2',
		},
		{
			direction: 'backward',
			label: 'Backward',
			key: 'S',
			icon: mdiArrowUp,
			iconClass: 'rotate-180',
			gridClass: 'col-start-2 row-start-2',
		},
		{
			direction: 'right',
			label: 'Right',
			key: 'D',
			icon: mdiUndo,
			iconClass: '-scale-x-100',
			gridClass: 'col-start-3 row-start-2',
		},
	]

	const DIRECTIONS: Direction[] = ['forward', 'left', 'backward', 'right']

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
	// One held set with two writers: a pointer or Space hold on a pad button, and a captured key.
	const heldByPointer = $state<Record<Direction, boolean>>({
		forward: false,
		left: false,
		backward: false,
		right: false,
	})
	const heldByKey = $state<Record<Direction, boolean>>({
		forward: false,
		left: false,
		backward: false,
		right: false,
	})
	let notice = $state<Notice | null>(null)
	let wasTextFieldFocusedAtTogglePress = false

	let secondStopTimeoutId: ReturnType<typeof setTimeout> | undefined

	const isHeld = (direction: Direction) => heldByPointer[direction] || heldByKey[direction]

	const isAnyHeld = () => DIRECTIONS.some((direction) => isHeld(direction))

	const isAnyKeyHeld = () => DIRECTIONS.some((direction) => heldByKey[direction])

	const heldSign = (direction: Direction) => (isHeld(direction) ? 1 : 0)

	// A held button draws `button-dark`, so its keycap inherits that fill's text color for contrast.
	const keycapColorClass = (direction: Direction) => {
		if (isHeld(direction)) {
			return undefined
		}
		if (capture.isCaptured) {
			return 'text-default'
		}
		return 'text-subtle-2'
	}

	// The mutation already reports a failed call to the section, so the rejection needs no handler here.
	const ignoreRejection = () => undefined

	const sendZero = () => {
		clearTimeout(secondStopTimeoutId)
		let isStopSentOnFailure = false
		const stopOnFailure = () => {
			if (isStopSentOnFailure || isAnyHeld()) {
				return
			}
			isStopSentOnFailure = true
			stop?.()
		}
		setPower(ZERO, ZERO).catch(stopOnFailure)
		secondStopTimeoutId = setTimeout(() => {
			setPower(ZERO, ZERO).catch(stopOnFailure)
		}, SECOND_STOP_DELAY_MS)
	}

	const driveFromHeld = () => {
		if (!isAnyHeld()) {
			sendZero()
			return
		}
		clearTimeout(secondStopTimeoutId)
		const linear = (heldSign('forward') - heldSign('backward')) * powerFraction
		const angular = (heldSign('left') - heldSign('right')) * powerFraction
		setPower({ x: 0, y: linear, z: 0 }, { x: 0, y: 0, z: angular }).catch(ignoreRejection)
	}

	const releaseHeldKeys = () => {
		if (!isAnyKeyHeld()) {
			return
		}
		for (const direction of DIRECTIONS) {
			heldByKey[direction] = false
		}
		notice = 'stop-sent'
		if (stop) {
			clearTimeout(secondStopTimeoutId)
			stop()
		} else {
			sendZero()
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
		heldByKey[direction] = true
		driveFromHeld()
	}

	const onWindowKeyup = (event: KeyboardEvent) => {
		const direction = driveKeyDirection(event)
		if (!direction) {
			return
		}
		event.stopImmediatePropagation()
		event.preventDefault()
		if (!heldByKey[direction]) {
			return
		}
		heldByKey[direction] = false
		driveFromHeld()
	}

	// Focus moves to the toggle on pointerdown, so the text field that held focus is read before then.
	const onTogglePointerDown = () => {
		wasTextFieldFocusedAtTogglePress = isTextField(document.activeElement)
	}

	const engageOrRelease = () => {
		const isRefused = wasTextFieldFocusedAtTogglePress
		wasTextFieldFocusedAtTogglePress = false
		if (!isConnected) {
			return
		}
		if (capture.isCaptured) {
			capture.release()
			return
		}
		if (isRefused) {
			notice = 'engage-refused'
			return
		}
		notice = null
		capture.engage()
	}

	const startPointerHold = (direction: Direction) => {
		heldByPointer[direction] = true
		driveFromHeld()
	}

	const endPointerHold = (direction: Direction) => {
		heldByPointer[direction] = false
		driveFromHeld()
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
		}
	}}
/>

<div
	class="@container min-w-0"
	{@attach clickOutside(() => {
		capture.release()
	})}
>
	<div
		class="flex flex-col gap-2 @md:grid @md:grid-cols-[--spacing(49)_minmax(0,--spacing(80))] @md:items-start @md:gap-x-4"
	>
		<div class="@md:col-start-2 @md:row-start-1">
			<Slider
				label="Power"
				min={0}
				max={1}
				step={POWER_STEP}
				bind:value={powerFraction}
			/>
		</div>

		<div class="flex flex-col gap-2 @md:col-start-1 @md:row-span-2 @md:row-start-1">
			<div class="grid grid-cols-[repeat(3,max-content)] gap-2">
				{#each DRIVE_BUTTONS as button (button.direction)}
					{@const { direction, label, key, icon, iconClass, gridClass } = button}
					<button
						type="button"
						class={[
							'button button-xs h-8.5 w-15 touch-none',
							gridClass,
							isHeld(direction) && 'button-dark',
						]}
						aria-label="{label} ({key})"
						aria-describedby={holdHintId}
						{@attach pressAndHold({
							onPress: () => {
								startPointerHold(direction)
							},
							onRelease: () => {
								endPointerHold(direction)
							},
						})}
					>
						<Icon
							{icon}
							size="sm"
							class={iconClass}
						/>
						<span class={['font-semibold', keycapColorClass(direction)]}>
							{key}
						</span>
					</button>
				{/each}
			</div>

			<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
				<button
					type="button"
					class={['button button-xs', capture.isCaptured && 'button-dark']}
					aria-pressed={capture.isCaptured}
					aria-disabled={!isConnected || undefined}
					onpointerdown={onTogglePointerDown}
					onclick={engageOrRelease}
				>
					Keyboard control
				</button>
				<p
					id={holdHintId}
					class="text-subtle-2 text-xs"
				>
					Press and hold
				</p>
			</div>
		</div>

		<!-- Always mounted so screen readers announce it. Empty, its -mt-2 cancels the gap-2 before it. -->
		<p
			role="status"
			class="text-subtle-2 text-xs empty:-mt-2 @md:col-start-2 @md:row-start-2"
		>
			{#if capture.isCaptured}
				Keyboard captured. W A S D and arrows drive. <span class="text-link">Esc</span> to release.
			{:else if notice === 'stop-sent'}
				Keyboard released while driving. Sent Stop.
			{:else if notice === 'engage-refused'}
				Keyboard not captured while a text field has focus.
			{/if}
		</p>
	</div>
</div>
