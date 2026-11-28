import { ResourceName } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import {
	Arm,
	AudioInput,
	AudioOutput,
	Base,
	Board,
	Button,
	Camera,
	Discovery,
	Encoder,
	Gantry,
	Gripper,
	InputController,
	MLModel,
	Motion,
	Motor,
	MovementSensor,
	PowerSensor,
	Sensor,
	Servo,
	Slam,
	Switch,
	Vision,
} from '../index.ts'
import { isKnownResource } from '../is-known-resource.ts'
import { ResourceTriplets } from '../resource-triplet.ts'
import { resourceWidgets, widgetsForResource } from '../resource-widgets.ts'
import { showResourceWidget } from '../show-resource-widget.ts'
import { HEIGHT_BAND_PX, WIDTH_CLASS_PX } from '../widget-size.ts'

const resourceName = (namespace: string, type: string, subtype: string): ResourceName =>
	new ResourceName({ namespace, type, subtype, name: 'test' })

interface ResourceCase {
	label: string
	namespace: Record<string, unknown>
	triplet: keyof typeof resourceWidgets
	keys: string[]
}

const RESOURCE_CASES: ResourceCase[] = [
	{
		label: 'Arm',
		namespace: Arm,
		triplet: ResourceTriplets.Arm,
		keys: [
			'jog',
			'joints',
			'moveToJointPositions',
			'moveToPosition',
			'getJointPositions',
			'getEndPosition',
			'isMoving',
			'manualMode',
			'setManualMode',
			'getManualMode',
			'getProperties',
			'stop',
		],
	},
	{
		label: 'AudioInput',
		namespace: AudioInput,
		triplet: ResourceTriplets.AudioInput,
		keys: ['getAudio', 'getProperties', 'listen'],
	},
	{
		label: 'AudioOutput',
		namespace: AudioOutput,
		triplet: ResourceTriplets.AudioOutput,
		keys: ['play', 'playStream', 'getProperties', 'holdToTalk', 'playFile'],
	},
	{
		label: 'Base',
		namespace: Base,
		triplet: ResourceTriplets.Base,
		keys: [
			'quickMove',
			'moveStraight',
			'spin',
			'setPower',
			'setVelocity',
			'isMoving',
			'stop',
			'getProperties',
		],
	},
	{
		label: 'Board',
		namespace: Board,
		triplet: ResourceTriplets.Board,
		keys: [
			'pins',
			'setGpio',
			'getGpio',
			'pwm',
			'setPwm',
			'pwmFrequency',
			'setPwmFrequency',
			'readAnalogReader',
			'writeAnalog',
			'getDigitalInterruptValue',
			'streamTicks',
			'setPowerMode',
			'pin',
			'analogReader',
			'digitalInterrupt',
			'powerMode',
		],
	},
	{ label: 'Button', namespace: Button, triplet: ResourceTriplets.Button, keys: ['push'] },
	{
		label: 'Camera',
		namespace: Camera,
		triplet: ResourceTriplets.Camera,
		keys: ['liveFeed', 'getImages', 'getPointCloud', 'getProperties'],
	},
	{
		label: 'Discovery',
		namespace: Discovery,
		triplet: ResourceTriplets.Discovery,
		keys: ['discoverResources', 'resourcePreview'],
	},
	{
		label: 'Encoder',
		namespace: Encoder,
		triplet: ResourceTriplets.Encoder,
		keys: ['getPosition', 'resetPosition', 'getProperties', 'zeroPosition'],
	},
	{
		label: 'Gantry',
		namespace: Gantry,
		triplet: ResourceTriplets.Gantry,
		keys: [
			'home',
			'moveToPosition',
			'quickMove',
			'getPosition',
			'isMoving',
			'getLengths',
			'stop',
			'homingStatus',
		],
	},
	{
		label: 'Gripper',
		namespace: Gripper,
		triplet: ResourceTriplets.Gripper,
		keys: [
			'openGrab',
			'status',
			'isHoldingSomething',
			'isMoving',
			'open',
			'grab',
			'stop',
			'getCurrentInputs',
			'goToInputs',
		],
	},
	{
		label: 'InputController',
		namespace: InputController,
		triplet: ResourceTriplets.InputController,
		keys: ['getEvents', 'triggerEvent', 'webGamepad'],
	},
	{
		label: 'MLModel',
		namespace: MLModel,
		triplet: ResourceTriplets.MLModel,
		keys: ['metadata', 'infer'],
	},
	{ label: 'Motion', namespace: Motion, triplet: ResourceTriplets.Motion, keys: ['move'] },
	{
		label: 'Motor',
		namespace: Motor,
		triplet: ResourceTriplets.Motor,
		keys: [
			'quickMove',
			'move',
			'setPower',
			'setRpm',
			'goFor',
			'goTo',
			'isMoving',
			'resetZeroPosition',
			'getPosition',
			'getProperties',
			'stop',
			'isPowered',
		],
	},
	{
		label: 'MovementSensor',
		namespace: MovementSensor,
		triplet: ResourceTriplets.MovementSensor,
		keys: [
			'getPosition',
			'getOrientation',
			'getCompassHeading',
			'getAccuracy',
			'getLinearVelocity',
			'getAngularVelocity',
			'getLinearAcceleration',
			'getProperties',
			'getReadings',
			'positionMap',
		],
	},
	{
		label: 'Navigation',
		namespace: {},
		triplet: ResourceTriplets.Navigation,
		keys: [],
	},
	{
		label: 'PowerSensor',
		namespace: PowerSensor,
		triplet: ResourceTriplets.PowerSensor,
		keys: [
			'getVoltage',
			'getCurrent',
			'getPower',
			'getBatteryPercent',
			'getReadings',
			'readingHistory',
		],
	},
	{ label: 'Sensor', namespace: Sensor, triplet: ResourceTriplets.Sensor, keys: ['getReadings'] },
	{
		label: 'Servo',
		namespace: Servo,
		triplet: ResourceTriplets.Servo,
		keys: ['move', 'quickMove', 'moveTo', 'isMoving', 'getPosition', 'stop'],
	},
	{
		label: 'Slam',
		namespace: Slam,
		triplet: ResourceTriplets.Slam,
		keys: [
			'map',
			'moveOnMap',
			'getPosition',
			'getPointCloudMap',
			'getProperties',
			'getInternalState',
		],
	},
	{
		label: 'Switch',
		namespace: Switch,
		triplet: ResourceTriplets.Switch,
		keys: ['setPosition', 'getPosition', 'getNumberOfPositions'],
	},
	{
		label: 'Vision',
		namespace: Vision,
		triplet: ResourceTriplets.Vision,
		keys: [
			'overlayFeed',
			'captureAllFromCamera',
			'getProperties',
			'getObjectPointClouds',
			'getDetectionsFromCamera',
			'getClassificationsFromCamera',
			'getDetections',
			'getClassifications',
		],
	},
]

const camelCase = (member: string): string => member.charAt(0).toLowerCase() + member.slice(1)

const CAMEL_CASE_KEY = /^[a-z][a-zA-Z0-9]*$/

const WIDTH_ORDER = [...Object.keys(WIDTH_CLASS_PX), 'fill']

interface LooseSize {
	width: { min: string; max: string }
	height: string
}

const sizeProblems = (name: string, size: LooseSize): string[] => {
	const problems: string[] = []
	const { min, max } = size.width
	if (!(min in WIDTH_CLASS_PX)) problems.push(`${name} width.min is ${min}`)
	if (!WIDTH_ORDER.includes(max)) problems.push(`${name} width.max is ${max}`)
	if (WIDTH_ORDER.indexOf(max) < WIDTH_ORDER.indexOf(min)) {
		problems.push(`${name} width.max ${max} is below width.min ${min}`)
	}
	if (!(size.height in HEIGHT_BAND_PX) && size.height !== 'xl') {
		problems.push(`${name} height is ${size.height}`)
	}
	return problems
}

describe('resourceWidgets', () => {
	it.each(RESOURCE_CASES)('lists exactly the $label widget keys, in order', ({ triplet, keys }) => {
		expect(Object.keys(resourceWidgets[triplet].widgets)).toEqual(keys)
	})

	it('has an entry for every resource in the table and no other', () => {
		expect(Object.keys(resourceWidgets).toSorted()).toEqual(
			RESOURCE_CASES.map(({ triplet }) => triplet).toSorted()
		)
	})

	it.each(RESOURCE_CASES)(
		'maps each $label namespace member to the camelCase key holding that component',
		({ namespace, triplet }) => {
			const widgets: Record<string, { component: unknown }> = resourceWidgets[triplet].widgets
			const expectedByKey = Object.fromEntries(
				Object.entries(namespace).map(([member, component]) => [camelCase(member), component])
			)

			expect(Object.keys(widgets).toSorted()).toEqual(Object.keys(expectedByKey).toSorted())
			const mismatches = Object.entries(widgets)
				.filter(([key, widget]) => widget.component !== expectedByKey[key])
				.map(([key]) => key)
			expect(mismatches).toEqual([])
		}
	)

	it('gives every widget a camelCase key, a known kind, and a valid size', () => {
		const problems = Object.entries(resourceWidgets).flatMap(([triplet, entry]) =>
			Object.entries(entry.widgets).flatMap(([key, widget]) => {
				const name = `${triplet} ${key}`
				const keyProblems = CAMEL_CASE_KEY.test(key) ? [] : [`${name} is not camelCase`]
				const kindProblems =
					widget.kind === 'api' || widget.kind === 'control'
						? []
						: [`${name} kind is ${widget.kind}`]
				return [...keyProblems, ...kindProblems, ...sizeProblems(name, widget.size)]
			})
		)

		expect(problems).toEqual([])
	})

	it.each([
		{ problem: 'a max below its min', width: { min: '2xl', max: 'xs' }, expected: 1 },
		{ problem: 'an unknown min class', width: { min: 'sm', max: 'fill' }, expected: 1 },
	])('flags $problem', ({ width, expected }) => {
		const size = { width, height: 'sm' }

		expect(sizeProblems('x', size)).toHaveLength(expected)
	})

	it('marks bespoke widgets as controls', () => {
		expect(resourceWidgets[ResourceTriplets.Motor].widgets.quickMove.kind).toBe('control')
		expect(resourceWidgets[ResourceTriplets.Switch].widgets.setPosition.kind).toBe('control')
	})
})

describe('widgetsForResource', () => {
	it('returns the entry for a registered resource', () => {
		const entry = widgetsForResource(resourceName('rdk', 'component', 'arm'))

		expect(entry).toBe(resourceWidgets[ResourceTriplets.Arm])
	})

	it('returns undefined for a recognized resource with no widgets', () => {
		expect(widgetsForResource(resourceName('rdk', 'service', 'shell'))).toBeUndefined()
	})

	it('returns undefined for an unrecognized resource', () => {
		expect(widgetsForResource(resourceName('acme', 'component', 'widget'))).toBeUndefined()
	})
})

describe('isKnownResource', () => {
	it('is true for any recognized resource, including ones without a widget', () => {
		expect(isKnownResource(resourceName('rdk', 'component', 'arm'))).toBe(true)
		expect(isKnownResource(resourceName('rdk', 'service', 'shell'))).toBe(true)
	})

	it('is false for unrecognized resources', () => {
		expect(isKnownResource(resourceName('acme', 'component', 'widget'))).toBe(false)
	})
})

describe('showResourceWidget', () => {
	it('shows recognized resources but hides rdk-internal and confusing services', () => {
		expect(showResourceWidget(resourceName('rdk', 'component', 'arm'))).toBe(true)
		expect(showResourceWidget(resourceName('rdk', 'service', 'motion'))).toBe(false)
		expect(showResourceWidget(resourceName('rdk', 'service', 'shell'))).toBe(false)
		expect(showResourceWidget(resourceName('rdk-internal', 'service', 'foo'))).toBe(false)
	})
})
