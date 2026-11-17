import type { PaneSize } from './layout-minimum'
import type { MotorPane } from './motor-pane'

/**
 * Each motor pane's smallest size in px, header and borders included. The numbers are the
 * minWidth and minHeight columns of the registry table on the Motor-Frames board,
 * `.claude/plans/prime-controls-migration/boards/project/Motor-Frames.dc.html`. They are the
 * board's estimates, not measurements, and they live here until the registry carries them.
 * Keyed by registry entry id, with the composite, which has no id, under `composite`.
 */
const MOTOR_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	composite: { width: 228, height: 1260 },
	'quick-move': { width: 188, height: 133 },
	'set-power': { width: 178, height: 111 },
	'set-rpm': { width: 178, height: 111 },
	'go-for': { width: 186, height: 137 },
	'go-to': { width: 212, height: 137 },
	'is-moving': { width: 162, height: 73 },
}

// The table's floor: the header's icon and three buttons with 40 px of title.
const SMALLEST_PANE: PaneSize = { width: 162, height: 73 }

// "A pane adds its 1 px borders", from the same table's notes.
const PANE_BORDERS = 2

/** The smallest a motor pane snaps to before its body scrolls. */
export const motorPaneMinimum = (pane: MotorPane): PaneSize =>
	MOTOR_PANE_MINIMUMS[pane.kind === 'composite' ? 'composite' : pane.entry.id] ?? SMALLEST_PANE

/** The narrowest the widget in a motor pane's body lays out. Narrower, the body scrolls sideways. */
export const motorPaneBodyMinWidth = (pane: MotorPane): number =>
	motorPaneMinimum(pane).width - PANE_BORDERS
