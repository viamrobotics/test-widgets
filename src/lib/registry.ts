import type { ResourceName } from '@viamrobotics/sdk'

import type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetEntry,
	ResourceWidgetSize,
} from './resource-widget-types.ts'

import {
	ArmGetJointPositionsWidget,
	ArmIsMovingWidget,
	ArmManualModeWidget,
	ArmMoveToJointPositionsWidget,
	ArmMoveToPositionWidget,
	ArmStopWidget,
	ArmWidget,
	AudioInputControls,
	AudioInputGetAudioWidget,
	AudioInputGetPropertiesWidget,
	AudioInputWidget,
	AudioOutputControls,
	AudioOutputGetPropertiesWidget,
	AudioOutputPlayWidget,
	AudioOutputWidget,
	BaseIsMovingWidget,
	BaseMoveStraightWidget,
	BaseQuickMoveWidget,
	BaseSetPowerWidget,
	BaseSetVelocityWidget,
	BaseSpinWidget,
	BaseStopWidget,
	BaseWidget,
	BoardWidget,
	ButtonWidget,
	CameraControls,
	CameraGetImagesWidget,
	CameraGetPointCloudWidget,
	CameraGetPropertiesWidget,
	CameraWidget,
	DiscoveryControls,
	DiscoveryDiscoverResourcesWidget,
	DiscoveryWidget,
	EncoderGetPositionWidget,
	EncoderWidget,
	GantryGetPositionWidget,
	GantryHomeWidget,
	GantryIsMovingWidget,
	GantryMoveToPositionWidget,
	GantryQuickMoveWidget,
	GantryWidget,
	GripperGrabWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperOpenGrabWidget,
	GripperOpenWidget,
	GripperStopWidget,
	GripperWidget,
	InputControllerWidget,
	MLModelServiceMetadataWidget,
	MLModelServiceWidget,
	MotionServiceWidget,
	MotorGoForWidget,
	MotorGoToWidget,
	MotorIsMovingWidget,
	MotorQuickMoveWidget,
	MotorSetPowerWidget,
	MotorSetRPMWidget,
	MotorWidget,
	MovementSensorGetAccuracyWidget,
	MovementSensorGetCompassHeadingWidget,
	MovementSensorGetOrientationWidget,
	MovementSensorGetPositionWidget,
	MovementSensorWidget,
	NavigationAddWaypointWidget,
	NavigationGetLocationWidget,
	NavigationGetModeWidget,
	NavigationGetObstaclesWidget,
	NavigationGetWaypointsWidget,
	NavigationRemoveWaypointWidget,
	NavigationServiceControls,
	NavigationServiceWidget,
	NavigationSetModeWidget,
	PowerSensorGetCurrentWidget,
	PowerSensorGetPowerWidget,
	PowerSensorGetVoltageWidget,
	PowerSensorWidget,
	SensorWidget,
	ServoGetPositionWidget,
	ServoIsMovingWidget,
	ServoMoveWidget,
	ServoQuickMoveWidget,
	ServoStopWidget,
	ServoWidget,
	SlamControls,
	SlamGetPointCloudMapWidget,
	SlamGetPositionWidget,
	SlamGetPropertiesWidget,
	SlamWidget,
	SwitchWidget,
	VisionServiceCaptureAllFromCameraWidget,
	VisionServiceControls,
	VisionServiceGetClassificationsFromCameraWidget,
	VisionServiceGetClassificationsWidget,
	VisionServiceGetDetectionsFromCameraWidget,
	VisionServiceGetDetectionsWidget,
	VisionServiceGetObjectPointCloudsWidget,
	VisionServiceGetPropertiesWidget,
	VisionServiceWidget,
} from './components/index.ts'
import { getResourceAPI } from './get-resource-api.ts'
import { type ResourceTriplet, ResourceTriplets } from './resource-triplet.ts'

/** Tailwind's `@xs` container query width, the one-column field layout. */
const CONTAINER_XS = 320
/** Tailwind's `@2xl` container query width. */
const CONTAINER_2XL = 672
/** Tailwind's `@4xl` container query width. */
const CONTAINER_4XL = 896
/**
 * design-decisions.md: "A wide single-API pane caps its field column at 320 px". With the body's
 * 8 px padding each side, the widget's box stops at 336.
 */
const FIELD_COLUMN_MAX_WIDTH = 336
/** The `max-w-172` cap on the servo and gripper composites. */
const CAPPED_COMPOSITE_MAX_WIDTH = 688
/** Three 320 px field columns, two 16 px gaps, and 16 px padding each side: motor's and base's cap. */
const THREE_FIELD_COLUMNS_MAX_WIDTH = 1024
/** Two 640 px columns, a 16 px gap, and 16 px padding each side, from the Arm-Frames board. */
const ARM_TWO_COLUMNS_MAX_WIDTH = 1328

/**
 * Maps a resource's API triplet to its composite test card and individual API widgets.
 * Referencing this pulls every widget (and its optional peers) into the build, which is
 * why the lookups below live behind the `/registry` entry point rather than the root.
 *
 * Each `size` is the widget's own box, taken from the pane minimums measured in the `/panes`
 * playground or the plan's size tables, less the pane's 2 px of borders and 33 px header.
 */
const resourceWidgetRegistry: Partial<Record<ResourceTriplet, ResourceWidgetEntry>> = {
	// components
	// Measured in the playground, with the Arm-Frames board for the widths above. Recommended widths
	// under a measured minimum are raised to it.
	[ResourceTriplets.Arm]: {
		widget: ArmWidget,
		size: {
			minWidth: 221,
			minHeight: 1747,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, ARM_TWO_COLUMNS_MAX_WIDTH],
			maxWidth: ARM_TWO_COLUMNS_MAX_WIDTH,
		},
		apis: [
			{
				id: 'move-to-joint-positions',
				label: 'MoveToJointPositions',
				widgets: [ArmMoveToJointPositionsWidget],
				size: {
					minWidth: 196,
					minHeight: 547,
					recommendedWidths: [228, CONTAINER_XS],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'move-to-position',
				label: 'MoveToPosition',
				widgets: [ArmMoveToPositionWidget],
				size: {
					minWidth: 213,
					minHeight: 582,
					recommendedWidths: [228, 638],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'get-joint-positions',
				label: 'GetJointPositions',
				widgets: [ArmGetJointPositionsWidget],
				size: {
					minWidth: 186,
					minHeight: 276,
					recommendedWidths: [186, 294],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				widgets: [ArmIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [240], maxWidth: 240 },
			},
			{
				id: 'manual-mode',
				label: 'Manual mode',
				widgets: [ArmManualModeWidget],
				size: {
					minWidth: 193,
					minHeight: 198,
					recommendedWidths: [198, 294],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'stop',
				label: 'Stop',
				widgets: [ArmStopWidget],
				size: { minWidth: 92, minHeight: 66, recommendedWidths: [214], maxWidth: 214 },
			},
		],
	},
	// Measured in the playground. No table covers audio input: one width each, capped by the field
	// column, and the composite and control by its `@2xl`. The composite body has no min-content, so
	// it takes its narrowest entry's width.
	[ResourceTriplets.AudioInput]: {
		widget: AudioInputWidget,
		size: { minWidth: 108, minHeight: 369, recommendedWidths: [108], maxWidth: CONTAINER_2XL },
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [AudioInputControls],
				size: { minWidth: 108, minHeight: 232, recommendedWidths: [108], maxWidth: CONTAINER_2XL },
			},
			{
				id: 'get-audio',
				label: 'GetAudio',
				widgets: [AudioInputGetAudioWidget],
				size: {
					minWidth: 282,
					minHeight: 148,
					recommendedWidths: [282],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				widgets: [AudioInputGetPropertiesWidget],
				size: {
					minWidth: 237,
					minHeight: 112,
					recommendedWidths: [237],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground. No table covers audio output. Its composite has no breakpoint, so
	// it stops at the field column, and the control at its own `@2xl`. The composite body has no
	// min-content, so it takes its narrowest entry's width.
	[ResourceTriplets.AudioOutput]: {
		widget: AudioOutputWidget,
		size: {
			minWidth: 114,
			minHeight: 415,
			recommendedWidths: [114],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [AudioOutputControls],
				size: { minWidth: 114, minHeight: 165, recommendedWidths: [114], maxWidth: CONTAINER_2XL },
			},
			{
				id: 'play',
				label: 'Play',
				widgets: [AudioOutputPlayWidget],
				size: {
					minWidth: 252,
					minHeight: 194,
					recommendedWidths: [252],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				widgets: [AudioOutputGetPropertiesWidget],
				size: {
					minWidth: 237,
					minHeight: 112,
					recommendedWidths: [237],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground, idle, with "Batch 4.2 measured sizes" for the widths above. Three
	// recommended widths under a measured minimum are raised to it.
	[ResourceTriplets.Base]: {
		widget: BaseWidget,
		size: {
			minWidth: 169,
			minHeight: 1009,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: THREE_FIELD_COLUMNS_MAX_WIDTH,
		},
		apis: [
			{
				id: 'quick-move',
				label: 'Quick move',
				widgets: [BaseQuickMoveWidget],
				size: {
					minWidth: 289,
					minHeight: 204,
					recommendedWidths: [289],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'move-straight',
				label: 'MoveStraight',
				widgets: [BaseMoveStraightWidget],
				size: {
					minWidth: 297,
					minHeight: 118,
					recommendedWidths: [297],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'spin',
				label: 'Spin',
				widgets: [BaseSpinWidget],
				size: {
					minWidth: 286,
					minHeight: 118,
					recommendedWidths: [286],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-power',
				label: 'SetPower',
				widgets: [BaseSetPowerWidget],
				size: {
					minWidth: 115,
					minHeight: 182,
					recommendedWidths: [246],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-velocity',
				label: 'SetVelocity',
				widgets: [BaseSetVelocityWidget],
				// The api header's floor less its borders. Narrower, its rows wrap 16 px taller.
				size: {
					minWidth: 150,
					minHeight: 182,
					recommendedWidths: [268],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				widgets: [BaseIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [235], maxWidth: 235 },
			},
			{
				id: 'stop',
				label: 'Stop',
				widgets: [BaseStopWidget],
				size: { minWidth: 92, minHeight: 66, recommendedWidths: [210], maxWidth: 210 },
			},
		],
	},
	// "Batch 4.3 measured sizes", the pins surface row. Its height is the rendered body.
	[ResourceTriplets.Board]: {
		widget: BoardWidget,
		size: { minWidth: 208, minHeight: 231, recommendedWidths: [208, 528], maxWidth: 528 },
		apis: [],
	},
	// "Batch 4.3 measured sizes", the Push row. Its height is the rendered body.
	[ResourceTriplets.Button]: {
		widget: ButtonWidget,
		size: { minWidth: 160, minHeight: 90, recommendedWidths: [175], maxWidth: 175 },
		apis: [],
	},
	// Measured in the playground, with "Batch 5.2 measured sizes, revision 2" for the widths above.
	[ResourceTriplets.Camera]: {
		widget: CameraWidget,
		size: {
			minWidth: 276,
			minHeight: 762,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [CameraControls],
				size: {
					minWidth: 227,
					minHeight: 442,
					recommendedWidths: [CONTAINER_XS, 413],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-images',
				label: 'GetImages',
				widgets: [CameraGetImagesWidget],
				size: {
					minWidth: 182,
					minHeight: 120,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-point-cloud',
				label: 'GetPointCloud',
				widgets: [CameraGetPointCloudWidget],
				size: {
					minWidth: 137,
					minHeight: 58,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				widgets: [CameraGetPropertiesWidget],
				size: {
					minWidth: 276,
					minHeight: 454,
					recommendedWidths: [CONTAINER_XS],
					maxWidth: CONTAINER_XS,
				},
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above.
	[ResourceTriplets.Encoder]: {
		widget: EncoderWidget,
		size: {
			minWidth: 211,
			minHeight: 284,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'get-position',
				label: 'GetPosition',
				widgets: [EncoderGetPositionWidget],
				size: { minWidth: 162, minHeight: 90, recommendedWidths: [272], maxWidth: 272 },
			},
		],
	},
	// Measured in the playground with three axes, with "Batch 4.2 measured sizes" for the widths
	// above. Quick move's recommended width is raised to its measured minimum.
	[ResourceTriplets.Gantry]: {
		widget: GantryWidget,
		size: {
			minWidth: 169,
			minHeight: 1348,
			recommendedWidths: [198, CONTAINER_2XL],
			maxWidth: CONTAINER_2XL,
		},
		apis: [
			{
				id: 'home',
				label: 'Home',
				widgets: [GantryHomeWidget],
				// The api header's floor less its borders. Narrower, its rows wrap 16 px taller.
				size: { minWidth: 150, minHeight: 148, recommendedWidths: [234], maxWidth: 234 },
			},
			{
				id: 'move-to-position',
				label: 'MoveToPosition',
				widgets: [GantryMoveToPositionWidget],
				// 317 is the widget's `@[317px]` container query, where each axis takes two cells.
				size: {
					minWidth: 142,
					minHeight: 518,
					recommendedWidths: [162, 317],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'quick-move',
				label: 'Quick move',
				widgets: [GantryQuickMoveWidget],
				size: {
					minWidth: 190,
					minHeight: 206,
					recommendedWidths: [190],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				widgets: [GantryGetPositionWidget],
				size: {
					minWidth: 176,
					minHeight: 262,
					recommendedWidths: [279],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				widgets: [GantryIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [260], maxWidth: 260 },
			},
		],
	},
	// "Batch 4.3 measured sizes", raised to the rendered widgets: heights are the rendered bodies.
	[ResourceTriplets.Gripper]: {
		widget: GripperWidget,
		size: {
			minWidth: 238,
			minHeight: 205,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CAPPED_COMPOSITE_MAX_WIDTH,
		},
		apis: [
			{
				id: 'open-grab',
				label: 'Open / Grab',
				widgets: [GripperOpenGrabWidget],
				size: { minWidth: 188, minHeight: 92, recommendedWidths: [203], maxWidth: 203 },
			},
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				widgets: [GripperIsHoldingSomethingWidget],
				size: {
					minWidth: 194,
					minHeight: 97,
					recommendedWidths: [CONTAINER_XS],
					maxWidth: CONTAINER_XS,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				widgets: [GripperIsMovingWidget],
				size: { minWidth: 96, minHeight: 97, recommendedWidths: [253], maxWidth: 253 },
			},
			{
				id: 'open',
				label: 'Open',
				widgets: [GripperOpenWidget],
				size: { minWidth: 81, minHeight: 94, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'grab',
				label: 'Grab',
				widgets: [GripperGrabWidget],
				size: { minWidth: 115, minHeight: 140, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'stop',
				label: 'Stop',
				widgets: [GripperStopWidget],
				size: { minWidth: 92, minHeight: 102, recommendedWidths: [227], maxWidth: 227 },
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above.
	[ResourceTriplets.InputController]: {
		widget: InputControllerWidget,
		size: {
			minWidth: 211,
			minHeight: 352,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [],
	},
	// Measured in the playground, with the Motor-Frames board for the widths above. Recommended widths
	// under a measured minimum are raised to it.
	[ResourceTriplets.Motor]: {
		widget: MotorWidget,
		size: {
			minWidth: 288,
			minHeight: 970,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: THREE_FIELD_COLUMNS_MAX_WIDTH,
		},
		apis: [
			{
				id: 'quick-move',
				label: 'Quick move',
				widgets: [MotorQuickMoveWidget],
				size: {
					minWidth: 276,
					minHeight: 152,
					recommendedWidths: [276, 285],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-power',
				label: 'SetPower',
				widgets: [MotorSetPowerWidget],
				size: {
					minWidth: 192,
					minHeight: 92,
					recommendedWidths: [192, 266],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-rpm',
				label: 'SetRPM',
				widgets: [MotorSetRPMWidget],
				size: {
					minWidth: 248,
					minHeight: 92,
					recommendedWidths: [248, 266],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'go-for',
				label: 'GoFor',
				widgets: [MotorGoForWidget],
				size: {
					minWidth: 288,
					minHeight: 118,
					recommendedWidths: [288],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'go-to',
				label: 'GoTo',
				widgets: [MotorGoToWidget],
				size: {
					minWidth: 268,
					minHeight: 118,
					recommendedWidths: [268],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				widgets: [MotorIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [240], maxWidth: 240 },
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above. Two
	// recommended widths sit under their measured minimums and are raised to them.
	[ResourceTriplets.MovementSensor]: {
		widget: MovementSensorWidget,
		size: {
			minWidth: 239,
			minHeight: 1185,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'get-position',
				label: 'GetPosition',
				widgets: [MovementSensorGetPositionWidget],
				size: {
					minWidth: 206,
					minHeight: 158,
					recommendedWidths: [206],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-orientation',
				label: 'GetOrientation',
				widgets: [MovementSensorGetOrientationWidget],
				size: {
					minWidth: 108,
					minHeight: 126,
					recommendedWidths: [280],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-compass-heading',
				label: 'GetCompassHeading',
				widgets: [MovementSensorGetCompassHeadingWidget],
				size: {
					minWidth: 209,
					minHeight: 96,
					recommendedWidths: [209],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-accuracy',
				label: 'GetAccuracy',
				widgets: [MovementSensorGetAccuracyWidget],
				size: {
					minWidth: 183,
					minHeight: 192,
					recommendedWidths: [216],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above.
	[ResourceTriplets.PowerSensor]: {
		widget: PowerSensorWidget,
		size: {
			minWidth: 211,
			minHeight: 418,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CONTAINER_2XL,
		},
		apis: [
			{
				id: 'get-voltage',
				label: 'GetVoltage',
				widgets: [PowerSensorGetVoltageWidget],
				size: { minWidth: 195, minHeight: 90, recommendedWidths: [298], maxWidth: 298 },
			},
			{
				id: 'get-current',
				label: 'GetCurrent',
				widgets: [PowerSensorGetCurrentWidget],
				size: { minWidth: 187, minHeight: 90, recommendedWidths: [298], maxWidth: 298 },
			},
			{
				id: 'get-power',
				label: 'GetPower',
				widgets: [PowerSensorGetPowerWidget],
				size: { minWidth: 176, minHeight: 90, recommendedWidths: [285], maxWidth: 285 },
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above. Its first
	// recommended width sits under the measured minimum and is raised to it.
	[ResourceTriplets.Sensor]: {
		widget: SensorWidget,
		size: { minWidth: 259, minHeight: 364, recommendedWidths: [259, 528], maxWidth: 528 },
		apis: [],
	},
	// Measured in the playground, with "Batch 4.2 measured sizes" for the widths above. Move's
	// recommended widths sit under its measured minimum, so it recommends that minimum alone.
	[ResourceTriplets.Servo]: {
		widget: ServoWidget,
		size: {
			minWidth: 169,
			minHeight: 511,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CAPPED_COMPOSITE_MAX_WIDTH,
		},
		apis: [
			{
				id: 'move',
				label: 'Move',
				widgets: [ServoMoveWidget],
				size: {
					minWidth: 276,
					minHeight: 120,
					recommendedWidths: [276],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'quick-move',
				label: 'Quick move',
				widgets: [ServoQuickMoveWidget],
				size: { minWidth: 95, minHeight: 208, recommendedWidths: [168], maxWidth: 168 },
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				widgets: [ServoIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [240], maxWidth: 240 },
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				widgets: [ServoGetPositionWidget],
				size: { minWidth: 140, minHeight: 106, recommendedWidths: [259], maxWidth: 259 },
			},
			{
				id: 'stop',
				label: 'Stop',
				widgets: [ServoStopWidget],
				size: { minWidth: 92, minHeight: 66, recommendedWidths: [214], maxWidth: 214 },
			},
		],
	},
	// "Batch 4.3 measured sizes", the SetPosition row, because the card is SetPosition only.
	[ResourceTriplets.Switch]: {
		widget: SwitchWidget,
		size: {
			minWidth: 145,
			minHeight: 70,
			recommendedWidths: [205, CONTAINER_XS],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [],
	},

	// services
	// Measured in the playground. No table covers discovery. Its composite has no breakpoint, so it
	// stops at the field column, and the control at its own `@2xl`.
	[ResourceTriplets.Discovery]: {
		widget: DiscoveryWidget,
		size: {
			minWidth: 189,
			minHeight: 88,
			recommendedWidths: [189],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [DiscoveryControls],
				size: { minWidth: 217, minHeight: 432, recommendedWidths: [217], maxWidth: CONTAINER_2XL },
			},
			{
				id: 'discover-resources',
				label: 'DiscoverResources',
				widgets: [DiscoveryDiscoverResourcesWidget],
				size: {
					minWidth: 170,
					minHeight: 92,
					recommendedWidths: [170],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground. No table covers the ML model service, and its composite has no
	// breakpoint, so both stop at the field column.
	[ResourceTriplets.MLModel]: {
		widget: MLModelServiceWidget,
		size: {
			minWidth: 286,
			minHeight: 456,
			recommendedWidths: [286],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [
			{
				id: 'metadata',
				label: 'Metadata',
				widgets: [MLModelServiceMetadataWidget],
				size: {
					minWidth: 286,
					minHeight: 426,
					recommendedWidths: [286],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground, with the Motion-Frames board for the widths above: one column from
	// 320, and the pose editor's two columns from a 640 px pane.
	[ResourceTriplets.Motion]: {
		widget: MotionServiceWidget,
		size: {
			minWidth: 240,
			minHeight: 668,
			recommendedWidths: [CONTAINER_XS, 638],
			maxWidth: CONTAINER_2XL,
		},
		apis: [],
	},
	// Measured in the playground. No table covers navigation: one width each, capped by the field
	// column, and the composite and control by the composite's `@4xl`.
	[ResourceTriplets.Navigation]: {
		widget: NavigationServiceWidget,
		size: { minWidth: 116, minHeight: 1190, recommendedWidths: [116], maxWidth: CONTAINER_4XL },
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [NavigationServiceControls],
				size: { minWidth: 248, minHeight: 393, recommendedWidths: [248], maxWidth: CONTAINER_4XL },
			},
			{
				id: 'get-mode',
				label: 'GetMode',
				widgets: [NavigationGetModeWidget],
				size: {
					minWidth: 108,
					minHeight: 76,
					recommendedWidths: [108],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-mode',
				label: 'SetMode',
				widgets: [NavigationSetModeWidget],
				size: {
					minWidth: 248,
					minHeight: 86,
					recommendedWidths: [248],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-location',
				label: 'GetLocation',
				widgets: [NavigationGetLocationWidget],
				size: {
					minWidth: 141,
					minHeight: 180,
					recommendedWidths: [141],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-waypoints',
				label: 'GetWaypoints',
				widgets: [NavigationGetWaypointsWidget],
				size: {
					minWidth: 137,
					minHeight: 100,
					recommendedWidths: [137],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'add-waypoint',
				label: 'AddWaypoint',
				widgets: [NavigationAddWaypointWidget],
				size: {
					minWidth: 257,
					minHeight: 118,
					recommendedWidths: [257],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'remove-waypoint',
				label: 'RemoveWaypoint',
				widgets: [NavigationRemoveWaypointWidget],
				size: {
					minWidth: 180,
					minHeight: 108,
					recommendedWidths: [180],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-obstacles',
				label: 'GetObstacles',
				widgets: [NavigationGetObstaclesWidget],
				size: {
					minWidth: 232,
					minHeight: 290,
					recommendedWidths: [232],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground. No table covers SLAM: one width each, capped by the field column,
	// and the composite and control by the composite's `@2xl`.
	[ResourceTriplets.Slam]: {
		widget: SlamWidget,
		size: { minWidth: 223, minHeight: 716, recommendedWidths: [223], maxWidth: CONTAINER_2XL },
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [SlamControls],
				size: { minWidth: 248, minHeight: 548, recommendedWidths: [248], maxWidth: CONTAINER_2XL },
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				widgets: [SlamGetPositionWidget],
				size: {
					minWidth: 223,
					minHeight: 316,
					recommendedWidths: [223],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-point-cloud-map',
				label: 'GetPointCloudMap',
				widgets: [SlamGetPointCloudMapWidget],
				size: {
					minWidth: 165,
					minHeight: 110,
					recommendedWidths: [165],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				widgets: [SlamGetPropertiesWidget],
				size: {
					minWidth: 244,
					minHeight: 206,
					recommendedWidths: [244],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground, with "Batch 5.2 measured sizes, revision 2" for the widths above
	// and, where it has no row, "Batch 5.2 measured sizes".
	[ResourceTriplets.Vision]: {
		widget: VisionServiceWidget,
		size: {
			minWidth: 293,
			minHeight: 1477,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				widgets: [VisionServiceControls],
				size: {
					minWidth: 264,
					minHeight: 423,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'capture-all-from-camera',
				label: 'CaptureAllFromCamera',
				widgets: [VisionServiceCaptureAllFromCameraWidget],
				size: {
					minWidth: 272,
					minHeight: 268,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				widgets: [VisionServiceGetPropertiesWidget],
				size: {
					minWidth: 263,
					minHeight: 151,
					recommendedWidths: [302],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-object-point-clouds',
				label: 'GetObjectPointClouds',
				widgets: [VisionServiceGetObjectPointCloudsWidget],
				size: {
					minWidth: 200,
					minHeight: 182,
					recommendedWidths: [347, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-detections-from-camera',
				label: 'GetDetectionsFromCamera',
				widgets: [VisionServiceGetDetectionsFromCameraWidget],
				size: { minWidth: 230, minHeight: 142, recommendedWidths: [369], maxWidth: 369 },
			},
			{
				id: 'get-classifications-from-camera',
				label: 'GetClassificationsFromCamera',
				widgets: [VisionServiceGetClassificationsFromCameraWidget],
				size: { minWidth: 230, minHeight: 188, recommendedWidths: [414], maxWidth: 414 },
			},
			{
				id: 'get-detections',
				label: 'GetDetections',
				widgets: [VisionServiceGetDetectionsWidget],
				size: {
					minWidth: 269,
					minHeight: 134,
					recommendedWidths: [302],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-classifications',
				label: 'GetClassifications',
				widgets: [VisionServiceGetClassificationsWidget],
				size: {
					minWidth: 269,
					minHeight: 168,
					recommendedWidths: [339],
					maxWidth: CONTAINER_4XL,
				},
			},
		],
	},
}

/** The registry entry for a resource's API triplet, or `undefined` for an unregistered resource. */
const entryForResource = (resource: ResourceName): ResourceWidgetEntry | undefined =>
	resourceWidgetRegistry[getResourceAPI(resource) as ResourceTriplet]

/**
 * Returns a resource's individual API widgets. Each entry carries a stable `id`, a
 * display `label`, the `widgets` to render with `{ partID, resourceName }`, and their `size`.
 *
 * Returns `[]` for a resource with a card but no standalone API widgets, and for
 * unrecognized resources.
 *
 * @example
 * apiWidgetsForResource(gripperResourceName)
 * // [{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenGrabWidget], size: {...} }, ...]
 */
export const apiWidgetsForResource = (resource: ResourceName): ResourceAPIWidget[] =>
	entryForResource(resource)?.apis ?? []

/**
 * Returns every resource triplet that has a test card, mapped to its API widgets.
 * Use this to enumerate the full catalog, e.g. a menu spanning every resource type;
 * for a single resource, prefer `apiWidgetsForResource`.
 *
 * @example
 * availableAPIWidgets()[ResourceTriplets.Gripper]
 * // [{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenGrabWidget], size: {...} }, ...]
 */
export const availableAPIWidgets = (): Partial<Record<ResourceTriplet, ResourceAPIWidget[]>> => {
	const result: Partial<Record<ResourceTriplet, ResourceAPIWidget[]>> = {}
	for (const [api, entry] of Object.entries(resourceWidgetRegistry)) {
		if (entry) result[api as ResourceTriplet] = entry.apis
	}

	return result
}

/** Returns the full composite test card for a resource, or `undefined` if none exists. */
export const widgetForResource = (resource: ResourceName): ResourceWidget | undefined =>
	entryForResource(resource)?.widget

/**
 * Returns the layout sizes of the card `widgetForResource` returns, in px of the widget's own box,
 * or `undefined` when the resource has no card. Each API widget carries its own `size`.
 *
 * @example
 * widgetSizeForResource(servoResourceName)
 * // { minWidth: 169, minHeight: 511, recommendedWidths: [320, 672], maxWidth: 688 }
 */
export const widgetSizeForResource = (resource: ResourceName): ResourceWidgetSize | undefined =>
	entryForResource(resource)?.size

// Re-exported so `/registry` consumers can type the lookups' return values without importing
// from the root entry.
export type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetProps,
	ResourceWidgetSize,
} from './resource-widget-types.ts'
