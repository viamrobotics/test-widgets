export type JogDirection = 'decrease' | 'increase'

export interface JogTargetOptions {
	start: number
	direction: JogDirection
	/** The step size, a positive number. `direction` decides its sign. */
	step: number
	/** The lowest reachable value. Absent, a decrease is not clamped. */
	min?: number
	/** The highest reachable value. Absent, an increase is not clamped. */
	max?: number
}

/**
 * The value one jog step moves to, clamped into `[min, max]`.
 *
 * @returns The target, or `undefined` when `start` already sits at or past the bound in that
 *   direction, so there is nothing to send.
 */
export const jogTarget = ({
	start,
	direction,
	step,
	min,
	max,
}: JogTargetOptions): number | undefined => {
	if (direction === 'decrease') {
		if (min !== undefined && start <= min) {
			return undefined
		}
		return Math.max(start - step, min ?? Number.NEGATIVE_INFINITY)
	}
	if (max !== undefined && start >= max) {
		return undefined
	}
	return Math.min(start + step, max ?? Number.POSITIVE_INFINITY)
}
