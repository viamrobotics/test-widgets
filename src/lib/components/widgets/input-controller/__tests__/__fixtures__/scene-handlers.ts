import type { StandardGamepadEvent } from '../../standard-gamepad-event'

/** The callbacks the mocked scene was given, so a spec can play the gamepad. */
export const sceneHandlers: {
	onChange: (event: StandardGamepadEvent) => void
	onConnectionChange: (connected: boolean) => void
} = {
	onChange: () => undefined,
	onConnectionChange: () => undefined,
}
