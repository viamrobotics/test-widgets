import type { MoveTarget } from '@viamrobotics/visualization/scoped-scene'

/** The goal the gizmo stub's first button releases at. */
export const FIRST_TARGET: MoveTarget = {
	referenceFrame: 'world',
	pose: { x: 300, y: 140, z: 380, oX: 0, oY: 0, oZ: 1, theta: 0 },
}

/** The goal the gizmo stub's second button releases at. */
export const SECOND_TARGET: MoveTarget = {
	referenceFrame: 'world',
	pose: { x: 320, y: 100, z: 360, oX: 0, oY: 0, oZ: 1, theta: 0 },
}
