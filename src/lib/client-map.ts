import {
	ArmClient,
	AudioInClient,
	AudioOutClient,
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

import { getResourceAPI } from './resource.ts'

export const clientMap = {
	'rdk:component:arm': ArmClient,
	'rdk:component:audio_in': AudioInClient,
	'rdk:component:audio_out': AudioOutClient,
	'rdk:component:base': BaseClient,
	'rdk:component:board': BoardClient,
	'rdk:component:button': ButtonClient,
	'rdk:component:camera': CameraClient,
	'rdk:component:encoder': EncoderClient,
	'rdk:component:gantry': GantryClient,
	'rdk:component:generic': GenericComponentClient,
	'rdk:component:gripper': GripperClient,
	'rdk:component:input_controller': InputControllerClient,
	'rdk:component:motor': MotorClient,
	'rdk:component:movement_sensor': MovementSensorClient,
	'rdk:component:pose_tracker': PoseTrackerClient,
	'rdk:component:power_sensor': PowerSensorClient,
	'rdk:component:sensor': SensorClient,
	'rdk:component:servo': ServoClient,
	'rdk:component:switch': SwitchClient,
	'rdk:service:data_manager': DataManagerClient,
	'rdk:service:discovery': DiscoveryClient,
	'rdk:service:generic': GenericServiceClient,
	'rdk:service:mlmodel': MLModelClient,
	'rdk:service:motion': MotionClient,
	'rdk:service:navigation': NavigationClient,
	'rdk:service:slam': SlamClient,
	'rdk:service:vision': VisionClient,
	'rdk:service:world_state_store': WorldStateStoreClient,
	'rdk:service:video': VideoClient,
} as const

export const clientForBuiltinResource = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource)
	return resAPI in clientMap ? clientMap[resAPI as keyof typeof clientMap] : undefined
}

export const supportsDoCommand = (resource: ResourceName): boolean => {
	const client = clientForBuiltinResource(resource)
	return client !== undefined && client !== MLModelClient
}
