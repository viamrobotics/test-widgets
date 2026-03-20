<script lang="ts">
	import { Canvas } from '@threlte/core'
	import { InputControllerClient, type InputControllerEvent } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ErrorDisplay from '$lib/components/error.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'

	import type { StandardGamepadEvent } from './standard-gamepad-event'

	import WebgamepadScene from './webgamepad-scene.svelte'

	interface Props {
		partID: string
		resourceName: string
		refetch: () => void
	}

	const { partID, resourceName, refetch }: Props = $props()

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

	const triggerEvent = async (event: StandardGamepadEvent) => {
		// NOTE(ethanlook): Share this helper
		const now = Date.now()
		const time = {
			seconds: BigInt(Math.floor(now / 1000)),
			nanos: (now % 1000) * 1_000_000,
		}

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

		await Promise.allSettled(
			events.map(async (icEvent) => triggerEventMutation.mutateAsync([icEvent]))
		)

		refetch()
	}

	// The Threlte useGamepad hook exposes a store for this,
	// but to display it here we need to use another store
	// and pass down the setter.
	let isConnected = $state(false)
</script>

<!-- Hidden because a Threlte Canvas isn't actually shown,
     but the context must be provided. -->
<div hidden>
	<Canvas>
		<WebgamepadScene
			onChange={triggerEvent}
			onConnectionChange={(connected) => {
				isConnected = connected
			}}
		/>
	</Canvas>
</div>

<StatusPill
	isActive={isConnected}
	activeText="Connected"
	inactiveText="Disconnected"
/>
<ErrorDisplay lastError={triggerEventMutation.error} />
