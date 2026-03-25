import {
	ArmClient,
	BaseClient,
	BoardClient,
	ButtonClient,
	CameraClient,
	DataManagerClient,
	DiscoveryClient,
	EncoderClient,
	GantryClient,
	GenericComponentClient,
	GenericServiceClient,
	GripperClient,
	InputControllerClient,
	MLModelClient,
	MotionClient,
	MotorClient,
	MovementSensorClient,
	NavigationClient,
	PoseTrackerClient,
	PowerSensorClient,
	type ResourceName,
	SensorClient,
	ServoClient,
	SlamClient,
	SwitchClient,
	VideoClient,
	VisionClient,
	WorldStateStoreClient,
} from '@viamrobotics/sdk'

import {
	ArmWidget,
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
} from '$lib'

import { getResourceAPI } from './resource.ts'

// The types are nicer to work with as arrays (as opposed to a record of objects) because TS will infer the types.
// try not to expose this map so that we can easily refactor it.
const resourceMap =
	// api: [client, testView, showResourceInControlView]
	// list created via `cat rdkbuiltins/viam-server-stable.json | rg "api" | sort | uniq`
	{
		'rdk:component:arm': [ArmClient, ArmWidget, true],
		'rdk:component:base': [BaseClient, BaseWidget, true],
		'rdk:component:board': [BoardClient, BoardWidget, true],
		'rdk:component:button': [ButtonClient, ButtonWidget, true],
		'rdk:component:camera': [CameraClient, CameraWidget, true],
		'rdk:component:encoder': [EncoderClient, EncoderWidget, true],
		'rdk:component:gantry': [GantryClient, GantryWidget, true],
		'rdk:component:generic': [GenericComponentClient, undefined, true],
		'rdk:component:gripper': [GripperClient, GripperWidget, true],
		'rdk:component:input_controller': [InputControllerClient, InputControllerWidget, true],
		'rdk:component:motor': [MotorClient, MotorWidget, true],
		'rdk:component:movement_sensor': [MovementSensorClient, MovementSensorWidget, true],
		'rdk:component:pose_tracker': [PoseTrackerClient, undefined, true],
		'rdk:component:power_sensor': [PowerSensorClient, PowerSensorWidget, true],
		'rdk:component:sensor': [SensorClient, SensorWidget, true],
		'rdk:component:servo': [ServoClient, ServoWidget, true],
		'rdk:component:switch': [SwitchClient, SwitchWidget, true],
		'rdk:service:base_remote_control': [undefined, undefined, true],
		// dont show -- confusing to users
		'rdk:service:data_manager': [DataManagerClient, undefined, false],
		'rdk:service:discovery': [DiscoveryClient, DiscoveryWidget, true],
		'rdk:service:generic': [GenericServiceClient, undefined, true],
		'rdk:service:mlmodel': [MLModelClient, MLModelServiceWidget, true],
		// dont show -- confusing to users
		'rdk:service:motion': [MotionClient, undefined, false],
		'rdk:service:navigation': [NavigationClient, NavigationServiceWidget, true],
		// dont show -- confusing to users
		'rdk:service:sensors': [undefined, undefined, false],
		'rdk:service:shell': [undefined, undefined, false],
		'rdk:service:slam': [SlamClient, SlamWidget, true],
		'rdk:service:vision': [VisionClient, VisionServiceWidget, true],
		'rdk:service:world_state_store': [WorldStateStoreClient, undefined, true],
		'rdk:service:video': [VideoClient, undefined, true],
	} as const

export const clientForBuiltinResource = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource)
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][0] : undefined
}

export const viewForBuiltinResource = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource)
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][1] : undefined
}

export const showResourceInControlView = (resource: ResourceName) => {
	if (resource.namespace === 'rdk-internal') {
		return false
	}

	const resAPI = getResourceAPI(resource)
	// unknown apis should still get cards & show up in the sidebar
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][2] : true
}
