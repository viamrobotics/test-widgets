/** The canonical set of Viam resource API triplets. */
export const ResourceTriplets = {
	// components
	Arm: 'rdk:component:arm',
	AudioInput: 'rdk:component:audio_in',
	AudioOutput: 'rdk:component:audio_out',
	Base: 'rdk:component:base',
	Board: 'rdk:component:board',
	Button: 'rdk:component:button',
	Camera: 'rdk:component:camera',
	Encoder: 'rdk:component:encoder',
	Gantry: 'rdk:component:gantry',
	GenericComponent: 'rdk:component:generic',
	Gripper: 'rdk:component:gripper',
	InputController: 'rdk:component:input_controller',
	Motor: 'rdk:component:motor',
	MovementSensor: 'rdk:component:movement_sensor',
	PoseTracker: 'rdk:component:pose_tracker',
	PowerSensor: 'rdk:component:power_sensor',
	Sensor: 'rdk:component:sensor',
	Servo: 'rdk:component:servo',
	Switch: 'rdk:component:switch',
	// services
	BaseRemoteControl: 'rdk:service:base_remote_control',
	DataManager: 'rdk:service:data_manager',
	Discovery: 'rdk:service:discovery',
	GenericService: 'rdk:service:generic',
	MLModel: 'rdk:service:mlmodel',
	Motion: 'rdk:service:motion',
	Navigation: 'rdk:service:navigation',
	Slam: 'rdk:service:slam',
	Sensors: 'rdk:service:sensors',
	Shell: 'rdk:service:shell',
	Video: 'rdk:service:video',
	Vision: 'rdk:service:vision',
	WorldStateStore: 'rdk:service:world_state_store',
} as const

/** A Viam resource API triplet, e.g. `'rdk:component:arm'`. */
export type ResourceTriplet = (typeof ResourceTriplets)[keyof typeof ResourceTriplets]
