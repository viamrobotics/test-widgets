import type { ResourceStatus } from '@viamrobotics/svelte-sdk'

import { type ResourceName, robotApi } from '@viamrobotics/sdk'

import type { ResourceWidget } from './resource-widget.ts'

import {
	ArmWidget,
	AudioInputWidget,
	AudioOutputWidget,
	BaseWidget,
	BoardWidget,
	ButtonWidget,
	CameraWidget,
	DiscoveryWidget,
	EncoderWidget,
	GantryWidget,
	GripperWidget,
	InputControllerWidget,
	MLModelServiceWidget,
	MotorWidget,
	MovementSensorWidget,
	NavigationServiceWidget,
	PowerSensorWidget,
	SensorWidget,
	ServoWidget,
	SlamWidget,
	SwitchWidget,
	VisionServiceWidget,
} from './components'
import { getResourceAPI } from './get-resource-api.ts'
import { ResourceTriplets } from './resource-triplet.ts'

export type NamedResourceStatus = ResourceStatus & {
	name: ResourceName
}

export const ResourceStatusText = {
	[robotApi.ResourceStatus_State.UNSPECIFIED]: 'unspecified',
	[robotApi.ResourceStatus_State.READY]: 'ready',
	[robotApi.ResourceStatus_State.CONFIGURING]: 'configuring',
	[robotApi.ResourceStatus_State.UNHEALTHY]: 'unhealthy',
	[robotApi.ResourceStatus_State.UNCONFIGURED]: 'unconfigured',
	[robotApi.ResourceStatus_State.REMOVING]: 'removing',
}

// The types are nicer to work with as arrays (as opposed to a record of objects) because TS will infer the types.
// try not to expose this map so that we can easily refactor it.
const resourceMap =
	// api: [testView, showResourceInControlView]
	{
		// components
		[ResourceTriplets.Arm]: [ArmWidget, true],
		[ResourceTriplets.AudioInput]: [AudioInputWidget, true],
		[ResourceTriplets.AudioOutput]: [AudioOutputWidget, true],
		[ResourceTriplets.Base]: [BaseWidget, true],
		[ResourceTriplets.Board]: [BoardWidget, true],
		[ResourceTriplets.Button]: [ButtonWidget, true],
		[ResourceTriplets.Camera]: [CameraWidget, true],
		[ResourceTriplets.Encoder]: [EncoderWidget, true],
		[ResourceTriplets.Gantry]: [GantryWidget, true],
		[ResourceTriplets.GenericComponent]: [undefined, true],
		[ResourceTriplets.Gripper]: [GripperWidget, true],
		[ResourceTriplets.InputController]: [InputControllerWidget, true],
		[ResourceTriplets.Motor]: [MotorWidget, true],
		[ResourceTriplets.MovementSensor]: [MovementSensorWidget, true],
		[ResourceTriplets.PoseTracker]: [undefined, true],
		[ResourceTriplets.PowerSensor]: [PowerSensorWidget, true],
		[ResourceTriplets.Sensor]: [SensorWidget, true],
		[ResourceTriplets.Servo]: [ServoWidget, true],
		[ResourceTriplets.Switch]: [SwitchWidget, true],

		// services
		[ResourceTriplets.BaseRemoteControl]: [undefined, true],
		[ResourceTriplets.Discovery]: [DiscoveryWidget, true],
		[ResourceTriplets.GenericService]: [undefined, true],
		[ResourceTriplets.MLModel]: [MLModelServiceWidget, true],
		[ResourceTriplets.Navigation]: [NavigationServiceWidget, true],
		[ResourceTriplets.Slam]: [SlamWidget, true],
		[ResourceTriplets.Video]: [undefined, true],
		[ResourceTriplets.Vision]: [VisionServiceWidget, true],
		[ResourceTriplets.WorldStateStore]: [undefined, true],

		// dont show -- confusing to users
		[ResourceTriplets.DataManager]: [undefined, false],
		[ResourceTriplets.Motion]: [undefined, false],
		[ResourceTriplets.Sensors]: [undefined, false],
		[ResourceTriplets.Shell]: [undefined, false],
	} as const 

// sorts resource names by local/remote -> type -> name (alphabetical) to produce a list like
// component a
// component z
// service   b
// component remote:c
// service   remote:b
export const sortResourceNames = (names: ResourceName[]): ResourceName[] =>
	names.toSorted(({ type, name }, { type: otherType, name: otherName }) => {
		// sort all non-remote resources before remote resources
		if (name.includes(':') !== otherName.includes(':')) {
			return name.includes(':') ? 1 : -1
		}
		// sort alphabetically within type
		// sort components before services
		return type === otherType ? name.localeCompare(otherName) : type.localeCompare(otherType)
	})

const resourceMapEntry = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource)
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap] : undefined
}

export const hasWidget = (resource: ResourceName): boolean =>
	resourceMapEntry(resource) !== undefined

export const widgetForResource = (resource: ResourceName): ResourceWidget | undefined =>
	resourceMapEntry(resource)?.[0] as ResourceWidget | undefined

export const showResourceWidget = (resource: ResourceName) => {
	if (resource.namespace === 'rdk-internal') {
		return false
	}

	// unknown apis should still get cards & show up in the sidebar
	return resourceMapEntry(resource)?.[1] ?? true
}
