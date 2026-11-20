<script lang="ts">
	import { Canvas } from '@threlte/core'
	import { InputControllerClient, type InputControllerEvent } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { Section } from '$lib/components/section'

	import type { StandardGamepadEvent } from './standard-gamepad-event'

	import WebgamepadScene from './webgamepad-scene.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** True while the browser reports a gamepad. The host draws the connection badge from it. */
		isConnected?: boolean
	}

	let { partID, resourceName, isConnected = $bindable(false) }: Props = $props()

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const triggerEventMutation = createResourceMutation(client, 'triggerEvent')

	// Threlte useGamepad button names → RDK input control names
	const CONTROL_MAP: Record<string, string> = {
		clusterBottom: 'ButtonSouth',
		clusterRight: 'ButtonEast',
		clusterLeft: 'ButtonWest',
		clusterTop: 'ButtonNorth',
		leftBumper: 'ButtonLT',
		rightBumper: 'ButtonRT',
		leftTrigger: 'AbsoluteZ',
		rightTrigger: 'AbsoluteRZ',
		select: 'ButtonSelect',
		start: 'ButtonStart',
		center: 'ButtonMenu',
		leftStickButton: 'ButtonLThumb',
		rightStickButton: 'ButtonRThumb',
	}

	// Threlte event types → RDK event types
	const EVENT_TYPE_MAP: Record<string, string> = {
		down: 'ButtonPress',
		press: 'ButtonPress',
		up: 'ButtonRelease',
		change: 'PositionChangeAbs',
	}

	// D-pad buttons map to Hat axes with signed values
	const DPAD_MAP: Record<string, { control: string; downValue: number }> = {
		directionalTop: { control: 'AbsoluteHat0Y', downValue: -1 },
		directionalBottom: { control: 'AbsoluteHat0Y', downValue: 1 },
		directionalLeft: { control: 'AbsoluteHat0X', downValue: -1 },
		directionalRight: { control: 'AbsoluteHat0X', downValue: 1 },
	}

	// Analog sticks emit {x, y} and map to separate X/Y controls
	const STICK_MAP: Record<string, { x: string; y: string }> = {
		leftStick: { x: 'AbsoluteX', y: 'AbsoluteY' },
		rightStick: { x: 'AbsoluteRX', y: 'AbsoluteRY' },
	}

	const BUTTON_EVENT_NAMES = new Set(['ButtonPress', 'ButtonRelease'])

	// The last event sent per control, so a release can neutralize what is still held.
	const lastSentByControl = new Map<string, { event: string; value: number }>()

	const currentEventTime = () => {
		// NOTE(ethanlook): Share this helper
		const now = Date.now()
		return {
			seconds: BigInt(Math.floor(now / 1000)),
			nanos: (now % 1000) * 1_000_000,
		}
	}

	const isHeld = (last: { event: string; value: number }) =>
		last.event === 'ButtonPress' || last.value !== 0

	const neutralEventName = (lastEventName: string) =>
		BUTTON_EVENT_NAMES.has(lastEventName) ? 'ButtonRelease' : 'PositionChangeAbs'

	const sendEvents = async (events: InputControllerEvent[]) => {
		await Promise.allSettled(
			events.map(async (icEvent) => triggerEventMutation.mutateAsync([icEvent]))
		)
	}

	const triggerEvent = async (event: StandardGamepadEvent) => {
		// Nothing is sent until the user engages forwarding.
		if (!isForwarding) {
			return
		}
		const time = currentEventTime()

		const events: InputControllerEvent[] = []

		const dpad = DPAD_MAP[event.target]
		const stick = STICK_MAP[event.target]

		if (dpad) {
			// D-pad: translate to Hat axis with -1/0/1 value
			events.push({
				event: 'PositionChangeAbs',
				control: dpad.control,
				value: event.type === 'down' ? dpad.downValue : 0,
				time,
			})
		} else if (stick && typeof event.value === 'object') {
			// Analog sticks: emit separate X and Y events
			const eventType = EVENT_TYPE_MAP[event.type] ?? event.type
			events.push(
				{ event: eventType, control: stick.x, value: event.value.x, time },
				{ event: eventType, control: stick.y, value: event.value.y, time }
			)
		} else {
			// Buttons and analog triggers
			const control = CONTROL_MAP[event.target] ?? event.target
			const value = typeof event.value === 'number' ? event.value : 0
			// Digital buttons need ButtonPress/ButtonRelease derived from value (1=press, 0=release).
			// Analog controls (AbsoluteZ, AbsoluteRZ) use PositionChangeAbs from EVENT_TYPE_MAP.
			let eventType: string
			if (control.startsWith('Button')) {
				eventType = value > 0 ? 'ButtonPress' : 'ButtonRelease'
			} else {
				eventType = EVENT_TYPE_MAP[event.type] ?? event.type
			}
			events.push({ event: eventType, control, value, time })
		}

		for (const icEvent of events) {
			lastSentByControl.set(icEvent.control, { event: icEvent.event, value: icEvent.value })
		}

		await sendEvents(events)
	}

	let isForwarding = $state(false)

	const hintId = $props.id()
	const FORWARDING_HINT = 'Forwarding. Each change is sent as one TriggerEvent.'
	const IDLE_HINT = 'Not forwarding. Turn on to send this gamepad’s changes as TriggerEvents.'
	const NO_GAMEPAD_HINT = 'No gamepad connected. Press a button on a gamepad to connect it.'

	const forwardingHint = $derived.by(() => {
		if (!isConnected) return NO_GAMEPAD_HINT
		return isForwarding ? FORWARDING_HINT : IDLE_HINT
	})

	// Every release path lands here. Once forwarding is off it does nothing, so two paths firing
	// together send the neutral events once.
	const releaseForwarding = () => {
		if (!isForwarding) {
			return
		}
		isForwarding = false

		const time = currentEventTime()
		const neutralEvents: InputControllerEvent[] = []
		for (const [control, last] of lastSentByControl) {
			if (isHeld(last)) {
				neutralEvents.push({ event: neutralEventName(last.event), control, value: 0, time })
			}
		}
		lastSentByControl.clear()

		void sendEvents(neutralEvents)
	}

	const toggleForwarding = () => {
		if (isForwarding) {
			releaseForwarding()
			return
		}
		isForwarding = true
	}

	// Unmount is a release path: closing the pane with a stick held must not leave it driving.
	$effect(() => releaseForwarding)
</script>

<svelte:window onblur={releaseForwarding} />

<svelte:document
	onvisibilitychange={() => {
		if (document.visibilityState === 'hidden') {
			releaseForwarding()
		}
	}}
/>

<!-- Hidden because a Threlte Canvas isn't actually shown,
     but the context must be provided. -->
<div hidden>
	<Canvas>
		<WebgamepadScene
			onChange={triggerEvent}
			onConnectionChange={(connected) => {
				isConnected = connected
				// An unplugged gamepad has nothing left to forward.
				if (!connected) {
					releaseForwarding()
				}
			}}
		/>
	</Canvas>
</div>

<div class="flex flex-col items-start gap-2">
	<button
		type="button"
		class={['button button-xs', isForwarding && 'button-dark']}
		aria-pressed={isForwarding}
		aria-describedby={hintId}
		disabled={!isConnected}
		onclick={toggleForwarding}
	>
		Forward gamepad
	</button>
	<p
		id={hintId}
		class="text-subtle-1 text-xs"
	>
		{forwardingHint}
	</p>
</div>
<Section.Error error={triggerEventMutation.error} />
