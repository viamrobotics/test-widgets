import type { ResourceName } from '@viamrobotics/sdk'
import type { Component } from 'svelte'

import { clientMap } from './client-map.ts'
import {
	ArmGetJointPositionsWidget,
	ArmIsMovingWidget,
	ArmWidget,
	AudioInputGetPropertiesWidget,
	AudioInputWidget,
	AudioOutputGetPropertiesWidget,
	AudioOutputWidget,
	BaseIsMovingWidget,
	BaseWidget,
	BoardWidget,
	ButtonWidget,
	CameraWidget,
	DiscoveryWidget,
	EncoderGetPositionWidget,
	EncoderWidget,
	GantryGetPositionWidget,
	GantryIsMovingWidget,
	GantryWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperWidget,
	InputControllerWidget,
	MLModelServiceWidget,
	MotorIsMovingWidget,
	MotorWidget,
	MovementSensorGetAccuracyWidget,
	MovementSensorGetCompassHeadingWidget,
	MovementSensorGetOrientationWidget,
	MovementSensorGetPositionWidget,
	MovementSensorWidget,
	NavigationServiceWidget,
	NotImplementedWidget,
	PowerSensorGetCurrentWidget,
	PowerSensorGetPowerWidget,
	PowerSensorGetVoltageWidget,
	PowerSensorWidget,
	SensorWidget,
	ServoIsMovingWidget,
	ServoWidget,
	SlamGetPositionWidget,
	SlamWidget,
	SwitchWidget,
	VisionServiceWidget,
} from './components/index.ts'
import { getResourceAPI } from './get-resource-api.ts'
import { ResourceTriplets } from './resource-triplet.ts'

/** Every resource widget shares this prop contract and is self-contained. */
export interface ResourceWidgetProps {
	partID: string
	resourceName: string
}

export type ResourceWidget = Component<ResourceWidgetProps>

// Maps each resource triplet to its compound widget object. Every entry has a
// `Widget` (the full composite) plus, where a single query API has a useful
// standalone view, additional sub-widgets named after that API. Resources
// without a test widget fall back to `NotImplementedWidget`.
const resourceWidgetRegistry = {
	// components
	[ResourceTriplets.Arm]: {
		Widget: ArmWidget,
		GetJointPositions: ArmGetJointPositionsWidget,
		IsMoving: ArmIsMovingWidget,
	},
	[ResourceTriplets.AudioInput]: {
		Widget: AudioInputWidget,
		GetProperties: AudioInputGetPropertiesWidget,
	},
	[ResourceTriplets.AudioOutput]: {
		Widget: AudioOutputWidget,
		GetProperties: AudioOutputGetPropertiesWidget,
	},
	[ResourceTriplets.Base]: { Widget: BaseWidget, IsMoving: BaseIsMovingWidget },
	[ResourceTriplets.Board]: { Widget: BoardWidget },
	[ResourceTriplets.Button]: { Widget: ButtonWidget },
	[ResourceTriplets.Camera]: { Widget: CameraWidget },
	[ResourceTriplets.Encoder]: { Widget: EncoderWidget, GetPosition: EncoderGetPositionWidget },
	[ResourceTriplets.Gantry]: {
		Widget: GantryWidget,
		GetPosition: GantryGetPositionWidget,
		IsMoving: GantryIsMovingWidget,
	},
	[ResourceTriplets.Gripper]: {
		Widget: GripperWidget,
		IsHoldingSomething: GripperIsHoldingSomethingWidget,
		IsMoving: GripperIsMovingWidget,
	},
	[ResourceTriplets.InputController]: { Widget: InputControllerWidget },
	[ResourceTriplets.Motor]: { Widget: MotorWidget, IsMoving: MotorIsMovingWidget },
	[ResourceTriplets.MovementSensor]: {
		Widget: MovementSensorWidget,
		GetPosition: MovementSensorGetPositionWidget,
		GetOrientation: MovementSensorGetOrientationWidget,
		GetCompassHeading: MovementSensorGetCompassHeadingWidget,
		GetAccuracy: MovementSensorGetAccuracyWidget,
	},
	[ResourceTriplets.PowerSensor]: {
		Widget: PowerSensorWidget,
		GetVoltage: PowerSensorGetVoltageWidget,
		GetCurrent: PowerSensorGetCurrentWidget,
		GetPower: PowerSensorGetPowerWidget,
	},
	[ResourceTriplets.Sensor]: { Widget: SensorWidget },
	[ResourceTriplets.Servo]: { Widget: ServoWidget, IsMoving: ServoIsMovingWidget },
	[ResourceTriplets.Switch]: { Widget: SwitchWidget },

	// services
	[ResourceTriplets.Discovery]: { Widget: DiscoveryWidget },
	[ResourceTriplets.MLModel]: { Widget: MLModelServiceWidget },
	[ResourceTriplets.Navigation]: { Widget: NavigationServiceWidget },
	[ResourceTriplets.Slam]: { Widget: SlamWidget, GetPosition: SlamGetPositionWidget },
	[ResourceTriplets.Vision]: { Widget: VisionServiceWidget },
} as const

type ResourceWidgetRegistry = typeof resourceWidgetRegistry
type ClientMap = typeof clientMap

// Resolve the triplet for a client class by matching it against `clientMap`.
type TripletForClient<C> = {
	[K in keyof ClientMap]: C extends ClientMap[K] ? (ClientMap[K] extends C ? K : never) : never
}[keyof ClientMap]

type ResourceWidgetsFor<C> = [TripletForClient<C> & keyof ResourceWidgetRegistry] extends [never]
	? { Widget: ResourceWidget }
	: ResourceWidgetRegistry[TripletForClient<C> & keyof ResourceWidgetRegistry]

type ResourceClient = abstract new (...args: never[]) => object

const notImplemented = { Widget: NotImplementedWidget }

// Reverse `clientMap` (client class -> triplet) for the runtime lookup.
const tripletForClient = new Map<unknown, keyof ResourceWidgetRegistry>(
	Object.entries(clientMap).map(([triplet, client]): [unknown, keyof ResourceWidgetRegistry] => [
		client,
		triplet as keyof ResourceWidgetRegistry,
	])
)

/**
 * Returns the compound widget object for a resource client class.
 *
 * The result always has a `.Widget` (the full composite widget) and, for some
 * resources, self-contained query sub-widgets such as `.GetJointPositions`.
 * Every component takes `{ partID, resourceName }`. Client classes with no test
 * widget resolve to a "not implemented" placeholder.
 *
 * @param client - The resource client class, e.g. `ArmClient`.
 * @returns The resource's widget object.
 * @example
 * const Arm = createResourceWidget(ArmClient)
 * // <Arm.Widget {partID} {resourceName} />
 * // <Arm.GetJointPositions {partID} {resourceName} />
 */
export const createResourceWidget = <C extends ResourceClient>(
	client: C
): ResourceWidgetsFor<C> => {
	const triplet = tripletForClient.get(client)
	return (
		triplet !== undefined && triplet in resourceWidgetRegistry
			? resourceWidgetRegistry[triplet]
			: notImplemented
	) as ResourceWidgetsFor<C>
}

// The widget names available for a resource, e.g. `'Widget' | 'GetJointPositions'`.
type ResourceWidgetName<K extends keyof ResourceWidgetRegistry> = keyof ResourceWidgetRegistry[K]

// Each resource triplet mapped to the list of its available widget names.
type AvailableResourceWidgets = {
	[K in keyof ResourceWidgetRegistry]: ResourceWidgetName<K>[]
}

/**
 * Returns each resource triplet that has an implemented widget mapped to its list
 * of available widget names.
 *
 * Resources whose only widget is the not-implemented placeholder are excluded.
 *
 * @example
 * availableResourceWidgets()['rdk:component:arm'] // ['Widget', 'GetJointPositions', 'IsMoving']
 */
export const availableResourceWidgets = () => {
	const result: Record<string, string[]> = {}
	for (const triplet of Object.keys(resourceWidgetRegistry) as (keyof ResourceWidgetRegistry)[]) {
		const entry = resourceWidgetRegistry[triplet]
		if (entry.Widget !== NotImplementedWidget) {
			result[triplet] = Object.keys(entry)
		}
	}

	return result as AvailableResourceWidgets
}

// Resources hidden from the control view.
const hiddenResources = new Set<string>([
	ResourceTriplets.DataManager,
	ResourceTriplets.Motion,
	ResourceTriplets.Sensors,
	ResourceTriplets.Shell,
])

/** Returns the full composite widget for a resource, or `undefined` if none is implemented. */
export const widgetForResource = (resource: ResourceName): ResourceWidget | undefined => {
	const api = getResourceAPI(resource)
	return api in resourceWidgetRegistry
		? resourceWidgetRegistry[api as keyof ResourceWidgetRegistry].Widget
		: undefined
}

const knownResources = new Set<string>(Object.values(ResourceTriplets))

/** Whether a resource's API is a recognized Viam resource triplet. */
export const isKnownResource = (resource: ResourceName): boolean =>
	knownResources.has(getResourceAPI(resource))

/** Whether the control view should surface a card for this resource. */
export const showResourceWidget = (resource: ResourceName): boolean =>
	resource.namespace !== 'rdk-internal' && !hiddenResources.has(getResourceAPI(resource))
