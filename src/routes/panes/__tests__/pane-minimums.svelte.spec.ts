import type { PaneNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'

import { render } from '@testing-library/svelte'
import {
	appRobotApi,
	Detection,
	EncoderPositionType,
	navigationApi,
	slamApi,
} from '@viamrobotics/sdk'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PaneSize } from '../layout-minimum'

import { compositePane, entryPanes, type ResourcePane } from '../resource-pane'
import { resourcePaneMinimum } from '../resource-pane-minimums'
import InPaneFrame from './__fixtures__/in-pane-frame.svelte'

const state = vi.hoisted((): { data: Record<string, unknown> } => ({ data: {} }))

const servedQuery = vi.hoisted(() => (method: string) => ({
	get data() {
		return state.data[method]
	},
	error: null,
	isLoading: false,
	isSuccess: true,
	isError: false,
	isFetching: false,
	fetchStatus: 'idle',
	refetch: () => Promise.resolve({ data: state.data[method], error: null }),
}))

vi.mock('@viamrobotics/svelte-sdk', async (importOriginal) => {
	const { MachineConnectionEvent } = await import('@viamrobotics/sdk')
	const resourceNameFor = (subtype: unknown) => (subtype === 'motion' ? 'builtin' : 'camera-1')
	return {
		...(await importOriginal<typeof import('@viamrobotics/svelte-sdk')>()),
		useConnectionStatus: () => ({ current: MachineConnectionEvent.CONNECTED }),
		useRobotClient: () => ({ current: undefined }),
		useResourceStatuses: (_partID: unknown, subtype: unknown) => ({
			current: [{ name: { name: resourceNameFor(subtype) } }],
		}),
		createResourceClient: () => ({ current: {} }),
		createStreamClient: () => ({ mediaStream: undefined }),
		createResourceQuery: (_client: unknown, method: string) => servedQuery(method),
		createRobotQuery: (_client: unknown, method: string) => servedQuery(method),
		createResourceMutation: () => ({
			mutate: () => {},
			mutateAsync: () => Promise.resolve(),
			isPending: false,
			error: null,
		}),
	}
})

const PART_ID = 'part-1'
const TOLERANCE_PX = 2
const PANE_BORDERS_PX = 2
const SETTLE_FRAMES = 20

const resource = (subtype: string, name: string, type = 'component'): ResourceName => ({
	namespace: 'rdk',
	type,
	subtype,
	name,
})

const FRAME_WIDTH = 640
const FRAME_HEIGHT = 360

const encodeFrame = async (mimeType: string) => {
	const canvas = new OffscreenCanvas(FRAME_WIDTH, FRAME_HEIGHT)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('No 2D context to draw the frame')
	context.fillStyle = 'rgb(128 128 128)'
	context.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT)
	const blob = await canvas.convertToBlob({ type: mimeType })
	return new Uint8Array(await blob.arrayBuffer())
}

const frames = { jpeg: new Uint8Array(), png: new Uint8Array() }

const POINT_CLOUD = new TextEncoder().encode(
	[
		'VERSION 0.7',
		'FIELDS x y z',
		'SIZE 4 4 4',
		'TYPE F F F',
		'COUNT 1 1 1',
		'WIDTH 2',
		'HEIGHT 1',
		'VIEWPOINT 0 0 0 1 0 0 0',
		'POINTS 2',
		'DATA ascii',
		'0 0 0',
		'1 1 1',
		'',
	].join('\n')
)

const READINGS = { temperature_c: 21.6, humidity_pct: 48.2, firmware: 'v2.4.1', uptime_s: 86_400 }

const SENSOR_DATA = { getReadings: READINGS }

const MOVEMENT_SENSOR_DATA = {
	getProperties: {
		positionSupported: true,
		orientationSupported: true,
		compassHeadingSupported: true,
		angularVelocitySupported: true,
		linearVelocitySupported: true,
		linearAccelerationSupported: true,
	},
	getPosition: {
		coordinate: { latitude: 40.123_456_7, longitude: -73.654_321_9 },
		altitudeM: 12.5,
	},
	getOrientation: { oX: 1.111, oY: 2.222, oZ: 3.333, theta: 45.678 },
	getCompassHeading: 123.456,
	getAngularVelocity: { x: 1.25, y: -2.5, z: 3.75 },
	getLinearVelocity: { x: 0.5, y: -1.5, z: 2.25 },
	getLinearAcceleration: { x: 9.81, y: -0.12, z: 0.34 },
	getAccuracy: { positionNmeaGgaFix: 4, positionHdop: 1.234, positionVdop: 4.567, accuracy: {} },
	getReadings: READINGS,
}

const POWER_SENSOR_DATA = {
	getVoltage: [12.5, true],
	getCurrent: [1.5, false],
	getPower: 18.75,
	getReadings: READINGS,
}

const ENCODER_DATA = {
	getProperties: { ticksCountSupported: true, angleDegreesSupported: true },
	getPosition: [123.456, EncoderPositionType.ANGLE_DEGREES],
}

const SWITCH_DATA = {
	getPosition: 1,
	getNumberOfPositions: [3, ['Off', 'Low', 'High']],
}

const INPUT_CONTROLLER_DATA = {
	getEvents: [
		{ control: 'AbsoluteX', value: 0.5 },
		{ control: 'AbsoluteY', value: -0.25 },
		{ control: 'ButtonSouth', value: 1 },
		{ control: 'ButtonEast', value: 0 },
	],
}

const NAVIGATION_PATHS = [
	{
		destinationWaypointId: 'waypoint-a',
		geopoints: [
			{ latitude: 40.7129, longitude: -74.0062 },
			{ latitude: 40.713, longitude: -74.006 },
		],
	},
]

const CAMERA_PROPERTIES = {
	supportsPcd: true,
	frameRate: 30,
	mimeTypes: ['image/jpeg', 'image/png'],
	intrinsicParameters: {
		widthPx: 640,
		heightPx: 360,
		focalXPx: 500.5,
		focalYPx: 500.5,
		centerXPx: 320,
		centerYPx: 180,
	},
	distortionParameters: { model: 'brown_conrady', parameters: [0.1, -0.2, 0.01, 0.02, 0.3] },
}

const cameraData = () => ({
	getImages: { images: [{ sourceName: 'color', mimeType: 'image/jpeg', image: frames.jpeg }] },
	getPointCloud: POINT_CLOUD,
	getProperties: CAMERA_PROPERTIES,
})

// GetImages and GetPointCloud fetch on a press, so the idle state has no point cloud to show.
const cameraIdleData = () => ({ getProperties: CAMERA_PROPERTIES })

const VISION_DETECTIONS = [
	new Detection({
		xMin: 100n,
		yMin: 60n,
		xMax: 300n,
		yMax: 240n,
		confidence: 0.9,
		className: 'person',
	}),
]

const VISION_CLASSIFICATIONS = [
	{ className: 'dog', confidence: 0.5 },
	{ className: 'dragon', confidence: 0.4 },
]

const visionData = () => ({
	getProperties: {
		classificationsSupported: true,
		detectionsSupported: true,
		objectPointCloudsSupported: true,
		defaultCamera: 'camera-1',
	},
	captureAllFromCamera: {
		image: { image: frames.png, mimeType: 'image/png' },
		detections: VISION_DETECTIONS,
		classifications: VISION_CLASSIFICATIONS,
	},
	getObjectPointClouds: [],
	getDetectionsFromCamera: VISION_DETECTIONS,
	getClassificationsFromCamera: VISION_CLASSIFICATIONS,
})

const VISION_PRESS_FETCHED_METHODS: ReadonlySet<string> = new Set([
	'captureAllFromCamera',
	'getObjectPointClouds',
])

// Capture and GetObjectPointClouds fetch on a press, so the idle state has neither result.
const visionIdleData = () =>
	Object.fromEntries(
		Object.entries(visionData()).filter(([method]) => !VISION_PRESS_FETCHED_METHODS.has(method))
	)

const NAVIGATION_DATA = {
	getMode: navigationApi.Mode.WAYPOINT,
	getLocation: {
		location: { latitude: 40.712_812_3, longitude: -74.006_012_3 },
		compassHeading: 123.456,
	},
	getWayPoints: [
		{ id: 'waypoint-a', location: { latitude: 40.7129, longitude: -74.0062 } },
		{ id: 'waypoint-b', location: { latitude: 40.7133, longitude: -74.0055 } },
	],
	getPaths: NAVIGATION_PATHS,
	getProperties: { mapType: navigationApi.MapType.GPS },
	getObstacles: [
		{
			location: { latitude: 40.7131, longitude: -74.0058 },
			geometries: [
				{
					label: '',
					center: { x: 0, y: 0, z: 0, oX: 0, oY: 0, oZ: 1, theta: 45 },
					geometryType: {
						case: 'box',
						value: { dimsMm: { x: 1000, y: 2000, z: 3000 } },
					},
				},
			],
		},
	],
}

const SLAM_PROPERTIES = {
	cloudSlam: false,
	mappingMode: slamApi.MappingMode.UPDATE_EXISTING_MAP,
	internalStateFileType: '.pbstream',
	sensorInfo: [
		{ name: 'lidar-1', type: slamApi.SensorType.CAMERA },
		{ name: 'imu-1', type: slamApi.SensorType.MOVEMENT_SENSOR },
	],
}

const SLAM_POSITION = {
	pose: { x: 1234, y: 2345, z: 3456, oX: 0, oY: 0, oZ: 1, theta: 45 },
	componentReference: 'base-1',
}

const slamData = () => ({
	getProperties: SLAM_PROPERTIES,
	getPosition: SLAM_POSITION,
	getPointCloudMap: POINT_CLOUD,
})

// GetPointCloudMap fetches on a press, so the idle state has no map to show.
const slamIdleData = () => ({ getProperties: SLAM_PROPERTIES, getPosition: SLAM_POSITION })

const AUDIO_INPUT_DATA = {
	getProperties: { numChannels: 2, sampleRateHz: 48_000, supportedCodecs: ['pcm16', 'mp3'] },
}

const AUDIO_OUTPUT_DATA = {
	getProperties: { numChannels: 2, sampleRateHz: 48_000, supportedCodecs: ['pcm16', 'mp3'] },
}

const DISCOVERED_CONFIGS = [
	new appRobotApi.ComponentConfig({
		name: 'cam-0',
		api: 'rdk:component:camera',
		model: 'rdk:builtin:webcam',
	}),
	new appRobotApi.ComponentConfig({
		name: 'cam-1',
		api: 'rdk:component:camera',
		model: 'rdk:builtin:webcam',
	}),
	new appRobotApi.ComponentConfig({
		name: 'motor-1',
		api: 'rdk:component:motor',
		model: 'rdk:builtin:gpio',
	}),
]

const DISCOVERY_RESOLVED_DATA = { discoverResources: DISCOVERED_CONFIGS }

const ML_MODEL_DATA = {
	metadata: {
		metadata: {
			name: 'person-detector',
			type: 'tflite_detector',
			description: 'Finds people in a frame',
			inputInfo: [
				{ name: 'image', dataType: 'uint8', shape: [1n, 320n, 320n, 3n], description: 'RGB frame' },
			],
			outputInfo: [
				{ name: 'scores', dataType: 'float32', shape: [1n, 10n], description: 'Confidence' },
			],
		},
	},
}

const POSE = { x: 1, y: 2, z: 3, oX: 0, oY: 0, oZ: 1, theta: 0 }

const ARM_DATA = {
	getProperties: { supportManualMode: true, supportCartesianCommands: true },
	getManualMode: false,
	getJointPositions: { values: [0, 10, 20, 30, 40, 50] },
	getEndPosition: POSE,
	isMoving: true,
	frameSystemConfig: [],
	getPose: { pose: POSE, referenceFrame: 'world' },
}

const ARM_JOINT_COUNT = 6
const ARM_JOINT_LIMIT_DEGREES = 180

// The arm control interface also reads the joint limits, and Jog and Joints plan through the frame.
const ARM_CONTROLS_DATA = {
	...ARM_DATA,
	getKinematics: {
		kinematicParamType: 'SVA',
		joints: Array.from({ length: ARM_JOINT_COUNT }, () => ({
			min: -ARM_JOINT_LIMIT_DEGREES,
			max: ARM_JOINT_LIMIT_DEGREES,
		})),
	},
	frameSystemConfig: [
		{ frame: { referenceFrame: 'arm-1', poseInObserverFrame: { referenceFrame: 'world' } } },
	],
}

const MOTOR_DATA = {
	getProperties: { positionReporting: true },
	getPosition: 12.3456,
	isPowered: [true, 0.5],
	isMoving: true,
}

const BASE_DATA = {
	isMoving: true,
	getProperties: { widthMeters: 0.4, turningRadiusMeters: 0.2, wheelCircumferenceMeters: 0.3 },
}

const GRIPPER_DATA = {
	getCurrentInputs: [0.25, 0.5],
	isHoldingSomething: { isHoldingSomething: false },
	isMoving: true,
}

const GANTRY_DATA = {
	getPosition: [123.456, 234.567, 345.678],
	getLengths: [1000, 1000, 1000],
	isMoving: true,
}

const SERVO_DATA = { getPosition: 90, isMoving: true }

const MOTION_DATA = {
	frameSystemConfig: [
		{ frame: { referenceFrame: 'arm-1', poseInObserverFrame: { referenceFrame: 'world' } } },
	],
	getPose: { pose: POSE, referenceFrame: 'world' },
}

interface MinimumRow {
	id: string
	resource: ResourceName
	data: () => Record<string, unknown>
	/** The narrowest pane width the body lays out in, when its min-content collapses below it. */
	floorWidth?: number
}

const arm = resource('arm', 'arm-1')
const motor = resource('motor', 'motor-1')
const motion = resource('motion', 'motion-1', 'service')
const base = resource('base', 'base-1')
const gantry = resource('gantry', 'gantry-1')
const servo = resource('servo', 'servo-1')
const gripper = resource('gripper', 'gripper-1')
const board = resource('board', 'board-1')
const boardData = () => ({})
const armData = () => ARM_DATA
const armControlsData = () => ARM_CONTROLS_DATA
const motorData = () => MOTOR_DATA
// Quick move is narrower holding an RPM (position reporting) than holding a power, 248 px against
// 276 px, so its row measures the wider power mode. Controls and Move are widest with position.
const motorPowerModeData = () => ({ ...MOTOR_DATA, getProperties: { positionReporting: false } })
const motionData = () => MOTION_DATA
const baseData = () => BASE_DATA
const gantryData = () => GANTRY_DATA
const servoData = () => SERVO_DATA
const gripperData = () => GRIPPER_DATA
const sensor = resource('sensor', 'sensor-1')
const movementSensor = resource('movement_sensor', 'movement-sensor-1')
const powerSensor = resource('power_sensor', 'power-sensor-1')
const encoder = resource('encoder', 'encoder-1')
const switchResource = resource('switch', 'switch-1')
const inputController = resource('input_controller', 'input-controller-1')
const camera = resource('camera', 'camera-1')
const vision = resource('vision', 'vision-1', 'service')
const navigation = resource('navigation', 'navigation-1', 'service')
const slam = resource('slam', 'slam-1', 'service')
const audioInput = resource('audio_in', 'audio-input-1')
const audioOutput = resource('audio_out', 'audio-output-1')
const discovery = resource('discovery', 'discovery-1', 'service')
const mlModel = resource('mlmodel', 'ml-model-1', 'service')
const audioInputData = () => AUDIO_INPUT_DATA
const audioOutputData = () => AUDIO_OUTPUT_DATA
const discoveryIdleData = () => ({})
const discoveryResolvedData = () => DISCOVERY_RESOLVED_DATA
const mlModelData = () => ML_MODEL_DATA
const navigationData = () => NAVIGATION_DATA

const ROWS: MinimumRow[] = [
	{ id: 'arm-1::composite', resource: arm, data: armData },
	{ id: 'arm-1::jog', resource: arm, data: armControlsData },
	{ id: 'arm-1::joints', resource: arm, data: armControlsData },
	{ id: 'arm-1::move-to-joint-positions', resource: arm, data: armData },
	{ id: 'arm-1::move-to-position', resource: arm, data: armData },
	{ id: 'arm-1::get-joint-positions', resource: arm, data: armData },
	{ id: 'arm-1::get-end-position', resource: arm, data: armData },
	{ id: 'arm-1::is-moving', resource: arm, data: armData },
	{ id: 'arm-1::manual-mode', resource: arm, data: armData },
	{ id: 'arm-1::set-manual-mode', resource: arm, data: armData },
	{ id: 'arm-1::get-manual-mode', resource: arm, data: armData },
	{ id: 'arm-1::get-properties', resource: arm, data: armData },
	{ id: 'arm-1::stop', resource: arm, data: armData },
	{ id: 'motor-1::composite', resource: motor, data: motorData },
	{ id: 'motor-1::controls', resource: motor, data: motorData },
	{ id: 'motor-1::quick-move', resource: motor, data: motorPowerModeData },
	{ id: 'motor-1::move', resource: motor, data: motorData },
	{ id: 'motor-1::set-power', resource: motor, data: motorData },
	{ id: 'motor-1::set-rpm', resource: motor, data: motorData },
	{ id: 'motor-1::go-for', resource: motor, data: motorData },
	{ id: 'motor-1::go-to', resource: motor, data: motorData },
	{ id: 'motor-1::is-moving', resource: motor, data: motorData },
	{ id: 'motor-1::reset-zero-position', resource: motor, data: motorData },
	{ id: 'motor-1::get-position', resource: motor, data: motorData },
	{ id: 'motor-1::get-properties', resource: motor, data: motorData },
	{ id: 'motor-1::stop', resource: motor, data: motorData },
	{ id: 'motor-1::is-powered', resource: motor, data: motorData },
	{ id: 'motion-1::composite', resource: motion, data: motionData },
	{ id: 'base-1::composite', resource: base, data: baseData },
	{ id: 'base-1::controls', resource: base, data: baseData },
	{ id: 'base-1::quick-move', resource: base, data: baseData },
	{ id: 'base-1::move-straight', resource: base, data: baseData },
	{ id: 'base-1::spin', resource: base, data: baseData },
	{ id: 'base-1::set-power', resource: base, data: baseData },
	{ id: 'base-1::set-velocity', resource: base, data: baseData },
	{ id: 'base-1::is-moving', resource: base, data: baseData },
	{ id: 'base-1::stop', resource: base, data: baseData },
	{ id: 'base-1::get-properties', resource: base, data: baseData },
	{ id: 'gantry-1::composite', resource: gantry, data: gantryData },
	{ id: 'gantry-1::controls', resource: gantry, data: gantryData },
	{ id: 'gantry-1::home', resource: gantry, data: gantryData },
	{ id: 'gantry-1::move-to-position', resource: gantry, data: gantryData },
	{ id: 'gantry-1::quick-move', resource: gantry, data: gantryData },
	{ id: 'gantry-1::get-position', resource: gantry, data: gantryData },
	{ id: 'gantry-1::is-moving', resource: gantry, data: gantryData },
	{ id: 'gantry-1::get-lengths', resource: gantry, data: gantryData },
	{ id: 'gantry-1::stop', resource: gantry, data: gantryData },
	{ id: 'servo-1::composite', resource: servo, data: servoData },
	{ id: 'servo-1::controls', resource: servo, data: servoData },
	{ id: 'servo-1::move', resource: servo, data: servoData },
	{ id: 'servo-1::quick-move', resource: servo, data: servoData },
	{ id: 'servo-1::move-to', resource: servo, data: servoData },
	{ id: 'servo-1::is-moving', resource: servo, data: servoData },
	{ id: 'servo-1::get-position', resource: servo, data: servoData },
	{ id: 'servo-1::stop', resource: servo, data: servoData },
	{ id: 'board-1::composite', resource: board, data: boardData },
	{ id: 'board-1::controls', resource: board, data: boardData },
	{ id: 'board-1::pins', resource: board, data: boardData },
	{ id: 'gripper-1::composite', resource: gripper, data: gripperData },
	{ id: 'gripper-1::controls', resource: gripper, data: gripperData },
	{ id: 'gripper-1::open-grab', resource: gripper, data: gripperData },
	{ id: 'gripper-1::get-current-inputs', resource: gripper, data: gripperData },
	{ id: 'gripper-1::go-to-inputs', resource: gripper, data: gripperData },
	{ id: 'board-1::set-gpio', resource: board, data: boardData },
	{ id: 'board-1::get-gpio', resource: board, data: boardData },
	{ id: 'board-1::pwm', resource: board, data: boardData },
	{ id: 'board-1::set-pwm', resource: board, data: boardData },
	{ id: 'board-1::pwm-frequency', resource: board, data: boardData },
	{ id: 'board-1::set-pwm-frequency', resource: board, data: boardData },
	{ id: 'board-1::read-analog-reader', resource: board, data: boardData },
	{ id: 'board-1::write-analog', resource: board, data: boardData },
	{ id: 'board-1::get-digital-interrupt-value', resource: board, data: boardData },
	{ id: 'board-1::stream-ticks', resource: board, data: boardData },
	{ id: 'board-1::set-power-mode', resource: board, data: boardData },
	{ id: 'sensor-1::composite', resource: sensor, data: () => SENSOR_DATA },
	{ id: 'movement-sensor-1::controls', resource: movementSensor, data: () => MOVEMENT_SENSOR_DATA },
	{
		id: 'movement-sensor-1::composite',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-position',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-orientation',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-compass-heading',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-accuracy',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-linear-velocity',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-angular-velocity',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-linear-acceleration',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-properties',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{
		id: 'movement-sensor-1::get-readings',
		resource: movementSensor,
		data: () => MOVEMENT_SENSOR_DATA,
	},
	{ id: 'power-sensor-1::controls', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::composite', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-voltage', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-current', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-power', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'power-sensor-1::get-readings', resource: powerSensor, data: () => POWER_SENSOR_DATA },
	{ id: 'encoder-1::controls', resource: encoder, data: () => ENCODER_DATA },
	{ id: 'encoder-1::composite', resource: encoder, data: () => ENCODER_DATA },
	{ id: 'encoder-1::get-position', resource: encoder, data: () => ENCODER_DATA },
	{ id: 'encoder-1::reset-position', resource: encoder, data: () => ENCODER_DATA },
	{ id: 'encoder-1::get-properties', resource: encoder, data: () => ENCODER_DATA },
	{ id: 'switch-1::composite', resource: switchResource, data: () => SWITCH_DATA },
	{ id: 'switch-1::controls', resource: switchResource, data: () => SWITCH_DATA },
	{ id: 'switch-1::set-position', resource: switchResource, data: () => SWITCH_DATA },
	{ id: 'switch-1::get-position', resource: switchResource, data: () => SWITCH_DATA },
	{ id: 'switch-1::get-number-of-positions', resource: switchResource, data: () => SWITCH_DATA },
	{
		id: 'input-controller-1::composite',
		resource: inputController,
		data: () => INPUT_CONTROLLER_DATA,
	},
	{
		id: 'input-controller-1::get-events',
		resource: inputController,
		data: () => INPUT_CONTROLLER_DATA,
	},
	{
		id: 'input-controller-1::trigger-event',
		resource: inputController,
		data: () => INPUT_CONTROLLER_DATA,
	},
	{ id: 'camera-1::composite', resource: camera, data: cameraIdleData },
	{ id: 'vision-1::composite', resource: vision, data: visionIdleData },
	{ id: 'camera-1::controls', resource: camera, data: cameraData },
	{ id: 'camera-1::get-images', resource: camera, data: cameraIdleData },
	{ id: 'camera-1::get-point-cloud', resource: camera, data: cameraIdleData },
	{ id: 'camera-1::get-properties', resource: camera, data: cameraData },
	{ id: 'vision-1::controls', resource: vision, data: visionData },
	{ id: 'vision-1::capture-all-from-camera', resource: vision, data: visionIdleData },
	{ id: 'vision-1::get-properties', resource: vision, data: visionData },
	{ id: 'vision-1::get-object-point-clouds', resource: vision, data: visionIdleData },
	{ id: 'vision-1::get-detections-from-camera', resource: vision, data: visionData },
	{ id: 'vision-1::get-classifications-from-camera', resource: vision, data: visionData },
	{ id: 'vision-1::get-detections', resource: vision, data: visionData },
	{ id: 'vision-1::get-classifications', resource: vision, data: visionData },
	{ id: 'navigation-1::composite', resource: navigation, data: navigationData },
	{ id: 'navigation-1::controls', resource: navigation, data: navigationData },
	{ id: 'navigation-1::get-mode', resource: navigation, data: navigationData },
	{ id: 'navigation-1::set-mode', resource: navigation, data: navigationData },
	{ id: 'navigation-1::get-location', resource: navigation, data: navigationData },
	{ id: 'navigation-1::get-waypoints', resource: navigation, data: navigationData },
	{ id: 'navigation-1::add-waypoint', resource: navigation, data: navigationData },
	{ id: 'navigation-1::remove-waypoint', resource: navigation, data: navigationData },
	{ id: 'navigation-1::get-obstacles', resource: navigation, data: navigationData },
	{ id: 'navigation-1::get-paths', resource: navigation, data: navigationData },
	{ id: 'navigation-1::get-properties', resource: navigation, data: navigationData },
	{ id: 'slam-1::composite', resource: slam, data: slamIdleData },
	{ id: 'slam-1::controls', resource: slam, data: slamData },
	{ id: 'slam-1::get-position', resource: slam, data: slamData },
	{ id: 'slam-1::get-point-cloud-map', resource: slam, data: slamIdleData },
	{ id: 'slam-1::get-properties', resource: slam, data: slamData },
	{ id: 'slam-1::get-internal-state', resource: slam, data: slamIdleData },
	{ id: 'audio-input-1::controls', resource: audioInput, data: audioInputData },
	{ id: 'audio-input-1::get-audio', resource: audioInput, data: audioInputData },
	{ id: 'audio-input-1::get-properties', resource: audioInput, data: audioInputData },
	{ id: 'audio-output-1::controls', resource: audioOutput, data: audioOutputData },
	{ id: 'audio-output-1::play', resource: audioOutput, data: audioOutputData },
	{ id: 'audio-output-1::play-stream', resource: audioOutput, data: audioOutputData },
	{ id: 'audio-output-1::get-properties', resource: audioOutput, data: audioOutputData },
	{ id: 'discovery-1::composite', resource: discovery, data: discoveryIdleData },
	{ id: 'discovery-1::controls', resource: discovery, data: discoveryResolvedData },
	{ id: 'discovery-1::discover-resources', resource: discovery, data: discoveryIdleData },
	{ id: 'ml-model-1::composite', resource: mlModel, data: mlModelData },
	{ id: 'ml-model-1::metadata', resource: mlModel, data: mlModelData },
	{ id: 'ml-model-1::infer', resource: mlModel, data: mlModelData },
]

/** The `arm-1::jog` pane's minimum width, Jog's 239 px plus the pane's 2 px of borders. */
const ARM_JOG_PANE_WIDTH = 241

// Their bodies have no min-content width, so the registry gives each its narrowest entry's width.
const NO_MIN_CONTENT_ROWS: MinimumRow[] = [
	// Its columns have `min-w-0`, so it measures 116 px while its Jog rows overflow below the Jog
	// pane's width. The height is read at that floor.
	{ id: 'arm-1::controls', resource: arm, data: armControlsData, floorWidth: ARM_JOG_PANE_WIDTH },
	{ id: 'audio-input-1::composite', resource: audioInput, data: audioInputData },
	{ id: 'audio-output-1::composite', resource: audioOutput, data: audioOutputData },
]

const paneFor = (row: MinimumRow): PaneNode<ResourcePane> => {
	const pane = [compositePane(row.resource), ...entryPanes(row.resource)].find(
		(candidate) => candidate?.id === row.id
	)
	if (!pane) throw new Error(`No pane for ${row.id}`)
	return pane
}

const nextFrame = () =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve()
		})
	})

const afterLayoutSettles = async () => {
	await document.fonts.ready
	for (let frame = 0; frame < SETTLE_FRAMES; frame += 1) await nextFrame()
}

const renderedPaneParts = () => {
	const host = document.querySelector<HTMLElement>('[data-testid="pane-host"]')
	const frame = host?.querySelector<HTMLElement>('[data-pane-id]')
	const header = frame?.querySelector<HTMLElement>('[data-pane-header]')
	const bodyMinWidth = frame?.querySelector<HTMLElement>('div[style*="min-width"]')
	const body = bodyMinWidth?.parentElement
	if (!host || !frame || !header || !bodyMinWidth || !body) throw new Error('No pane rendered')
	return { host, frame, header, bodyMinWidth, body }
}

const elementsStyled = (root: HTMLElement, matches: (style: CSSStyleDeclaration) => boolean) =>
	[...root.querySelectorAll<HTMLElement>('*')].filter((element) =>
		matches(getComputedStyle(element))
	)

const liftContainerQueries = (root: HTMLElement) => {
	const containers = elementsStyled(root, (style) => style.containerType !== 'normal')
	for (const element of containers) element.style.containerType = 'normal'
	return () => {
		for (const element of containers) element.style.containerType = ''
	}
}

const letHeaderTitleTruncate = (header: HTMLElement) => {
	for (const element of elementsStyled(header, (style) => style.textOverflow === 'ellipsis')) {
		element.style.maxWidth = '0px'
	}
}

/**
 * The pane's smallest size as rendered, header and borders included. Width is the pane's
 * min-content plus its 2 px of borders. Height is its header plus the body's `scrollHeight` at
 * that width, plus the same 2 px. The host starts narrower than any pane, so media a widget sizes
 * to its container adds no width. The body's min-width comes from the row under test, so it is
 * cleared. A container query container reports no min-content, so containment is lifted while the
 * width is read. The header's title truncates by design, so it adds no width. A `floorWidth` lifts
 * the width, and the height read at it, for a body whose min-content collapses below its content.
 */
const measureRenderedMinimum = async (
	pane: PaneNode<ResourcePane>,
	floorWidth = 0
): Promise<PaneSize> => {
	render(InPaneFrame, { paneNode: pane, partID: PART_ID })
	await afterLayoutSettles()
	const { host, frame, header, bodyMinWidth, body } = renderedPaneParts()
	bodyMinWidth.style.minWidth = '0px'

	const restoreContainerQueries = liftContainerQueries(frame)
	letHeaderTitleTruncate(header)
	frame.style.width = 'min-content'
	await nextFrame()
	const width = Math.max(Math.ceil(frame.getBoundingClientRect().width), floorWidth)

	restoreContainerQueries()
	frame.style.width = ''
	host.style.width = `${String(width)}px`
	host.style.height = '1px'
	await afterLayoutSettles()
	const height = Math.ceil(header.getBoundingClientRect().height) + body.scrollHeight
	return { width, height: height + PANE_BORDERS_PX }
}

describe('resourcePaneMinimum', () => {
	beforeAll(async () => {
		frames.jpeg = await encodeFrame('image/jpeg')
		frames.png = await encodeFrame('image/png')
	})

	beforeEach(() => {
		localStorage.clear()
	})

	it.each(ROWS)('holds $id at its rendered minimum, within 2 px', async (row) => {
		state.data = row.data()
		const pane = paneFor(row)

		const measured = await measureRenderedMinimum(pane)

		const listed = resourcePaneMinimum(pane.data)
		const drift = Math.max(
			Math.abs(measured.width - listed.width),
			Math.abs(measured.height - listed.height)
		)
		expect(
			drift,
			`${row.id} renders at ${String(measured.width)} x ${String(measured.height)}, resourcePaneMinimum lists ${String(listed.width)} x ${String(listed.height)}`
		).toBeLessThanOrEqual(TOLERANCE_PX)
	})
})

describe('resourcePaneMinimum, for a body with no min-content width', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it.each(NO_MIN_CONTENT_ROWS)(
		'holds $id at its rendered height and no narrower than it renders',
		async (row) => {
			state.data = row.data()
			const pane = paneFor(row)

			const measured = await measureRenderedMinimum(pane, row.floorWidth)

			const listed = resourcePaneMinimum(pane.data)
			const drift = `${row.id} renders at ${String(measured.width)} x ${String(measured.height)}, resourcePaneMinimum lists ${String(listed.width)} x ${String(listed.height)}`
			expect(Math.abs(measured.height - listed.height), drift).toBeLessThanOrEqual(TOLERANCE_PX)
			expect(listed.width, drift).toBeGreaterThanOrEqual(measured.width)
		}
	)
})

describe('pane header at 320 px', () => {
	it('ends the GetClassificationsFromCamera method name left of the action buttons', async () => {
		state.data = visionData()
		const pane = paneFor({
			id: 'vision-1::get-classifications-from-camera',
			resource: vision,
			data: visionData,
		})
		render(InPaneFrame, { paneNode: pane, partID: PART_ID })
		await afterLayoutSettles()
		const { host, header } = renderedPaneParts()

		host.style.width = '320px'
		await afterLayoutSettles()

		const methodName = header.querySelector<HTMLElement>('h2 > span:last-child')
		const actions = header.querySelector<HTMLElement>('div.shrink-0')
		if (!methodName || !actions) throw new Error('No header method name or actions')
		expect(methodName.textContent).toContain('GetClassificationsFromCamera')
		expect(
			methodName.getBoundingClientRect().right,
			'the method name runs under the action buttons'
		).toBeLessThanOrEqual(actions.getBoundingClientRect().left)
	})
})
