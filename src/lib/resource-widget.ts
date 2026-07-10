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
import { type ResourceTriplet, ResourceTriplets } from './resource-triplet.ts'

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
	widgets: ResourceWidget[]
}

const resourceWidgetRegistry = {
	// components
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

	// services
	[ResourceTriplets.Discovery]: { widget: DiscoveryWidget, apis: [] },
	[ResourceTriplets.MLModel]: { widget: MLModelServiceWidget, apis: [] },
	[ResourceTriplets.Navigation]: { widget: NavigationServiceWidget, apis: [] },
	[ResourceTriplets.Slam]: {
		widget: SlamWidget,
		apis: [{ id: 'get-position', label: 'GetPosition', widgets: [SlamGetPositionWidget] }],
	},
	[ResourceTriplets.Vision]: { widget: VisionServiceWidget, apis: [] },
} satisfies Partial<Record<ResourceTriplet, { widget: ResourceWidget; apis: ResourceAPIWidget[] }>>

type ResourceWidgetRegistry = typeof resourceWidgetRegistry

/**
 * Returns a resource's individual API widgets. Each entry carries a stable `id`, a
 * display `label`, and the `widgets` to render with `{ partID, resourceName }`.
 *
 * Returns `[]` for a resource with a card but no standalone API widgets, and for
 * unrecognized resources.
 *
 * @example
 * apiWidgetsForResource(gripperResourceName)
 * // [{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenWidget, GripperGrabWidget] }, ...]
 */
export const apiWidgetsForResource = (resource: ResourceName): ResourceAPIWidget[] => {
	const api = getResourceAPI(resource)
	return api in resourceWidgetRegistry
		? resourceWidgetRegistry[api as keyof ResourceWidgetRegistry].apis
		: []
}

/**
 * Returns every resource triplet that has a test card, mapped to its API widgets.
 * Use this to enumerate the full catalog, e.g. a menu spanning every resource type;
 * for a single resource, prefer `apiWidgetsForResource`.
 *
 * @example
 * availableAPIWidgets()[ResourceTriplets.Gripper]
 * // [{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenWidget, GripperGrabWidget] }, ...]
 */
export const availableAPIWidgets = (): Record<
	keyof ResourceWidgetRegistry,
	ResourceAPIWidget[]
> => {
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
