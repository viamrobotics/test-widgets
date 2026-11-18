import { getResourceAPI } from '$lib/get-resource-api'
import { ResourceTriplets } from '$lib/resource-triplet'

import type { PaneSize } from './layout-minimum'

import { COMPOSITE_SLOT, type ResourcePane } from './resource-pane'

/**
 * Each motor pane's smallest size in px, header and borders included. The numbers are the
 * minWidth and minHeight columns of the registry table on the Motor-Frames board,
 * `.claude/plans/prime-controls-migration/boards/project/Motor-Frames.dc.html`. They are the
 * board's estimates, not measurements, and they live here until the registry carries them.
 * Keyed by registry entry id, with the composite, which has no id, under `composite`.
 */
const MOTOR_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 228, height: 1260 },
	'quick-move': { width: 188, height: 133 },
	'set-power': { width: 178, height: 111 },
	'set-rpm': { width: 178, height: 111 },
	'go-for': { width: 186, height: 137 },
	'go-to': { width: 212, height: 137 },
	'is-moving': { width: 162, height: 73 },
}

/**
 * Each arm pane's smallest size in px, from the minWidth and minHeight columns of the registry
 * table on the Arm-Frames board,
 * `.claude/plans/prime-controls-migration/boards/project/Arm-Frames.dc.html`. Estimates, not
 * measurements. The composite's height is the board's "about 2300, stacked". Keyed like motor's.
 */
const ARM_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 246, height: 2300 },
	'move-to-joint-positions': { width: 230, height: 575 },
	'move-to-position': { width: 230, height: 800 },
	'get-joint-positions': { width: 180, height: 296 },
	'is-moving': { width: 162, height: 73 },
	'manual-mode': { width: 200, height: 186 },
	stop: { width: 162, height: 85 },
}

/**
 * The motion service's pane minimum in px, from the minWidth and minHeight columns of the
 * registry table on the Motion-Frames board,
 * `.claude/plans/prime-controls-migration/boards/project/Motion-Frames.dc.html`. An estimate, the
 * board's "about 600" high. Motion has a composite and no API entries.
 */
const MOTION_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 220, height: 600 },
}

/**
 * The base pane minimums in px, from "Batch 4.2 measured sizes" in
 * `.claude/plans/prime-controls-migration/phase-4-rollout-actuator-widgets.md`. Estimates, not
 * measurements. Quick move takes its captured height, 237, because the pane must hold the pad
 * while keyboard capture shows its status line, and the idle 197 is one line shorter. The
 * composite takes "about 1080 idle, 1120 captured" as 1120 for the same reason. GetProperties
 * has no registry entry, so it has no row.
 */
const BASE_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 286, height: 1120 },
	'quick-move': { width: 286, height: 237 },
	'move-straight': { width: 180, height: 137 },
	spin: { width: 218, height: 137 },
	'set-power': { width: 248, height: 201 },
	'set-velocity': { width: 270, height: 201 },
	'is-moving': { width: 162, height: 73 },
	stop: { width: 162, height: 85 },
}

/**
 * The gantry pane minimums in px, from the same table. Heights assume three axes. The composite's
 * "about 1300" is 1300, and move-to-position takes its stacked height, 509. GetLengths and Stop
 * have no registry entry, so they have no row.
 */
const GANTRY_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 200, height: 1300 },
	'get-position': { width: 162, height: 277 },
	'move-to-position': { width: 164, height: 509 },
	home: { width: 162, height: 167 },
	'is-moving': { width: 162, height: 73 },
	'quick-move': { width: 181, height: 155 },
}

/**
 * The servo pane minimums in px, from the same table. The composite's "about 410" is 410.
 */
const SERVO_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 178, height: 410 },
	move: { width: 178, height: 139 },
	'get-position': { width: 162, height: 97 },
	'is-moving': { width: 162, height: 73 },
	stop: { width: 162, height: 85 },
	'quick-move': { width: 162, height: 75 },
}

const PANE_MINIMUMS: Readonly<Record<string, Readonly<Record<string, PaneSize>>>> = {
	[ResourceTriplets.Motor]: MOTOR_PANE_MINIMUMS,
	[ResourceTriplets.Arm]: ARM_PANE_MINIMUMS,
	[ResourceTriplets.Motion]: MOTION_PANE_MINIMUMS,
	[ResourceTriplets.Base]: BASE_PANE_MINIMUMS,
	[ResourceTriplets.Gantry]: GANTRY_PANE_MINIMUMS,
	[ResourceTriplets.Servo]: SERVO_PANE_MINIMUMS,
}

// The motor table's floor: the header's icon and three buttons with 40 px of title.
const SMALLEST_PANE: PaneSize = { width: 162, height: 73 }

// "A pane adds its 1 px borders", from the same table's notes.
const PANE_BORDERS = 2

/** The smallest a resource pane snaps to before its body scrolls. */
export const resourcePaneMinimum = (pane: ResourcePane): PaneSize =>
	PANE_MINIMUMS[getResourceAPI(pane.resource)]?.[
		pane.kind === 'composite' ? COMPOSITE_SLOT : pane.entry.id
	] ?? SMALLEST_PANE

/** The narrowest the widget in a pane's body lays out. Narrower, the body scrolls sideways. */
export const resourcePaneBodyMinWidth = (pane: ResourcePane): number =>
	resourcePaneMinimum(pane).width - PANE_BORDERS
