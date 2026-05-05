import type { ResourceStatus } from '@viamrobotics/svelte-sdk'
import type { Component } from 'svelte'

import { type ResourceName, robotApi } from '@viamrobotics/sdk'

import { clientMap } from './client-map.ts'
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

export type NamedResourceStatus = ResourceStatus & {
	name: ResourceName
}

interface ResourceWidget {
	partID: string
	resourceName: string
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
	// api: [client, testView, showResourceInControlView]
	// list created via `cat rdkbuiltins/viam-server-stable.json | rg "api" | sort | uniq`
	{
		'rdk:component:arm': [clientMap['rdk:component:arm'], ArmWidget, true],
		'rdk:component:audio_in': [clientMap['rdk:component:audio_in'], AudioInputWidget, true],
		'rdk:component:audio_out': [clientMap['rdk:component:audio_out'], AudioOutputWidget, true],
		'rdk:component:base': [clientMap['rdk:component:base'], BaseWidget, true],
		'rdk:component:board': [clientMap['rdk:component:board'], BoardWidget, true],
		'rdk:component:button': [clientMap['rdk:component:button'], ButtonWidget, true],
		'rdk:component:camera': [clientMap['rdk:component:camera'], CameraWidget, true],
		'rdk:component:encoder': [clientMap['rdk:component:encoder'], EncoderWidget, true],
		'rdk:component:gantry': [clientMap['rdk:component:gantry'], GantryWidget, true],
		'rdk:component:generic': [clientMap['rdk:component:generic'], undefined, true],
		'rdk:component:gripper': [clientMap['rdk:component:gripper'], GripperWidget, true],
		'rdk:component:input_controller': [
			clientMap['rdk:component:input_controller'],
			InputControllerWidget,
			true,
		],
		'rdk:component:motor': [clientMap['rdk:component:motor'], MotorWidget, true],
		'rdk:component:movement_sensor': [
			clientMap['rdk:component:movement_sensor'],
			MovementSensorWidget,
			true,
		],
		'rdk:component:pose_tracker': [clientMap['rdk:component:pose_tracker'], undefined, true],
		'rdk:component:power_sensor': [
			clientMap['rdk:component:power_sensor'],
			PowerSensorWidget,
			true,
		],
		'rdk:component:sensor': [clientMap['rdk:component:sensor'], SensorWidget, true],
		'rdk:component:servo': [clientMap['rdk:component:servo'], ServoWidget, true],
		'rdk:component:switch': [clientMap['rdk:component:switch'], SwitchWidget, true],
		'rdk:service:base_remote_control': [undefined, undefined, true],
		// dont show -- confusing to users
		'rdk:service:data_manager': [clientMap['rdk:service:data_manager'], undefined, false],
		'rdk:service:discovery': [clientMap['rdk:service:discovery'], DiscoveryWidget, true],
		'rdk:service:generic': [clientMap['rdk:service:generic'], undefined, true],
		'rdk:service:mlmodel': [clientMap['rdk:service:mlmodel'], MLModelServiceWidget, true],
		// dont show -- confusing to users
		'rdk:service:motion': [clientMap['rdk:service:motion'], undefined, false],
		'rdk:service:navigation': [clientMap['rdk:service:navigation'], NavigationServiceWidget, true],
		// dont show -- confusing to users
		'rdk:service:sensors': [undefined, undefined, false],
		'rdk:service:shell': [undefined, undefined, false],
		'rdk:service:slam': [clientMap['rdk:service:slam'], SlamWidget, true],
		'rdk:service:vision': [clientMap['rdk:service:vision'], VisionServiceWidget, true],
		'rdk:service:world_state_store': [clientMap['rdk:service:world_state_store'], undefined, true],
		'rdk:service:video': [clientMap['rdk:service:video'], undefined, true],
	} as const

export const getResourceAPI = ({ namespace, type, subtype }: ResourceName) =>
	`${namespace}:${type}:${subtype}`

export const getResourceKey = (name: ResourceName) => `${getResourceAPI(name)}/${name.name}`

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

export const hasWidget = (resource: ResourceName): boolean =>
	getResourceAPI(resource) in resourceMap

export const widgetForResource = (
	resource: ResourceName
): Component<ResourceWidget> | undefined => {
	const resAPI = getResourceAPI(resource)
	return resAPI in resourceMap
		? (resourceMap[resAPI as keyof typeof resourceMap][1] as Component<ResourceWidget> | undefined)
		: undefined
}

export const showResourceWidget = (resource: ResourceName) => {
	if (resource.namespace === 'rdk-internal') {
		return false
	}

	const resAPI = getResourceAPI(resource)
	// unknown apis should still get cards & show up in the sidebar
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][2] : true
}
