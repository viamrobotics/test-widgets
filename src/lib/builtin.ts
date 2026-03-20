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
	WorldStateStoreClient
} from '@viamrobotics/sdk';

import ArmView from './components/widgets/arm/arm.svelte';
import BaseView from './components/widgets/base/base.svelte';
import BoardView from './components/widgets/board/board.svelte';
import ButtonView from './components/widgets/button/button.svelte';
import CameraView from './components/widgets/camera/camera.svelte';
import DiscoveryView from './components/widgets/discovery/discovery.svelte';
import EncoderView from './components/widgets/encoder/encoder.svelte';
import GantryView from './components/widgets/gantry/gantry.svelte';
import GripperView from './components/widgets/gripper/gripper.svelte';
import InputControllerView from './components/widgets/input-controller/input-controller.svelte';
import MlModelServiceView from './components/widgets/ml-model-service/ml-model-service.svelte';
import MotorView from './components/widgets/motor/motor.svelte';
import MovementSensorView from './components/widgets/movement-sensor/movement-sensor.svelte';
import NavigationServiceView from './components/widgets/navigation/navigation.svelte';
import PowerSensorView from './components/widgets/power-sensor/power-sensor.svelte';
import SensorView from './components/widgets/sensor/sensor.svelte';
import ServoView from './components/widgets/servo/servo.svelte';
import SlamView from './components/widgets/slam/slam.svelte';
import SwitchView from './components/widgets/switch/switch.svelte';
import VisionServiceView from './components/widgets/vision-service/vision-service.svelte';
import { getResourceAPI } from './resource.ts';

// The types are nicer to work with as arrays (as opposed to a record of objects) because TS will infer the types.
// try not to expose this map so that we can easily refactor it.
const resourceMap =
	// api: [client, testView, showResourceInControlView]
	// list created via `cat rdkbuiltins/viam-server-stable.json | rg "api" | sort | uniq`
	{
		'rdk:component:arm': [ArmClient, ArmView, true],
		'rdk:component:base': [BaseClient, BaseView, true],
		'rdk:component:board': [BoardClient, BoardView, true],
		'rdk:component:button': [ButtonClient, ButtonView, true],
		'rdk:component:camera': [CameraClient, CameraView, true],
		'rdk:component:encoder': [EncoderClient, EncoderView, true],
		'rdk:component:gantry': [GantryClient, GantryView, true],
		'rdk:component:generic': [GenericComponentClient, undefined, true],
		'rdk:component:gripper': [GripperClient, GripperView, true],
		'rdk:component:input_controller': [InputControllerClient, InputControllerView, true],
		'rdk:component:motor': [MotorClient, MotorView, true],
		'rdk:component:movement_sensor': [MovementSensorClient, MovementSensorView, true],
		'rdk:component:pose_tracker': [PoseTrackerClient, undefined, true],
		'rdk:component:power_sensor': [PowerSensorClient, PowerSensorView, true],
		'rdk:component:sensor': [SensorClient, SensorView, true],
		'rdk:component:servo': [ServoClient, ServoView, true],
		'rdk:component:switch': [SwitchClient, SwitchView, true],
		'rdk:service:base_remote_control': [undefined, undefined, true],
		// dont show -- confusing to users
		'rdk:service:data_manager': [DataManagerClient, undefined, false],
		'rdk:service:discovery': [DiscoveryClient, DiscoveryView, true],
		'rdk:service:generic': [GenericServiceClient, undefined, true],
		'rdk:service:mlmodel': [MLModelClient, MlModelServiceView, true],
		// dont show -- confusing to users
		'rdk:service:motion': [MotionClient, undefined, false],
		'rdk:service:navigation': [NavigationClient, NavigationServiceView, true],
		// dont show -- confusing to users
		'rdk:service:sensors': [undefined, undefined, false],
		'rdk:service:shell': [undefined, undefined, false],
		'rdk:service:slam': [SlamClient, SlamView, true],
		'rdk:service:vision': [VisionClient, VisionServiceView, true],
		'rdk:service:world_state_store': [WorldStateStoreClient, undefined, true],
		'rdk:service:video': [VideoClient, undefined, true]
	} as const;

export const clientForBuiltinResource = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource);
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][0] : undefined;
};

export const viewForBuiltinResource = (resource: ResourceName) => {
	const resAPI = getResourceAPI(resource);
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][1] : undefined;
};

export const showResourceInControlView = (resource: ResourceName) => {
	if (resource.namespace === 'rdk-internal') {
		return false;
	}

	const resAPI = getResourceAPI(resource);
	// unknown apis should still get cards & show up in the sidebar
	return resAPI in resourceMap ? resourceMap[resAPI as keyof typeof resourceMap][2] : true;
};
