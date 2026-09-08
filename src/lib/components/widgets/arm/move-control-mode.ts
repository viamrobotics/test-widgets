import { type FrameConfigEntry, movableFrameNames } from '../motion/frame-system-config'

/** How the arm MoveToPosition widget executes a move. */
export type MoveControlMode = 'motion' | 'direct'

/**
 * Whether the widget can offer motion planning for `resourceName`.
 *
 * The machine needs a motion service, and the arm needs a frame in the machine's frame system.
 * rdk leaves a component configured without a `frame` out of the frame system entirely, and
 * neither `GetPose` nor a motion `Move` can resolve an arm it cannot find there.
 */
export const canPlanMotion = (
	motionServiceNames: string[],
	frameSystem: FrameConfigEntry[],
	resourceName: string
): boolean => motionServiceNames.length > 0 && movableFrameNames(frameSystem).includes(resourceName)

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
