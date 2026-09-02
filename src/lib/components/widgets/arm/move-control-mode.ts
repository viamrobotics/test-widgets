/** How the arm MoveToPosition widget executes a move. */
export type MoveControlMode = 'motion' | 'direct'

/**
 * The mode the widget starts in: motion planning whenever the machine has a
 * motion service, direct arm control only when it has none.
 */
export const defaultMoveControlMode = (motionServiceNames: string[]): MoveControlMode =>
	motionServiceNames.length > 0 ? 'motion' : 'direct'

/**
 * The motion service a `Move` call targets: `builtin` when present, otherwise
 * the first discovered service.
 *
 * @returns The service name, or `undefined` when the machine has no motion service.
 */
export const moveMotionServiceName = (motionServiceNames: string[]): string | undefined =>
	motionServiceNames.includes('builtin') ? 'builtin' : motionServiceNames[0]

/**
 * The selectable motion services for the service select: `builtin` first when
 * present, the rest alphabetical.
 */
export const motionServiceOptions = (motionServiceNames: string[]): string[] => {
	const others = motionServiceNames
		.filter((name) => name !== 'builtin')
		.toSorted((a, b) => a.localeCompare(b))
	return motionServiceNames.includes('builtin') ? ['builtin', ...others] : others
}
