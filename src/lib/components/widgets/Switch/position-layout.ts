/** Where SetPosition's toggle group goes: beside its label, under it, or swapped for a `Select`. */
export type PositionLayout = 'beside' | 'under' | 'select'

/** The unwrapped widths the group needs, read from its hidden copy. */
export interface PositionWidths {
	/** The label, the row's gap, and the group on one line. */
	beside: number
	/** The group alone, the full row it needs once it drops under the label. */
	under: number
}

/**
 * Entering a roomier layout takes this much spare room, while staying in one only needs a fit, so
 * a width that sits on a boundary does not flip the layout on every resize.
 */
const POSITION_LAYOUT_HYSTERESIS_PX = 4

const fits = (needed: number, room: number, isCurrent: boolean) =>
	needed <= (isCurrent ? room : room - POSITION_LAYOUT_HYSTERESIS_PX)

/** Picks the roomiest layout the group fits in one line at `room` px wide. */
export const choosePositionLayout = (
	widths: PositionWidths,
	room: number,
	current: PositionLayout
): PositionLayout => {
	if (fits(widths.beside, room, current === 'beside')) return 'beside'
	if (fits(widths.under, room, current !== 'select')) return 'under'
	return 'select'
}
