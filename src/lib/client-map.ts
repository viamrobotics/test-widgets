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

import { getResourceAPI } from './get-resource-api.ts'
import { ResourceTriplets } from './resource-triplet.ts'

export const clientMap = {
	// components
	[ResourceTriplets.Arm]: ArmClient,
	[ResourceTriplets.AudioInput]: AudioInClient,
	[ResourceTriplets.AudioOutput]: AudioOutClient,
	[ResourceTriplets.Base]: BaseClient,
	[ResourceTriplets.Board]: BoardClient,
	[ResourceTriplets.Button]: ButtonClient,
	[ResourceTriplets.Camera]: CameraClient,
	[ResourceTriplets.Encoder]: EncoderClient,
	[ResourceTriplets.Gantry]: GantryClient,
	[ResourceTriplets.GenericComponent]: GenericComponentClient,
	[ResourceTriplets.Gripper]: GripperClient,
	[ResourceTriplets.InputController]: InputControllerClient,
	[ResourceTriplets.Motor]: MotorClient,
	[ResourceTriplets.MovementSensor]: MovementSensorClient,
	[ResourceTriplets.PoseTracker]: PoseTrackerClient,
	[ResourceTriplets.PowerSensor]: PowerSensorClient,
	[ResourceTriplets.Sensor]: SensorClient,
	[ResourceTriplets.Servo]: ServoClient,
	[ResourceTriplets.Switch]: SwitchClient,
	// services
	[ResourceTriplets.DataManager]: DataManagerClient,
	[ResourceTriplets.Discovery]: DiscoveryClient,
	[ResourceTriplets.GenericService]: GenericServiceClient,
	[ResourceTriplets.MLModel]: MLModelClient,
	[ResourceTriplets.Motion]: MotionClient,
	[ResourceTriplets.Navigation]: NavigationClient,
	[ResourceTriplets.Slam]: SlamClient,
	[ResourceTriplets.Video]: VideoClient,
	[ResourceTriplets.Vision]: VisionClient,
	[ResourceTriplets.WorldStateStore]: WorldStateStoreClient,
} as const

export const clientForResource = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource)
	return resAPI in clientMap ? clientMap[resAPI as keyof typeof clientMap] : undefined
}

export const supportsDoCommand = (resource: ResourceName): boolean => {
	const client = clientForResource(resource)
	return client !== undefined && client !== MLModelClient
}
