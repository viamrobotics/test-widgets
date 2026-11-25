import { ResourceName } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import { Arm, Base, Gantry, Motion, Motor, Servo } from '../index.ts'
import { isKnownResource } from '../is-known-resource.ts'
import { ResourceTriplets } from '../resource-triplet.ts'
import { resourceWidgets, widgetsForResource } from '../resource-widgets.ts'
import { showResourceWidget } from '../show-resource-widget.ts'

const resourceName = (namespace: string, type: string, subtype: string): ResourceName =>
	new ResourceName({ namespace, type, subtype, name: 'test' })

interface ResourceCase {
	label: string
	namespace?: Record<string, unknown>
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
	{ label: 'AudioInput', triplet: ResourceTriplets.AudioInput, keys: ['getProperties'] },
	{ label: 'AudioOutput', triplet: ResourceTriplets.AudioOutput, keys: ['getProperties'] },
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
	{ label: 'Board', triplet: ResourceTriplets.Board, keys: [] },
	{ label: 'Button', triplet: ResourceTriplets.Button, keys: [] },
	{ label: 'Camera', triplet: ResourceTriplets.Camera, keys: [] },
	{ label: 'Discovery', triplet: ResourceTriplets.Discovery, keys: [] },
	{ label: 'Encoder', triplet: ResourceTriplets.Encoder, keys: ['getPosition'] },
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
		triplet: ResourceTriplets.Gripper,
		keys: ['openGrab', 'isHoldingSomething', 'isMoving', 'open', 'grab', 'stop'],
	},
	{ label: 'InputController', triplet: ResourceTriplets.InputController, keys: [] },
	{ label: 'MLModel', triplet: ResourceTriplets.MLModel, keys: ['metadata'] },
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
		triplet: ResourceTriplets.MovementSensor,
		keys: ['getPosition', 'getOrientation', 'getCompassHeading', 'getAccuracy'],
	},
	{ label: 'Navigation', triplet: ResourceTriplets.Navigation, keys: [] },
	{
		label: 'PowerSensor',
		triplet: ResourceTriplets.PowerSensor,
		keys: ['getVoltage', 'getCurrent', 'getPower'],
	},
	{ label: 'Sensor', triplet: ResourceTriplets.Sensor, keys: [] },
	{
		label: 'Servo',
		namespace: Servo,
		triplet: ResourceTriplets.Servo,
		keys: ['move', 'quickMove', 'moveTo', 'isMoving', 'getPosition', 'stop'],
	},
	{ label: 'Slam', triplet: ResourceTriplets.Slam, keys: ['getPosition'] },
	{ label: 'Switch', triplet: ResourceTriplets.Switch, keys: [] },
	{ label: 'Vision', triplet: ResourceTriplets.Vision, keys: [] },
]

const camelCase = (member: string): string => member.charAt(0).toLowerCase() + member.slice(1)

const CAMEL_CASE_KEY = /^[a-z][a-zA-Z0-9]*$/

const NAMESPACE_CASES = RESOURCE_CASES.flatMap(({ label, namespace, triplet }) =>
	namespace ? [{ label, namespace, triplet }] : []
)

describe('resourceWidgets', () => {
	it.each(RESOURCE_CASES)('lists exactly the $label widget keys, in order', ({ triplet, keys }) => {
		expect(Object.keys(resourceWidgets[triplet].widgets)).toEqual(keys)
	})

	it('has an entry for every resource in the table and no other', () => {
		expect(Object.keys(resourceWidgets).toSorted()).toEqual(
			RESOURCE_CASES.map(({ triplet }) => triplet).toSorted()
		)
	})

	it.each(NAMESPACE_CASES)(
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

	it('gives every widget a camelCase key and a known kind', () => {
		const problems = Object.entries(resourceWidgets).flatMap(([triplet, entry]) =>
			Object.entries(entry.widgets).flatMap(([key, widget]) => {
				const name = `${triplet} ${key}`
				const keyProblems = CAMEL_CASE_KEY.test(key) ? [] : [`${name} is not camelCase`]
				const kindProblems =
					widget.kind === 'api' || widget.kind === 'control'
						? []
						: [`${name} kind is ${widget.kind}`]
				return [...keyProblems, ...kindProblems]
			})
		)

		expect(problems).toEqual([])
	})

	it('marks bespoke widgets as controls', () => {
		expect(resourceWidgets[ResourceTriplets.Motor].widgets.quickMove.kind).toBe('control')
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
