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

/**
 * The gripper pane minimums in px, from "Batch 4.3 measured sizes" in
 * `.claude/plans/prime-controls-migration/phase-4-rollout-actuator-widgets.md`, raised to the
 * rendered widgets. Each width is the larger of the table's and the widget's rendered min-content
 * width plus 2 px of borders: the composite 238 + 2 is 240, and IsHoldingSomething 194 + 2 is 196.
 * Each height is the larger of the table's and the rendered `scrollHeight` at that width plus
 * 2 px: open-grab 92 + 2 is 94, Open 94 + 2 is 96, Grab 140 + 2 is 142 with its readout showing,
 * Stop 102 + 2 is 104, IsMoving 97 + 2 is 99, and IsHoldingSomething 97 + 2 is 99. The composite
 * takes its rendered 205 + 2, 207, because the table's "about 540" counted the phase 7 inputs
 * widgets. Measured in a browser-mode spec with the svelte-sdk mocked, connected, and every query
 * true.
 */
const GRIPPER_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 240, height: 207 },
	'open-grab': { width: 190, height: 94 },
	'is-holding-something': { width: 196, height: 99 },
	'is-moving': { width: 162, height: 99 },
	open: { width: 162, height: 96 },
	grab: { width: 162, height: 142 },
	stop: { width: 162, height: 104 },
}

/**
 * The board pane minimum in px, from the table's pins surface row, 210 x 236, which is
 * `BoardWidget`'s composite through phase 4. Rendered: min-content 158 + 2 sits under 210, and
 * `scrollHeight` 231 + 2 is 233, under 236, so the table's numbers stand. Board has no API
 * entries.
 */
const BOARD_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 210, height: 236 },
}

/**
 * The switch pane minimum in px, from the same table's SetPosition row, 147 x 105, because
 * `SwitchWidget` is SetPosition only in phase 4. An estimate. Switch has no API entries.
 */
const SWITCH_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 147, height: 105 },
}

/**
 * The button pane minimum in px, from the table's Push row, 162 x 85, with the height raised to
 * the rendered widget: `scrollHeight` 90 at 160 px plus 2 px of borders is 92. Min-content 136 + 2
 * sits under 162. Push is also the control interface, and button has no API entries.
 */
const BUTTON_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 162, height: 92 },
}

/**
 * The sensor pane minimum in px, measured from the rendered widget by
 * `__tests__/pane-minimums.svelte.spec.ts`, which fails when this row drifts more than 2 px. It
 * replaces the "Batch 5.1 measured sizes" board estimate, 162 x 131. The height holds four
 * readings. GetReadings is the composite and the control interface. Sensor has no API entries.
 */
const SENSOR_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 261, height: 399 },
}

/**
 * The movement sensor pane minimums in px, measured by the same spec, not board estimates. The
 * composite reports every method supported, with its readings hidden. GetAccuracy's height has no
 * accuracy keys. Each API pane is as wide as its header, which holds the method's name.
 */
const MOVEMENT_SENSOR_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 241, height: 1220 },
	'get-position': { width: 232, height: 193 },
	'get-orientation': { width: 254, height: 145 },
	'get-compass-heading': { width: 275, height: 131 },
	'get-accuracy': { width: 232, height: 227 },
}

/**
 * The power sensor pane minimums in px, measured by the same spec, not board estimates. The
 * composite's readings are hidden.
 */
const POWER_SENSOR_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 213, height: 453 },
	'get-voltage': { width: 225, height: 125 },
	'get-current': { width: 225, height: 125 },
	'get-power': { width: 210, height: 125 },
}

/**
 * The encoder pane minimums in px, measured by the same spec, not board estimates, with both
 * angle and ticks supported.
 */
const ENCODER_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 213, height: 319 },
	'get-position': { width: 232, height: 125 },
}

/**
 * The input controller pane minimum in px, measured by the same spec, not a board estimate, with
 * four controls. A resource named `webgamepad` also renders the gamepad and scrolls at this
 * height. Input controller has no API entries.
 */
const INPUT_CONTROLLER_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 213, height: 387 },
}

/**
 * The camera pane minimum in px, measured by the same spec, not the "Batch 5.2 measured sizes"
 * estimates. The height is the ratio-wins floor: the header, the 16:9 feed at the minimum width,
 * the controls below it, and GetPointCloud waiting on its splash. Camera has no API entries.
 */
const CAMERA_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 229, height: 809 },
}

/**
 * The vision service pane minimum in px, measured by the same spec, not a board estimate. The
 * capture is a 16:9 frame with detections and classifications, and object point clouds wait on
 * their splash. Vision has no API entries.
 */
const VISION_PANE_MINIMUMS: Readonly<Record<string, PaneSize>> = {
	[COMPOSITE_SLOT]: { width: 266, height: 804 },
}

const PANE_MINIMUMS: Readonly<Record<string, Readonly<Record<string, PaneSize>>>> = {
	[ResourceTriplets.Motor]: MOTOR_PANE_MINIMUMS,
	[ResourceTriplets.Arm]: ARM_PANE_MINIMUMS,
	[ResourceTriplets.Motion]: MOTION_PANE_MINIMUMS,
	[ResourceTriplets.Base]: BASE_PANE_MINIMUMS,
	[ResourceTriplets.Gantry]: GANTRY_PANE_MINIMUMS,
	[ResourceTriplets.Servo]: SERVO_PANE_MINIMUMS,
	[ResourceTriplets.Gripper]: GRIPPER_PANE_MINIMUMS,
	[ResourceTriplets.Board]: BOARD_PANE_MINIMUMS,
	[ResourceTriplets.Switch]: SWITCH_PANE_MINIMUMS,
	[ResourceTriplets.Button]: BUTTON_PANE_MINIMUMS,
	[ResourceTriplets.Sensor]: SENSOR_PANE_MINIMUMS,
	[ResourceTriplets.MovementSensor]: MOVEMENT_SENSOR_PANE_MINIMUMS,
	[ResourceTriplets.PowerSensor]: POWER_SENSOR_PANE_MINIMUMS,
	[ResourceTriplets.Encoder]: ENCODER_PANE_MINIMUMS,
	[ResourceTriplets.InputController]: INPUT_CONTROLLER_PANE_MINIMUMS,
	[ResourceTriplets.Camera]: CAMERA_PANE_MINIMUMS,
	[ResourceTriplets.Vision]: VISION_PANE_MINIMUMS,
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
