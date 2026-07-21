import type { ResourceName } from '@viamrobotics/sdk'

import type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetEntry,
} from './resource-widget-types.ts'

import ArmWidget from './components/widgets/arm/arm.svelte'
import ArmGetJointPositionsWidget from './components/widgets/arm/get-joint-positions-widget.svelte'
import ArmIsMovingWidget from './components/widgets/arm/is-moving-widget.svelte'
import ArmMoveToJointPositionsWidget from './components/widgets/arm/move-to-joint-positions-widget.svelte'
import ArmMoveToPositionWidget from './components/widgets/arm/move-to-position-widget.svelte'
import ArmQuickMoveWidget from './components/widgets/arm/quick-move-widget.svelte'
import AudioInputWidget from './components/widgets/audio-input/audio-input.svelte'
import AudioInputGetPropertiesWidget from './components/widgets/audio-input/get-properties-widget.svelte'
import AudioOutputWidget from './components/widgets/audio-output/audio-output.svelte'
import AudioOutputGetPropertiesWidget from './components/widgets/audio-output/get-properties-widget.svelte'
import BaseWidget from './components/widgets/base/base.svelte'
import BaseIsMovingWidget from './components/widgets/base/is-moving-widget.svelte'
import BaseMoveStraightWidget from './components/widgets/base/move-straight-widget.svelte'
import BaseQuickMoveWidget from './components/widgets/base/quick-move-widget.svelte'
import BaseSetPowerWidget from './components/widgets/base/set-power-widget.svelte'
import BaseSetVelocityWidget from './components/widgets/base/set-velocity-widget.svelte'
import BaseSpinWidget from './components/widgets/base/spin-widget.svelte'
import BoardWidget from './components/widgets/board/board.svelte'
import ButtonWidget from './components/widgets/button/button.svelte'
import CameraWidget from './components/widgets/camera/camera.svelte'
import EncoderWidget from './components/widgets/encoder/encoder.svelte'
import EncoderGetPositionWidget from './components/widgets/encoder/get-position-widget.svelte'
import GantryWidget from './components/widgets/gantry/gantry.svelte'
import GantryGetPositionWidget from './components/widgets/gantry/get-position-widget.svelte'
import GantryHomeWidget from './components/widgets/gantry/home.svelte'
import GantryIsMovingWidget from './components/widgets/gantry/is-moving-widget.svelte'
import GantryMoveToPositionWidget from './components/widgets/gantry/move-to-position-widget.svelte'
import GantryQuickMoveWidget from './components/widgets/gantry/quick-move-widget.svelte'
import GripperGrabWidget from './components/widgets/gripper/grab.svelte'
import GripperWidget from './components/widgets/gripper/gripper.svelte'
import GripperIsHoldingSomethingWidget from './components/widgets/gripper/is-holding-something.svelte'
import GripperIsMovingWidget from './components/widgets/gripper/is-moving-widget.svelte'
import GripperOpenWidget from './components/widgets/gripper/open.svelte'
import InputControllerWidget from './components/widgets/input-controller/input-controller.svelte'
import MotorGoForWidget from './components/widgets/motor/go-for-view.svelte'
import MotorGoToWidget from './components/widgets/motor/go-to-view.svelte'
import MotorIsMovingWidget from './components/widgets/motor/is-moving-widget.svelte'
import MotorWidget from './components/widgets/motor/motor.svelte'
import MotorQuickMoveWidget from './components/widgets/motor/quick-move-widget.svelte'
import MotorSetPowerWidget from './components/widgets/motor/set-power-widget.svelte'
import MotorSetRPMWidget from './components/widgets/motor/set-rpm-widget.svelte'
import MovementSensorGetAccuracyWidget from './components/widgets/movement-sensor/get-accuracy-widget.svelte'
import MovementSensorGetCompassHeadingWidget from './components/widgets/movement-sensor/get-compass-heading-widget.svelte'
import MovementSensorGetOrientationWidget from './components/widgets/movement-sensor/get-orientation-widget.svelte'
import MovementSensorGetPositionWidget from './components/widgets/movement-sensor/get-position-widget.svelte'
import MovementSensorWidget from './components/widgets/movement-sensor/movement-sensor.svelte'
import PowerSensorGetCurrentWidget from './components/widgets/power-sensor/get-current-widget.svelte'
import PowerSensorGetPowerWidget from './components/widgets/power-sensor/get-power-widget.svelte'
import PowerSensorGetVoltageWidget from './components/widgets/power-sensor/get-voltage-widget.svelte'
import PowerSensorWidget from './components/widgets/power-sensor/power-sensor.svelte'
import SensorWidget from './components/widgets/sensor/sensor.svelte'
import ServoIsMovingWidget from './components/widgets/servo/is-moving-widget.svelte'
import ServoMoveWidget from './components/widgets/servo/move-widget.svelte'
import ServoQuickMoveWidget from './components/widgets/servo/quick-move-widget.svelte'
import ServoWidget from './components/widgets/servo/servo.svelte'
import SwitchWidget from './components/widgets/switch/switch.svelte'
import { getResourceAPI } from './get-resource-api.ts'
import { type ResourceTriplet, ResourceTriplets } from './resource-triplet.ts'

/**
 * Widgets for `rdk:component:*` resources only. Kept free of any service-widget
 * imports so consumers that render only components (e.g. a spatial visualizer) can
 * import this module without pulling navigation/maplibre into their build graph.
 */
export const componentWidgetRegistry: Partial<Record<ResourceTriplet, ResourceWidgetEntry>> = {
	[ResourceTriplets.Arm]: {
		widget: ArmWidget,
		apis: [
			{
				id: 'move-to-joint-positions',
				label: 'MoveToJointPositions',
				widgets: [ArmMoveToJointPositionsWidget],
			},
			{ id: 'move-to-position', label: 'MoveToPosition', widgets: [ArmMoveToPositionWidget] },
			{ id: 'quick-move', label: 'Quick move', widgets: [ArmQuickMoveWidget] },
			{
				id: 'get-joint-positions',
				label: 'GetJointPositions',
				widgets: [ArmGetJointPositionsWidget],
			},
			{ id: 'is-moving', label: 'IsMoving', widgets: [ArmIsMovingWidget] },
		],
	},
	[ResourceTriplets.AudioInput]: {
		widget: AudioInputWidget,
		apis: [
			{ id: 'get-properties', label: 'GetProperties', widgets: [AudioInputGetPropertiesWidget] },
		],
	},
	[ResourceTriplets.AudioOutput]: {
		widget: AudioOutputWidget,
		apis: [
			{
				id: 'get-properties',
				label: 'GetProperties',
				widgets: [AudioOutputGetPropertiesWidget],
			},
		],
	},
	[ResourceTriplets.Base]: {
		widget: BaseWidget,
		apis: [
			{ id: 'quick-move', label: 'Quick move', widgets: [BaseQuickMoveWidget] },
			{ id: 'move-straight', label: 'MoveStraight', widgets: [BaseMoveStraightWidget] },
			{ id: 'spin', label: 'Spin', widgets: [BaseSpinWidget] },
			{ id: 'set-power', label: 'SetPower', widgets: [BaseSetPowerWidget] },
			{ id: 'set-velocity', label: 'SetVelocity', widgets: [BaseSetVelocityWidget] },
			{ id: 'is-moving', label: 'IsMoving', widgets: [BaseIsMovingWidget] },
		],
	},
	[ResourceTriplets.Board]: { widget: BoardWidget, apis: [] },
	[ResourceTriplets.Button]: { widget: ButtonWidget, apis: [] },
	[ResourceTriplets.Camera]: { widget: CameraWidget, apis: [] },
	[ResourceTriplets.Encoder]: {
		widget: EncoderWidget,
		apis: [{ id: 'get-position', label: 'GetPosition', widgets: [EncoderGetPositionWidget] }],
	},
	[ResourceTriplets.Gantry]: {
		widget: GantryWidget,
		apis: [
			{ id: 'home', label: 'Home', widgets: [GantryHomeWidget] },
			{ id: 'move-to-position', label: 'MoveToPosition', widgets: [GantryMoveToPositionWidget] },
			{ id: 'quick-move', label: 'Quick move', widgets: [GantryQuickMoveWidget] },
			{ id: 'get-position', label: 'GetPosition', widgets: [GantryGetPositionWidget] },
			{ id: 'is-moving', label: 'IsMoving', widgets: [GantryIsMovingWidget] },
		],
	},
	[ResourceTriplets.Gripper]: {
		widget: GripperWidget,
		apis: [
			{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenWidget, GripperGrabWidget] },
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				widgets: [GripperIsHoldingSomethingWidget],
			},
			{ id: 'is-moving', label: 'IsMoving', widgets: [GripperIsMovingWidget] },
		],
	},
	[ResourceTriplets.InputController]: { widget: InputControllerWidget, apis: [] },
	[ResourceTriplets.Motor]: {
		widget: MotorWidget,
		apis: [
			{ id: 'quick-move', label: 'Quick move', widgets: [MotorQuickMoveWidget] },
			{ id: 'set-power', label: 'SetPower', widgets: [MotorSetPowerWidget] },
			{ id: 'set-rpm', label: 'SetRPM', widgets: [MotorSetRPMWidget] },
			{ id: 'go-for', label: 'GoFor', widgets: [MotorGoForWidget] },
			{ id: 'go-to', label: 'GoTo', widgets: [MotorGoToWidget] },
			{ id: 'is-moving', label: 'IsMoving', widgets: [MotorIsMovingWidget] },
		],
	},
	[ResourceTriplets.MovementSensor]: {
		widget: MovementSensorWidget,
		apis: [
			{ id: 'get-position', label: 'GetPosition', widgets: [MovementSensorGetPositionWidget] },
			{
				id: 'get-orientation',
				label: 'GetOrientation',
				widgets: [MovementSensorGetOrientationWidget],
			},
			{
				id: 'get-compass-heading',
				label: 'GetCompassHeading',
				widgets: [MovementSensorGetCompassHeadingWidget],
			},
			{ id: 'get-accuracy', label: 'GetAccuracy', widgets: [MovementSensorGetAccuracyWidget] },
		],
	},
	[ResourceTriplets.PowerSensor]: {
		widget: PowerSensorWidget,
		apis: [
			{ id: 'get-voltage', label: 'GetVoltage', widgets: [PowerSensorGetVoltageWidget] },
			{ id: 'get-current', label: 'GetCurrent', widgets: [PowerSensorGetCurrentWidget] },
			{ id: 'get-power', label: 'GetPower', widgets: [PowerSensorGetPowerWidget] },
		],
	},
	[ResourceTriplets.Sensor]: { widget: SensorWidget, apis: [] },
	[ResourceTriplets.Servo]: {
		widget: ServoWidget,
		apis: [
			{ id: 'move', label: 'Move', widgets: [ServoMoveWidget] },
			{ id: 'quick-move', label: 'Quick move', widgets: [ServoQuickMoveWidget] },
			{ id: 'is-moving', label: 'IsMoving', widgets: [ServoIsMovingWidget] },
		],
	},
	[ResourceTriplets.Switch]: { widget: SwitchWidget, apis: [] },
}

/**
 * Returns a component resource's individual API widgets, or `[]` for a component with
 * only a composite card and for anything that is not a recognized component.
 */
export const componentApiWidgets = (resource: ResourceName): ResourceAPIWidget[] =>
	componentWidgetRegistry[getResourceAPI(resource) as ResourceTriplet]?.apis ?? []

/** Returns the composite card for a component resource, or `undefined` if none exists. */
export const componentWidgetForResource = (resource: ResourceName): ResourceWidget | undefined =>
	componentWidgetRegistry[getResourceAPI(resource) as ResourceTriplet]?.widget

// Re-exported so `/component-registry` consumers can type the lookups' return values without
// importing from the root entry.
export type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetProps,
} from './resource-widget-types.ts'
