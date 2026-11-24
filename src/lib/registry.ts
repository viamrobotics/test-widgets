import type { ResourceName } from '@viamrobotics/sdk'

import type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetEntry,
	ResourceWidgetSize,
} from './resource-widget-types.ts'

import {
	ARM_SCENE_POP_OUT_SIZE,
	ArmControls,
	ArmGetEndPositionWidget,
	ArmGetJointPositionsWidget,
	ArmGetManualModeWidget,
	ArmGetPropertiesWidget,
	ArmIsMovingWidget,
	ArmJogControl,
	ArmJointsControl,
	ArmManualModeControl,
	ArmMoveToJointPositionsWidget,
	ArmMoveToPositionWidget,
	ArmSetManualModeWidget,
	ArmStopWidget,
	ArmWidget,
	AudioInputControls,
	AudioInputGetAudioWidget,
	AudioInputGetPropertiesWidget,
	AudioInputWidget,
	AudioOutputControls,
	AudioOutputGetPropertiesWidget,
	AudioOutputPlayStreamWidget,
	AudioOutputPlayWidget,
	AudioOutputWidget,
	BaseControls,
	BaseGetPropertiesWidget,
	BaseIsMovingWidget,
	BaseMoveStraightWidget,
	BaseQuickMoveControl,
	BaseSetPowerWidget,
	BaseSetVelocityWidget,
	BaseSpinWidget,
	BaseStopWidget,
	BaseWidget,
	BoardControls,
	BoardGetDigitalInterruptValueWidget,
	BoardGetGPIOWidget,
	BoardPinsControl,
	BoardPWMFrequencyWidget,
	BoardPWMWidget,
	BoardReadAnalogReaderWidget,
	BoardSetGPIOWidget,
	BoardSetPowerModeWidget,
	BoardSetPWMFrequencyWidget,
	BoardSetPWMWidget,
	BoardStreamTicksWidget,
	BoardWidget,
	BoardWriteAnalogWidget,
	ButtonWidget,
	CameraControls,
	CameraGetImagesWidget,
	CameraGetPointCloudWidget,
	CameraGetPropertiesWidget,
	CameraWidget,
	DiscoveryControls,
	DiscoveryDiscoverResourcesWidget,
	DiscoveryWidget,
	EncoderControls,
	EncoderGetPositionWidget,
	EncoderGetPropertiesWidget,
	EncoderResetPositionWidget,
	EncoderWidget,
	GantryControls,
	GantryGetLengthsWidget,
	GantryGetPositionWidget,
	GantryHomeWidget,
	GantryIsMovingWidget,
	GantryMoveToPositionWidget,
	GantryQuickMoveControl,
	GantryStopWidget,
	GantryWidget,
	GripperControls,
	GripperGetCurrentInputsWidget,
	GripperGoToInputsWidget,
	GripperGrabWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperOpenGrabControl,
	GripperOpenWidget,
	GripperStopWidget,
	GripperWidget,
	InputControllerGetEventsWidget,
	InputControllerTriggerEventWidget,
	InputControllerWidget,
	MLModelServiceInferWidget,
	MLModelServiceMetadataWidget,
	MLModelServiceWidget,
	MotionServiceWidget,
	MotorControls,
	MotorGetPositionWidget,
	MotorGetPropertiesWidget,
	MotorGoForWidget,
	MotorGoToWidget,
	MotorIsMovingWidget,
	MotorIsPoweredWidget,
	MotorMoveControl,
	MotorQuickMoveControl,
	MotorResetZeroPositionWidget,
	MotorSetPowerWidget,
	MotorSetRPMWidget,
	MotorStopWidget,
	MotorWidget,
	MovementSensorControls,
	MovementSensorGetAccuracyWidget,
	MovementSensorGetAngularVelocityWidget,
	MovementSensorGetCompassHeadingWidget,
	MovementSensorGetLinearAccelerationWidget,
	MovementSensorGetLinearVelocityWidget,
	MovementSensorGetOrientationWidget,
	MovementSensorGetPositionWidget,
	MovementSensorGetPropertiesWidget,
	MovementSensorGetReadingsWidget,
	MovementSensorWidget,
	NavigationAddWaypointWidget,
	NavigationGetLocationWidget,
	NavigationGetModeWidget,
	NavigationGetObstaclesWidget,
	NavigationGetPathsWidget,
	NavigationGetPropertiesWidget,
	NavigationGetWaypointsWidget,
	NavigationRemoveWaypointWidget,
	NavigationServiceControls,
	NavigationServiceWidget,
	NavigationSetModeWidget,
	PowerSensorControls,
	PowerSensorGetCurrentWidget,
	PowerSensorGetPowerWidget,
	PowerSensorGetReadingsWidget,
	PowerSensorGetVoltageWidget,
	PowerSensorWidget,
	SensorWidget,
	ServoControls,
	ServoGetPositionWidget,
	ServoIsMovingWidget,
	ServoMoveToControl,
	ServoMoveWidget,
	ServoQuickMoveControl,
	ServoStopWidget,
	ServoWidget,
	SlamControls,
	SlamGetInternalStateWidget,
	SlamGetPointCloudMapWidget,
	SlamGetPositionWidget,
	SlamGetPropertiesWidget,
	SlamWidget,
	SwitchControls,
	SwitchGetNumberOfPositionsWidget,
	SwitchGetPositionWidget,
	SwitchPositionWidget,
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
/**
 * Base controls and quick move stop growing at 550 px, from the Base-Control board's "two columns
 * from 448 px": 196 px of pad, a 16 px gap, the 320 px column, 16 px of padding, and the borders.
 * Wider holds only whitespace.
 */
const BASE_CONTROLS_MAX_WIDTH = 550
/** Two 640 px columns, a 16 px gap, and 16 px padding each side, from the Arm-Frames board. */
const ARM_TWO_COLUMNS_MAX_WIDTH = 1328
/** The readings list's two columns, from the PowerSensor-Frames and MovementSensor-Frames boards. */
const READINGS_TWO_COLUMNS_WIDTH = 530
/** Two 320 px folders, a 16 px gap, and padding, where the motor Controls interface stops growing. */
const MOTOR_CONTROLS_TWO_FOLDERS_WIDTH = 672

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
			minHeight: 2022,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, ARM_TWO_COLUMNS_MAX_WIDTH],
			maxWidth: ARM_TWO_COLUMNS_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [ArmControls],
				popOutSize: ARM_SCENE_POP_OUT_SIZE,
				size: {
					minWidth: 239,
					minHeight: 932,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, ARM_TWO_COLUMNS_MAX_WIDTH],
					maxWidth: ARM_TWO_COLUMNS_MAX_WIDTH,
				},
			},
			{
				id: 'jog',
				label: 'Jog',
				kind: 'control',
				widgets: [ArmJogControl],
				size: {
					minWidth: 239,
					minHeight: 372,
					recommendedWidths: [CONTAINER_XS],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'joints',
				label: 'Joints',
				kind: 'control',
				widgets: [ArmJointsControl],
				size: {
					minWidth: 196,
					minHeight: 558,
					recommendedWidths: [CONTAINER_XS],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'move-to-joint-positions',
				label: 'MoveToJointPositions',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [ArmGetJointPositionsWidget],
				size: {
					minWidth: 186,
					minHeight: 276,
					recommendedWidths: [186, 294],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-end-position',
				label: 'GetEndPosition',
				kind: 'api',
				widgets: [ArmGetEndPositionWidget],
				size: {
					minWidth: 162,
					minHeight: 306,
					recommendedWidths: [180, 283],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				kind: 'api',
				widgets: [ArmIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [240], maxWidth: 240 },
			},
			{
				id: 'manual-mode',
				label: 'Manual mode',
				kind: 'control',
				widgets: [ArmManualModeControl],
				size: {
					minWidth: 193,
					minHeight: 198,
					recommendedWidths: [198, 294],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-manual-mode',
				label: 'SetManualMode',
				kind: 'api',
				widgets: [ArmSetManualModeWidget],
				size: {
					minWidth: 246,
					minHeight: 136,
					recommendedWidths: [246, 287],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-manual-mode',
				label: 'GetManualMode',
				kind: 'api',
				widgets: [ArmGetManualModeWidget],
				size: {
					minWidth: 150,
					minHeight: 58,
					recommendedWidths: [274],
					maxWidth: 274,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
				widgets: [ArmGetPropertiesWidget],
				size: {
					minWidth: 224,
					minHeight: 88,
					recommendedWidths: [274],
					maxWidth: 274,
				},
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
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
				kind: 'control',
				widgets: [AudioInputControls],
				size: {
					minWidth: 98,
					minHeight: 232,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'get-audio',
				label: 'GetAudio',
				kind: 'api',
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
				kind: 'api',
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
			minHeight: 776,
			recommendedWidths: [114],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [AudioOutputControls],
				size: {
					minWidth: 114,
					minHeight: 165,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'play',
				label: 'Play',
				kind: 'api',
				widgets: [AudioOutputPlayWidget],
				size: {
					minWidth: 252,
					minHeight: 194,
					recommendedWidths: [252],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'play-stream',
				label: 'PlayStream',
				kind: 'api',
				widgets: [AudioOutputPlayStreamWidget],
				size: {
					minWidth: 252,
					minHeight: 232,
					recommendedWidths: [252],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
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
			minWidth: 243,
			minHeight: 1154,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: THREE_FIELD_COLUMNS_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [BaseControls],
				size: {
					minWidth: 276,
					minHeight: 254,
					recommendedWidths: [276, BASE_CONTROLS_MAX_WIDTH],
					maxWidth: BASE_CONTROLS_MAX_WIDTH,
				},
			},
			{
				id: 'quick-move',
				label: 'Quick move',
				kind: 'control',
				widgets: [BaseQuickMoveControl],
				size: {
					minWidth: 276,
					minHeight: 204,
					recommendedWidths: [276],
					maxWidth: BASE_CONTROLS_MAX_WIDTH,
				},
			},
			{
				id: 'move-straight',
				label: 'MoveStraight',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [BaseIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [235], maxWidth: 235 },
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
				widgets: [BaseStopWidget],
				size: { minWidth: 92, minHeight: 66, recommendedWidths: [210], maxWidth: 210 },
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
				widgets: [BaseGetPropertiesWidget],
				size: { minWidth: 243, minHeight: 118, recommendedWidths: [269], maxWidth: 269 },
			},
		],
	},
	// The composite is "Batch 4.3 measured sizes", the pins surface row. The API entries are measured in
	// the playground, with the Board-Frames board for the widths. Recommended widths under a measured
	// minimum are raised to it.
	[ResourceTriplets.Board]: {
		widget: BoardWidget,
		size: {
			minWidth: 176,
			minHeight: 1903,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [BoardControls],
				// Recommended and max widths from the Board-Control board.
				size: {
					minWidth: 240,
					minHeight: 388,
					recommendedWidths: [320, 672],
					maxWidth: 672,
				},
			},
			{
				id: 'pins',
				label: 'Pins',
				kind: 'control',
				widgets: [BoardPinsControl],
				size: {
					minWidth: 253,
					minHeight: 229,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'set-gpio',
				label: 'SetGPIO',
				kind: 'api',
				widgets: [BoardSetGPIOWidget],
				size: {
					minWidth: 192,
					minHeight: 124,
					recommendedWidths: [192],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-gpio',
				label: 'GetGPIO',
				kind: 'api',
				widgets: [BoardGetGPIOWidget],
				size: {
					minWidth: 214,
					minHeight: 126,
					recommendedWidths: [214, 224],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'pwm',
				label: 'PWM',
				kind: 'api',
				widgets: [BoardPWMWidget],
				size: {
					minWidth: 214,
					minHeight: 146,
					recommendedWidths: [214, 224],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-pwm',
				label: 'SetPWM',
				kind: 'api',
				widgets: [BoardSetPWMWidget],
				size: {
					minWidth: 214,
					minHeight: 126,
					recommendedWidths: [214],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'pwm-frequency',
				label: 'PWMFrequency',
				kind: 'api',
				widgets: [BoardPWMFrequencyWidget],
				size: {
					minWidth: 214,
					minHeight: 146,
					recommendedWidths: [214, 224],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-pwm-frequency',
				label: 'SetPWMFrequency',
				kind: 'api',
				widgets: [BoardSetPWMFrequencyWidget],
				size: {
					minWidth: 269,
					minHeight: 126,
					recommendedWidths: [269],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'read-analog-reader',
				label: 'ReadAnalogReader',
				kind: 'api',
				widgets: [BoardReadAnalogReaderWidget],
				size: {
					minWidth: 230,
					minHeight: 160,
					recommendedWidths: [230],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'write-analog',
				label: 'WriteAnalog',
				kind: 'api',
				widgets: [BoardWriteAnalogWidget],
				size: {
					minWidth: 222,
					minHeight: 126,
					recommendedWidths: [222],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-digital-interrupt-value',
				label: 'GetDigitalInterruptValue',
				kind: 'api',
				widgets: [BoardGetDigitalInterruptValueWidget],
				size: {
					minWidth: 240,
					minHeight: 92,
					recommendedWidths: [240],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'stream-ticks',
				label: 'StreamTicks',
				kind: 'api',
				widgets: [BoardStreamTicksWidget],
				size: {
					minWidth: 278,
					minHeight: 92,
					recommendedWidths: [278],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-power-mode',
				label: 'SetPowerMode',
				kind: 'api',
				widgets: [BoardSetPowerModeWidget],
				size: {
					minWidth: 150,
					minHeight: 112,
					recommendedWidths: [210],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
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
				kind: 'control',
				widgets: [CameraControls],
				size: {
					minWidth: 227,
					minHeight: 480,
					recommendedWidths: [CONTAINER_XS, 415],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-images',
				label: 'GetImages',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
			minHeight: 399,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [EncoderControls],
				// Recommended and max widths from the Encoder-Control board.
				size: {
					minWidth: 162,
					minHeight: 172,
					recommendedWidths: [225, 320, 672],
					maxWidth: 672,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
				widgets: [EncoderGetPositionWidget],
				size: { minWidth: 162, minHeight: 90, recommendedWidths: [272], maxWidth: 272 },
			},
			{
				id: 'reset-position',
				label: 'ResetPosition',
				kind: 'api',
				widgets: [EncoderResetPositionWidget],
				size: {
					minWidth: 150,
					minHeight: 122,
					recommendedWidths: [287],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
				widgets: [EncoderGetPropertiesWidget],
				size: { minWidth: 251, minHeight: 88, recommendedWidths: [287], maxWidth: 287 },
			},
		],
	},
	// Measured in the playground with three axes, with "Batch 4.2 measured sizes" for the widths
	// above and the Gantry, Servo, Gripper, and Switch Frames boards for the control interfaces. A board
	// width under a measured minimum is raised to it.
	[ResourceTriplets.Gantry]: {
		widget: GantryWidget,
		size: {
			minWidth: 169,
			minHeight: 1571,
			recommendedWidths: [200, CONTAINER_2XL],
			maxWidth: CONTAINER_2XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [GantryControls],
				size: {
					minWidth: 166,
					minHeight: 432,
					recommendedWidths: [316, CONTAINER_2XL],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'home',
				label: 'Home',
				kind: 'api',
				widgets: [GantryHomeWidget],
				// The api header's floor less its borders. Narrower, its rows wrap 16 px taller.
				size: { minWidth: 150, minHeight: 92, recommendedWidths: [236], maxWidth: 236 },
			},
			{
				id: 'move-to-position',
				label: 'MoveToPosition',
				kind: 'api',
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
				kind: 'control',
				widgets: [GantryQuickMoveControl],
				size: {
					minWidth: 95,
					minHeight: 374,
					recommendedWidths: [181],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
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
				kind: 'api',
				widgets: [GantryIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [260], maxWidth: 260 },
			},
			{
				id: 'get-lengths',
				label: 'GetLengths',
				kind: 'api',
				widgets: [GantryGetLengthsWidget],
				size: {
					minWidth: 183,
					minHeight: 118,
					recommendedWidths: [275],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
				widgets: [GantryStopWidget],
				size: { minWidth: 92, minHeight: 66, recommendedWidths: [236], maxWidth: 236 },
			},
		],
	},
	// "Batch 4.3 measured sizes", raised to the rendered widgets: heights are the rendered bodies.
	[ResourceTriplets.Gripper]: {
		widget: GripperWidget,
		size: {
			minWidth: 244,
			minHeight: 645,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CAPPED_COMPOSITE_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [GripperControls],
				size: {
					minWidth: 230,
					minHeight: 156,
					recommendedWidths: [241],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'open-grab',
				label: 'Open / Grab',
				kind: 'control',
				widgets: [GripperOpenGrabControl],
				size: { minWidth: 136, minHeight: 110, recommendedWidths: [205], maxWidth: 205 },
			},
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				kind: 'api',
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
				kind: 'api',
				widgets: [GripperIsMovingWidget],
				size: { minWidth: 96, minHeight: 97, recommendedWidths: [253], maxWidth: 253 },
			},
			{
				id: 'open',
				label: 'Open',
				kind: 'api',
				widgets: [GripperOpenWidget],
				size: { minWidth: 81, minHeight: 94, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'grab',
				label: 'Grab',
				kind: 'api',
				widgets: [GripperGrabWidget],
				size: { minWidth: 115, minHeight: 140, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
				widgets: [GripperStopWidget],
				size: { minWidth: 92, minHeight: 102, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'get-current-inputs',
				label: 'GetCurrentInputs',
				kind: 'api',
				widgets: [GripperGetCurrentInputsWidget],
				size: { minWidth: 150, minHeight: 172, recommendedWidths: [306], maxWidth: 306 },
			},
			{
				id: 'go-to-inputs',
				label: 'GoToInputs',
				kind: 'api',
				widgets: [GripperGoToInputsWidget],
				size: {
					minWidth: 219,
					minHeight: 190,
					recommendedWidths: [219],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above.
	[ResourceTriplets.InputController]: {
		widget: InputControllerWidget,
		size: {
			minWidth: 211,
			minHeight: 550,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'get-events',
				label: 'GetEvents',
				kind: 'api',
				widgets: [InputControllerGetEventsWidget],
				size: {
					minWidth: 240,
					minHeight: 264,
					recommendedWidths: [268],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'trigger-event',
				label: 'TriggerEvent',
				kind: 'api',
				widgets: [InputControllerTriggerEventWidget],
				size: {
					minWidth: 232,
					minHeight: 204,
					recommendedWidths: [287],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},
	// Measured in the playground, with the Motor-Frames board for the widths above. Recommended widths
	// under a measured minimum are raised to it.
	[ResourceTriplets.Motor]: {
		widget: MotorWidget,
		size: {
			minWidth: 288,
			minHeight: 1055,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL, CONTAINER_4XL],
			maxWidth: THREE_FIELD_COLUMNS_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [MotorControls],
				size: {
					minWidth: 319,
					minHeight: 477,
					recommendedWidths: [319, MOTOR_CONTROLS_TWO_FOLDERS_WIDTH],
					maxWidth: MOTOR_CONTROLS_TWO_FOLDERS_WIDTH,
				},
			},
			{
				id: 'quick-move',
				label: 'Quick move',
				kind: 'control',
				widgets: [MotorQuickMoveControl],
				size: {
					minWidth: 276,
					minHeight: 152,
					recommendedWidths: [276, 285],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'move',
				label: 'Move',
				kind: 'control',
				widgets: [MotorMoveControl],
				size: {
					minWidth: 310,
					minHeight: 200,
					recommendedWidths: [310],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-power',
				label: 'SetPower',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [MotorIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [240], maxWidth: 240 },
			},
			{
				id: 'reset-zero-position',
				label: 'ResetZeroPosition',
				kind: 'api',
				widgets: [MotorResetZeroPositionWidget],
				size: {
					minWidth: 279,
					minHeight: 92,
					recommendedWidths: [279],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
				widgets: [MotorGetPositionWidget],
				size: {
					minWidth: 180,
					minHeight: 58,
					recommendedWidths: [261],
					maxWidth: 261,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
				widgets: [MotorGetPropertiesWidget],
				size: {
					minWidth: 224,
					minHeight: 58,
					recommendedWidths: [274],
					maxWidth: 274,
				},
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
				widgets: [MotorStopWidget],
				size: {
					minWidth: 150,
					minHeight: 66,
					recommendedWidths: [216],
					maxWidth: 216,
				},
			},
			{
				id: 'is-powered',
				label: 'IsPowered',
				kind: 'api',
				widgets: [MotorIsPoweredWidget],
				size: {
					minWidth: 150,
					minHeight: 59,
					recommendedWidths: [248],
					maxWidth: 248,
				},
			},
		],
	},
	// Measured in the playground, with "Batch 5.1 measured sizes" for the widths above. Two
	// recommended widths sit under their measured minimums and are raised to them.
	[ResourceTriplets.MovementSensor]: {
		widget: MovementSensorWidget,
		size: {
			minWidth: 239,
			minHeight: 1425,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CONTAINER_4XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [MovementSensorControls],
				// Recommended and max widths from the MovementSensor-Control board.
				size: {
					minWidth: 288,
					minHeight: 550,
					recommendedWidths: [320, 672],
					maxWidth: 672,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [MovementSensorGetAccuracyWidget],
				size: {
					minWidth: 183,
					minHeight: 192,
					recommendedWidths: [216],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-linear-velocity',
				label: 'GetLinearVelocity',
				kind: 'api',
				widgets: [MovementSensorGetLinearVelocityWidget],
				size: {
					minWidth: 150,
					minHeight: 146,
					recommendedWidths: [288],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-angular-velocity',
				label: 'GetAngularVelocity',
				kind: 'api',
				widgets: [MovementSensorGetAngularVelocityWidget],
				size: {
					minWidth: 150,
					minHeight: 146,
					recommendedWidths: [288],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-linear-acceleration',
				label: 'GetLinearAcceleration',
				kind: 'api',
				widgets: [MovementSensorGetLinearAccelerationWidget],
				size: {
					minWidth: 150,
					minHeight: 146,
					recommendedWidths: [308],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
				widgets: [MovementSensorGetPropertiesWidget],
				size: {
					minWidth: 259,
					minHeight: 208,
					recommendedWidths: [266],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-readings',
				label: 'GetReadings',
				kind: 'api',
				widgets: [MovementSensorGetReadingsWidget],
				size: {
					minWidth: 150,
					minHeight: 360,
					recommendedWidths: [246, READINGS_TWO_COLUMNS_WIDTH],
					maxWidth: READINGS_TWO_COLUMNS_WIDTH,
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
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [PowerSensorControls],
				// Recommended and max widths from the PowerSensor-Control board.
				size: {
					minWidth: 303,
					minHeight: 234,
					recommendedWidths: [320, 672],
					maxWidth: 776,
				},
			},
			{
				id: 'get-voltage',
				label: 'GetVoltage',
				kind: 'api',
				widgets: [PowerSensorGetVoltageWidget],
				size: { minWidth: 195, minHeight: 90, recommendedWidths: [298], maxWidth: 298 },
			},
			{
				id: 'get-current',
				label: 'GetCurrent',
				kind: 'api',
				widgets: [PowerSensorGetCurrentWidget],
				size: { minWidth: 187, minHeight: 90, recommendedWidths: [298], maxWidth: 298 },
			},
			{
				id: 'get-power',
				label: 'GetPower',
				kind: 'api',
				widgets: [PowerSensorGetPowerWidget],
				size: { minWidth: 176, minHeight: 90, recommendedWidths: [285], maxWidth: 285 },
			},
			{
				id: 'get-readings',
				label: 'GetReadings',
				kind: 'api',
				widgets: [PowerSensorGetReadingsWidget],
				size: {
					minWidth: 150,
					minHeight: 360,
					recommendedWidths: [246, READINGS_TWO_COLUMNS_WIDTH],
					maxWidth: READINGS_TWO_COLUMNS_WIDTH,
				},
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
			minHeight: 555,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CAPPED_COMPOSITE_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [ServoControls],
				size: {
					minWidth: 272,
					minHeight: 302,
					recommendedWidths: [272, CONTAINER_2XL],
					maxWidth: CONTAINER_2XL,
				},
			},
			{
				id: 'move',
				label: 'Move',
				kind: 'api',
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
				kind: 'control',
				widgets: [ServoQuickMoveControl],
				size: { minWidth: 196, minHeight: 186, recommendedWidths: [196], maxWidth: 196 },
			},
			{
				id: 'move-to',
				label: 'Move to',
				kind: 'control',
				widgets: [ServoMoveToControl],
				size: {
					minWidth: 272,
					minHeight: 150,
					recommendedWidths: [272],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				kind: 'api',
				widgets: [ServoIsMovingWidget],
				size: { minWidth: 96, minHeight: 54, recommendedWidths: [240], maxWidth: 240 },
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
				widgets: [ServoGetPositionWidget],
				size: { minWidth: 140, minHeight: 106, recommendedWidths: [259], maxWidth: 259 },
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
				widgets: [ServoStopWidget],
				size: { minWidth: 92, minHeight: 66, recommendedWidths: [214], maxWidth: 214 },
			},
		],
	},
	// Measured in the playground with three position labels, with the Switch-Frames board for the widths
	// above.
	[ResourceTriplets.Switch]: {
		widget: SwitchWidget,
		size: {
			minWidth: 179,
			minHeight: 408,
			recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
			maxWidth: CONTAINER_2XL,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [SwitchControls],
				size: {
					minWidth: 140,
					minHeight: 112,
					recommendedWidths: [207, CONTAINER_XS],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'set-position',
				label: 'SetPosition',
				kind: 'api',
				widgets: [SwitchPositionWidget],
				size: {
					minWidth: 150,
					minHeight: 80,
					recommendedWidths: [207, CONTAINER_XS],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
				widgets: [SwitchGetPositionWidget],
				size: {
					minWidth: 150,
					minHeight: 98,
					recommendedWidths: [162],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-number-of-positions',
				label: 'GetNumberOfPositions',
				kind: 'api',
				widgets: [SwitchGetNumberOfPositionsWidget],
				size: {
					minWidth: 150,
					minHeight: 148,
					recommendedWidths: [162],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
		],
	},

	// services
	// Measured in the playground. No table covers discovery. Its composite has no breakpoint, so it
	// stops at the field column, and the control at its own `@2xl`.
	[ResourceTriplets.Discovery]: {
		widget: DiscoveryWidget,
		size: {
			minWidth: 220,
			minHeight: 122,
			recommendedWidths: [220],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [DiscoveryControls],
				size: {
					minWidth: 189,
					minHeight: 448,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'discover-resources',
				label: 'DiscoverResources',
				kind: 'api',
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
			minHeight: 856,
			recommendedWidths: [286],
			maxWidth: FIELD_COLUMN_MAX_WIDTH,
		},
		apis: [
			{
				id: 'metadata',
				label: 'Metadata',
				kind: 'api',
				widgets: [MLModelServiceMetadataWidget],
				size: {
					minWidth: 286,
					minHeight: 426,
					recommendedWidths: [286],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'infer',
				label: 'Infer',
				kind: 'api',
				widgets: [MLModelServiceInferWidget],
				size: {
					minWidth: 235,
					minHeight: 370,
					recommendedWidths: [235],
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
		size: { minWidth: 116, minHeight: 1408, recommendedWidths: [116], maxWidth: CONTAINER_4XL },
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [NavigationServiceControls],
				size: {
					minWidth: 248,
					minHeight: 393,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-mode',
				label: 'GetMode',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [NavigationGetObstaclesWidget],
				size: {
					minWidth: 232,
					minHeight: 290,
					recommendedWidths: [232],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-paths',
				label: 'GetPaths',
				kind: 'api',
				widgets: [NavigationGetPathsWidget],
				size: { minWidth: 177, minHeight: 82, recommendedWidths: [320], maxWidth: CONTAINER_2XL },
			},
			{
				id: 'get-properties',
				label: 'GetProperties',
				kind: 'api',
				widgets: [NavigationGetPropertiesWidget],
				size: { minWidth: 150, minHeight: 58, recommendedWidths: [320], maxWidth: CONTAINER_2XL },
			},
		],
	},
	// Measured in the playground. No table covers SLAM: one width each, capped by the field column,
	// and the composite and control by the composite's `@2xl`.
	[ResourceTriplets.Slam]: {
		widget: SlamWidget,
		size: { minWidth: 223, minHeight: 839, recommendedWidths: [223], maxWidth: CONTAINER_2XL },
		apis: [
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [SlamControls],
				size: {
					minWidth: 248,
					minHeight: 548,
					recommendedWidths: [CONTAINER_XS, CONTAINER_2XL],
					maxWidth: CONTAINER_4XL,
				},
			},
			{
				id: 'get-position',
				label: 'GetPosition',
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [SlamGetPropertiesWidget],
				size: {
					minWidth: 244,
					minHeight: 206,
					recommendedWidths: [244],
					maxWidth: FIELD_COLUMN_MAX_WIDTH,
				},
			},
			{
				id: 'get-internal-state',
				label: 'GetInternalState',
				kind: 'api',
				widgets: [SlamGetInternalStateWidget],
				size: { minWidth: 184, minHeight: 92, recommendedWidths: [320], maxWidth: CONTAINER_2XL },
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
				kind: 'control',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
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
				kind: 'api',
				widgets: [VisionServiceGetDetectionsFromCameraWidget],
				size: { minWidth: 230, minHeight: 142, recommendedWidths: [369], maxWidth: 369 },
			},
			{
				id: 'get-classifications-from-camera',
				label: 'GetClassificationsFromCamera',
				kind: 'api',
				widgets: [VisionServiceGetClassificationsFromCameraWidget],
				size: { minWidth: 230, minHeight: 188, recommendedWidths: [414], maxWidth: 414 },
			},
			{
				id: 'get-detections',
				label: 'GetDetections',
				kind: 'api',
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
				kind: 'api',
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
 * // [{ id: 'open-grab', label: 'Open / Grab', kind: 'control', widgets: [GripperOpenGrabControl], size: {...} }, ...]
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
 * // [{ id: 'open-grab', label: 'Open / Grab', kind: 'control', widgets: [GripperOpenGrabControl], size: {...} }, ...]
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
export type { PopOutSize } from './components/index.ts'
export type {
	ResourceAPIWidget,
	ResourceAPIWidgetKind,
	ResourceWidget,
	ResourceWidgetProps,
	ResourceWidgetSize,
} from './resource-widget-types.ts'
