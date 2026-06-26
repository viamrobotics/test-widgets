import type { ResourceName } from '@viamrobotics/sdk'
import type { Component } from 'svelte'

import {
	ArmGetJointPositionsWidget,
	ArmIsMovingWidget,
	ArmMoveToJointPositionsWidget,
	ArmMoveToPositionWidget,
	ArmQuickMoveWidget,
	ArmWidget,
	AudioInputGetPropertiesWidget,
	AudioInputWidget,
	AudioOutputGetPropertiesWidget,
	AudioOutputWidget,
	BaseIsMovingWidget,
	BaseMoveStraightWidget,
	BaseQuickMoveWidget,
	BaseSetPowerWidget,
	BaseSetVelocityWidget,
	BaseSpinWidget,
	BaseWidget,
	BoardWidget,
	ButtonWidget,
	CameraWidget,
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
	GripperOpenWidget,
	GripperWidget,
	InputControllerWidget,
	MLModelServiceWidget,
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
	NavigationServiceWidget,
	PowerSensorGetCurrentWidget,
	PowerSensorGetPowerWidget,
	PowerSensorGetVoltageWidget,
	PowerSensorWidget,
	SensorWidget,
	ServoIsMovingWidget,
	ServoMoveWidget,
	ServoQuickMoveWidget,
	ServoWidget,
	SlamGetPositionWidget,
	SlamWidget,
	SwitchWidget,
	VisionServiceWidget,
} from './components/index.ts'
import { getResourceAPI } from './get-resource-api.ts'
import {  type ResourceTriplet, ResourceTriplets } from './resource-triplet.ts'

/** Every resource widget shares this prop contract and is self-contained. */
export interface ResourceWidgetProps {
	partID: string
	resourceName: string
}

export type ResourceWidget = Component<ResourceWidgetProps>

/** One of a resource's individual API widgets (e.g. a menu entry); renders one or more self-contained widgets. */
export interface ResourceAPIWidget {
	/** Stable identifier, safe to persist. Never rename. e.g. `'move-to-joint-positions'`. */
	id: string
	/** Human-readable menu label. e.g. `'MoveToJointPositions'` or `'Quick move'`. */
	label: string
	/** The self-contained widget(s) this entry renders, each with `{ partID, resourceName }`. */
	components: ResourceWidget[]
}

const resourceWidgetRegistry = {
	// components
	[ResourceTriplets.Arm]: {
		widget: ArmWidget,
		apis: [
			{
				id: 'move-to-joint-positions',
				label: 'MoveToJointPositions',
				components: [ArmMoveToJointPositionsWidget],
			},
			{ id: 'move-to-position', label: 'MoveToPosition', components: [ArmMoveToPositionWidget] },
			{ id: 'quick-move', label: 'Quick move', components: [ArmQuickMoveWidget] },
			{
				id: 'get-joint-positions',
				label: 'GetJointPositions',
				components: [ArmGetJointPositionsWidget],
			},
			{ id: 'is-moving', label: 'IsMoving', components: [ArmIsMovingWidget] },
		],
	},
	[ResourceTriplets.AudioInput]: {
		widget: AudioInputWidget,
		apis: [{ id: 'get-properties', label: 'GetProperties', components: [AudioInputGetPropertiesWidget] }],
	},
	[ResourceTriplets.AudioOutput]: {
		widget: AudioOutputWidget,
		apis: [
			{ id: 'get-properties', label: 'GetProperties', components: [AudioOutputGetPropertiesWidget] },
		],
	},
	[ResourceTriplets.Base]: {
		widget: BaseWidget,
		apis: [
			{ id: 'quick-move', label: 'Quick move', components: [BaseQuickMoveWidget] },
			{ id: 'move-straight', label: 'MoveStraight', components: [BaseMoveStraightWidget] },
			{ id: 'spin', label: 'Spin', components: [BaseSpinWidget] },
			{ id: 'set-power', label: 'SetPower', components: [BaseSetPowerWidget] },
			{ id: 'set-velocity', label: 'SetVelocity', components: [BaseSetVelocityWidget] },
			{ id: 'is-moving', label: 'IsMoving', components: [BaseIsMovingWidget] },
		],
	},
	[ResourceTriplets.Board]: { widget: BoardWidget, apis: [] },
	[ResourceTriplets.Button]: { widget: ButtonWidget, apis: [] },
	[ResourceTriplets.Camera]: { widget: CameraWidget, apis: [] },
	[ResourceTriplets.Encoder]: {
		widget: EncoderWidget,
		apis: [{ id: 'get-position', label: 'GetPosition', components: [EncoderGetPositionWidget] }],
	},
	[ResourceTriplets.Gantry]: {
		widget: GantryWidget,
		apis: [
			{ id: 'home', label: 'Home', components: [GantryHomeWidget] },
			{ id: 'move-to-position', label: 'MoveToPosition', components: [GantryMoveToPositionWidget] },
			{ id: 'quick-move', label: 'Quick move', components: [GantryQuickMoveWidget] },
			{ id: 'get-position', label: 'GetPosition', components: [GantryGetPositionWidget] },
			{ id: 'is-moving', label: 'IsMoving', components: [GantryIsMovingWidget] },
		],
	},
	[ResourceTriplets.Gripper]: {
		widget: GripperWidget,
		apis: [
			{ id: 'open-grab', label: 'Open / Grab', components: [GripperOpenWidget, GripperGrabWidget] },
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				components: [GripperIsHoldingSomethingWidget],
			},
			{ id: 'is-moving', label: 'IsMoving', components: [GripperIsMovingWidget] },
		],
	},
	[ResourceTriplets.InputController]: { widget: InputControllerWidget, apis: [] },
	[ResourceTriplets.Motor]: {
		widget: MotorWidget,
		apis: [
			{ id: 'quick-move', label: 'Quick move', components: [MotorQuickMoveWidget] },
			{ id: 'set-power', label: 'SetPower', components: [MotorSetPowerWidget] },
			{ id: 'set-rpm', label: 'SetRPM', components: [MotorSetRPMWidget] },
			{ id: 'go-for', label: 'GoFor', components: [MotorGoForWidget] },
			{ id: 'go-to', label: 'GoTo', components: [MotorGoToWidget] },
			{ id: 'is-moving', label: 'IsMoving', components: [MotorIsMovingWidget] },
		],
	},
	[ResourceTriplets.MovementSensor]: {
		widget: MovementSensorWidget,
		apis: [
			{ id: 'get-position', label: 'GetPosition', components: [MovementSensorGetPositionWidget] },
			{
				id: 'get-orientation',
				label: 'GetOrientation',
				components: [MovementSensorGetOrientationWidget],
			},
			{
				id: 'get-compass-heading',
				label: 'GetCompassHeading',
				components: [MovementSensorGetCompassHeadingWidget],
			},
			{ id: 'get-accuracy', label: 'GetAccuracy', components: [MovementSensorGetAccuracyWidget] },
		],
	},
	[ResourceTriplets.PowerSensor]: {
		widget: PowerSensorWidget,
		apis: [
			{ id: 'get-voltage', label: 'GetVoltage', components: [PowerSensorGetVoltageWidget] },
			{ id: 'get-current', label: 'GetCurrent', components: [PowerSensorGetCurrentWidget] },
			{ id: 'get-power', label: 'GetPower', components: [PowerSensorGetPowerWidget] },
		],
	},
	[ResourceTriplets.Sensor]: { widget: SensorWidget, apis: [] },
	[ResourceTriplets.Servo]: {
		widget: ServoWidget,
		apis: [
			{ id: 'move', label: 'Move', components: [ServoMoveWidget] },
			{ id: 'quick-move', label: 'Quick move', components: [ServoQuickMoveWidget] },
			{ id: 'is-moving', label: 'IsMoving', components: [ServoIsMovingWidget] },
		],
	},
	[ResourceTriplets.Switch]: { widget: SwitchWidget, apis: [] },

	// services
	[ResourceTriplets.Discovery]: { widget: DiscoveryWidget, apis: [] },
	[ResourceTriplets.MLModel]: { widget: MLModelServiceWidget, apis: [] },
	[ResourceTriplets.Navigation]: { widget: NavigationServiceWidget, apis: [] },
	[ResourceTriplets.Slam]: {
		widget: SlamWidget,
		apis: [{ id: 'get-position', label: 'GetPosition', components: [SlamGetPositionWidget] }],
	},
	[ResourceTriplets.Vision]: { widget: VisionServiceWidget, apis: [] },
} satisfies Partial<Record<ResourceTriplet, { widget: ResourceWidget; apis: ResourceAPIWidget[] }>>

type ResourceWidgetRegistry = typeof resourceWidgetRegistry

/**
 * Returns each resource triplet that has a test card, mapped to its individual
 * API widgets. 
 * 
 * Each entry carries a stable `id`, a display `label`, and the `components` to 
 * render with `{ partID, resourceName }`.
 *
 * Resources that have a card but no standalone API widgets map to `[]`.
 *
 * @example
 * resourceApiWidgets()[ResourceTriplets.Gripper]
 * // [{ id: 'open-grab', label: 'Open / Grab', components: [GripperOpenWidget, GripperGrabWidget] }, ...]
 */
export const resourceApiWidgets = () => {
	const result = {} as Record<keyof ResourceWidgetRegistry, ResourceAPIWidget[]>
	for (const triplet of Object.keys(resourceWidgetRegistry) as (keyof ResourceWidgetRegistry)[]) {
		result[triplet] = resourceWidgetRegistry[triplet].apis
	}

	return result
}

/** Returns the full composite test card for a resource, or `undefined` if none exists. */
export const widgetForResource = (resource: ResourceName): ResourceWidget | undefined => {
	const api = getResourceAPI(resource)
	return api in resourceWidgetRegistry
		? resourceWidgetRegistry[api as keyof ResourceWidgetRegistry].widget
		: undefined
}

const knownResources = new Set<string>(Object.values(ResourceTriplets))

/** Whether a resource's API is a recognized Viam resource triplet. */
export const isKnownResource = (resource: ResourceName): boolean =>
	knownResources.has(getResourceAPI(resource))

const hiddenResources = new Set<string>([
	ResourceTriplets.DataManager,
	ResourceTriplets.Motion,
	ResourceTriplets.Sensors,
	ResourceTriplets.Shell,
])

/** Whether the control view should surface a card for this resource. */
export const showResourceWidget = (resource: ResourceName): boolean =>
	resource.namespace !== 'rdk-internal' && !hiddenResources.has(getResourceAPI(resource))
