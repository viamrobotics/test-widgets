import { render } from '@testing-library/svelte'
import { Detection, EncoderPositionType, navigationApi, slamApi } from '@viamrobotics/sdk'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResourceWidgetDefinition, ResourceWidgetsEntry } from '../resource-widget-types.ts'

import { ResourceTriplets } from '../resource-triplet.ts'
import { resourceWidgets } from '../resource-widgets.ts'
import { HEIGHT_BAND_PX, type HeightBand, WIDTH_CLASS_PX } from '../widget-size.ts'
import ClassFloorFrame from './__fixtures__/class-floor-frame.svelte'

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
const SETTLE_FRAMES = 20

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

const slamIdleData = () => ({ getProperties: SLAM_PROPERTIES, getPosition: SLAM_POSITION })

const AUDIO_INPUT_DATA = {
	getProperties: { numChannels: 2, sampleRateHz: 48_000, supportedCodecs: ['pcm16', 'mp3'] },
}

const AUDIO_OUTPUT_DATA = {
	getProperties: { numChannels: 2, sampleRateHz: 48_000, supportedCodecs: ['pcm16', 'mp3'] },
}

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

interface ResourceFixture {
	resourceName: string
	data: () => Record<string, unknown>
}

const RESOURCE_FIXTURES: Record<string, ResourceFixture> = {
	[ResourceTriplets.Arm]: { resourceName: 'arm-1', data: () => ARM_DATA },
	[ResourceTriplets.AudioInput]: { resourceName: 'audio-input-1', data: () => AUDIO_INPUT_DATA },
	[ResourceTriplets.AudioOutput]: { resourceName: 'audio-output-1', data: () => AUDIO_OUTPUT_DATA },
	[ResourceTriplets.Base]: { resourceName: 'base-1', data: () => BASE_DATA },
	[ResourceTriplets.Board]: { resourceName: 'board-1', data: () => ({}) },
	[ResourceTriplets.Button]: { resourceName: 'button-1', data: () => ({}) },
	[ResourceTriplets.Camera]: { resourceName: 'camera-1', data: cameraData },
	[ResourceTriplets.Discovery]: { resourceName: 'discovery-1', data: () => ({}) },
	[ResourceTriplets.Encoder]: { resourceName: 'encoder-1', data: () => ENCODER_DATA },
	[ResourceTriplets.Gantry]: { resourceName: 'gantry-1', data: () => GANTRY_DATA },
	[ResourceTriplets.Gripper]: { resourceName: 'gripper-1', data: () => GRIPPER_DATA },
	[ResourceTriplets.InputController]: {
		resourceName: 'input-controller-1',
		data: () => INPUT_CONTROLLER_DATA,
	},
	[ResourceTriplets.MLModel]: { resourceName: 'ml-model-1', data: () => ML_MODEL_DATA },
	[ResourceTriplets.Motion]: { resourceName: 'motion-1', data: () => MOTION_DATA },
	[ResourceTriplets.Motor]: { resourceName: 'motor-1', data: () => MOTOR_DATA },
	[ResourceTriplets.MovementSensor]: {
		resourceName: 'movement-sensor-1',
		data: () => MOVEMENT_SENSOR_DATA,
	},
	[ResourceTriplets.Navigation]: { resourceName: 'navigation-1', data: () => NAVIGATION_DATA },
	[ResourceTriplets.PowerSensor]: { resourceName: 'power-sensor-1', data: () => POWER_SENSOR_DATA },
	[ResourceTriplets.Sensor]: { resourceName: 'sensor-1', data: () => SENSOR_DATA },
	[ResourceTriplets.Servo]: { resourceName: 'servo-1', data: () => SERVO_DATA },
	[ResourceTriplets.Slam]: { resourceName: 'slam-1', data: slamData },
	[ResourceTriplets.Switch]: { resourceName: 'switch-1', data: () => SWITCH_DATA },
	[ResourceTriplets.Vision]: { resourceName: 'vision-1', data: visionData },
}

const WIDGET_DATA_OVERRIDES: Record<string, () => Record<string, unknown>> = {
	[`${ResourceTriplets.Arm}.jog`]: () => ARM_CONTROLS_DATA,
	[`${ResourceTriplets.Arm}.joints`]: () => ARM_CONTROLS_DATA,
	[`${ResourceTriplets.Motor}.quickMove`]: () => ({
		...MOTOR_DATA,
		getProperties: { positionReporting: false },
	}),
	[`${ResourceTriplets.Camera}.getImages`]: cameraIdleData,
	[`${ResourceTriplets.Camera}.getPointCloud`]: cameraIdleData,
	[`${ResourceTriplets.Vision}.captureAllFromCamera`]: visionIdleData,
	[`${ResourceTriplets.Vision}.getObjectPointClouds`]: visionIdleData,
	[`${ResourceTriplets.Slam}.getPointCloudMap`]: slamIdleData,
	[`${ResourceTriplets.Slam}.getInternalState`]: slamIdleData,
}

interface ClassFloorCase {
	triplet: string
	key: string
	definition: ResourceWidgetDefinition
}

const resourceEntries: [string, ResourceWidgetsEntry][] = Object.entries(resourceWidgets)

const CLASS_FLOOR_CASES: ClassFloorCase[] = resourceEntries.flatMap(([triplet, entry]) =>
	Object.entries(entry.widgets).map(([key, definition]) => ({ triplet, key, definition }))
)

const HEIGHT_BAND_BOUNDS_PX = {
	sm: { above: 0, atMost: HEIGHT_BAND_PX.sm },
	md: { above: HEIGHT_BAND_PX.sm, atMost: HEIGHT_BAND_PX.md },
	lg: { above: HEIGHT_BAND_PX.md, atMost: HEIGHT_BAND_PX.lg },
	xl: { above: HEIGHT_BAND_PX.lg, atMost: Number.POSITIVE_INFINITY },
} as const satisfies Record<HeightBand, { above: number; atMost: number }>

const fixtureFor = (triplet: string): ResourceFixture => {
	const fixture = RESOURCE_FIXTURES[triplet]
	if (!fixture) throw new Error(`No resource fixture for ${triplet}`)
	return fixture
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

describe('resourceWidgets sizes at the class floor', () => {
	beforeAll(async () => {
		frames.jpeg = await encodeFrame('image/jpeg')
		frames.png = await encodeFrame('image/png')
	})

	beforeEach(() => {
		localStorage.clear()
	})

	it.each(CLASS_FLOOR_CASES)(
		'renders $triplet $key inside its width class and height band',
		async ({ triplet, key, definition }) => {
			const { resourceName, data } = fixtureFor(triplet)
			state.data = (WIDGET_DATA_OVERRIDES[`${triplet}.${key}`] ?? data)()
			const { size } = definition
			const floorPx = WIDTH_CLASS_PX[size.width.min]

			const { getByTestId } = render(ClassFloorFrame, {
				component: definition.component,
				partID: PART_ID,
				resourceName,
				width: floorPx,
			})
			await afterLayoutSettles()

			const box = getByTestId('class-floor-box')
			const { scrollWidth, clientWidth } = box
			const height = Math.ceil(box.getBoundingClientRect().height)
			const bounds = HEIGHT_BAND_BOUNDS_PX[size.height]
			const measurementMessage = `${triplet} ${key} at its ${size.width.min} floor of ${String(floorPx)} px is ${String(scrollWidth)} px wide in a ${String(clientWidth)} px box and ${String(height)} px tall, listed as height ${size.height}`

			expect(scrollWidth, measurementMessage).toBeLessThanOrEqual(clientWidth)
			expect(height, measurementMessage).toBeGreaterThan(bounds.above)
			expect(height, measurementMessage).toBeLessThanOrEqual(bounds.atMost)
		}
	)
})
