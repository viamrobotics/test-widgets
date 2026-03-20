/*
 * Threlte StandardGamepadEvent is not exported from the package. Instead, poorly type it here.
 *
 * https://github.com/threlte/threlte/blob/main/packages/extras/src/lib/hooks/useGamepad.ts#L59
 *
 * TODO(ethanlook): Use the exported Threlte StandardGamepadEvent.
 */
export interface StandardGamepadEvent {
	type: string;
	target: string;
	value: number | { x: number; y: number };
}
