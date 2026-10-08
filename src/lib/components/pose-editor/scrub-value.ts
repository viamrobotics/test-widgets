const SHIFT_MULTIPLIER = 10
const ALT_MULTIPLIER = 0.1

interface ScrubModifiers {
	shift: boolean
	alt: boolean
}

const decimalsOf = (amount: number) => String(amount).split('.')[1]?.length ?? 0

/**
 * The value after dragging `dx` pixels from `start`, one `step` per pixel. Shift multiplies the
 * rate by 10 and Alt by 0.1. The result is rounded to the decimals of the effective step, so
 * floating point noise never shows.
 */
export const scrubbedValue = (
	start: number,
	dx: number,
	step: number,
	modifiers: ScrubModifiers
): number => {
	let multiplier = 1
	if (modifiers.shift) multiplier = SHIFT_MULTIPLIER
	else if (modifiers.alt) multiplier = ALT_MULTIPLIER

	const rate = Number((step * multiplier).toFixed(decimalsOf(step) + 1))
	return Number((start + dx * rate).toFixed(decimalsOf(rate)))
}
