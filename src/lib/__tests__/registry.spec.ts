import { ResourceName } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import {
	ArmWidget,
	GripperControls,
	GripperGetCurrentInputsWidget,
	GripperGoToInputsWidget,
	GripperGrabWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperOpenGrabControl,
	GripperOpenWidget,
	GripperStopWidget,
	MotionServiceWidget,
} from '../components'
import { isKnownResource } from '../is-known-resource'
import {
	apiWidgetsForResource,
	availableAPIWidgets,
	type ResourceWidgetSize,
	widgetForResource,
	widgetSizeForResource,
} from '../registry'
import { ResourceTriplets } from '../resource-triplet'
import { showResourceWidget } from '../show-resource-widget'

const resourceName = (namespace: string, type: string, subtype: string): ResourceName =>
	new ResourceName({ namespace, type, subtype, name: 'test' })

describe('availableAPIWidgets', () => {
	it('maps each resource with a card to its API widgets', () => {
		expect(availableAPIWidgets()['rdk:component:gripper']).toEqual([
			{
				id: 'controls',
				label: 'Controls',
				kind: 'control',
				widgets: [GripperControls],
				size: { minWidth: 230, minHeight: 156, recommendedWidths: [241], maxWidth: 336 },
			},
			{
				id: 'open-grab',
				label: 'Open / Grab',
				kind: 'control',
				widgets: [GripperOpenGrabControl],
				size: { minWidth: 136, minHeight: 110, recommendedWidths: [205], maxWidth: 205 },
			},
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				kind: 'api',
				widgets: [GripperIsHoldingSomethingWidget],
				size: { minWidth: 194, minHeight: 97, recommendedWidths: [320], maxWidth: 320 },
			},
			{
				id: 'is-moving',
				label: 'IsMoving',
				kind: 'api',
				widgets: [GripperIsMovingWidget],
				size: { minWidth: 96, minHeight: 97, recommendedWidths: [253], maxWidth: 253 },
			},
			{
				id: 'open',
				label: 'Open',
				kind: 'api',
				widgets: [GripperOpenWidget],
				size: { minWidth: 81, minHeight: 94, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'grab',
				label: 'Grab',
				kind: 'api',
				widgets: [GripperGrabWidget],
				size: { minWidth: 115, minHeight: 140, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'stop',
				label: 'Stop',
				kind: 'api',
				widgets: [GripperStopWidget],
				size: { minWidth: 92, minHeight: 102, recommendedWidths: [227], maxWidth: 227 },
			},
			{
				id: 'get-current-inputs',
				label: 'GetCurrentInputs',
				kind: 'api',
				widgets: [GripperGetCurrentInputsWidget],
				size: { minWidth: 150, minHeight: 172, recommendedWidths: [306], maxWidth: 306 },
			},
			{
				id: 'go-to-inputs',
				label: 'GoToInputs',
				kind: 'api',
				widgets: [GripperGoToInputsWidget],
				size: { minWidth: 219, minHeight: 190, recommendedWidths: [219], maxWidth: 336 },
			},
		])
	})

	it('folds the query views in alongside the action views', () => {
		const armIds = availableAPIWidgets()['rdk:component:arm']?.map((widget) => widget.id) ?? []
		expect(armIds).toContain('move-to-joint-positions')
		expect(armIds).toContain('get-joint-positions')
	})

	it('registers the switch api widgets in method order', () => {
		const switchIds = availableAPIWidgets()['rdk:component:switch']?.map((widget) => widget.id)
		expect(switchIds).toEqual([
			'controls',
			'set-position',
			'get-position',
			'get-number-of-positions',
		])
	})

	it('maps a resource with a card but no API widgets to an empty list', () => {
		expect(availableAPIWidgets()['rdk:component:button']).toEqual([])
	})

	it('registers the motion service as widget-only (no standalone API widgets)', () => {
		expect(availableAPIWidgets()['rdk:service:motion']).toEqual([])
	})

	it('lists Metadata then Infer as the ML model service API widgets', () => {
		const mlModelIds = availableAPIWidgets()['rdk:service:mlmodel']?.map((widget) => widget.id)

		expect(mlModelIds).toEqual(['metadata', 'infer'])
	})

	it('excludes resources that have no test card', () => {
		expect(availableAPIWidgets()).not.toHaveProperty('rdk:service:shell')
	})

	it('marks the control interfaces and the control-style entries as controls', () => {
		const controls = Object.entries(availableAPIWidgets()).flatMap(([api, entries]) =>
			entries.filter((entry) => entry.kind === 'control').map((entry) => `${api}::${entry.id}`)
		)

		expect(controls.toSorted()).toEqual([
			'rdk:component:arm::controls',
			'rdk:component:arm::jog',
			'rdk:component:arm::joints',
			'rdk:component:arm::manual-mode',
			'rdk:component:audio_in::controls',
			'rdk:component:audio_out::controls',
			'rdk:component:base::controls',
			'rdk:component:base::quick-move',
			'rdk:component:board::controls',
			'rdk:component:board::pins',
			'rdk:component:camera::controls',
			'rdk:component:encoder::controls',
			'rdk:component:gantry::controls',
			'rdk:component:gantry::quick-move',
			'rdk:component:gripper::controls',
			'rdk:component:gripper::open-grab',
			'rdk:component:motor::controls',
			'rdk:component:motor::move',
			'rdk:component:motor::quick-move',
			'rdk:component:movement_sensor::controls',
			'rdk:component:power_sensor::controls',
			'rdk:component:servo::controls',
			'rdk:component:servo::move-to',
			'rdk:component:servo::quick-move',
			'rdk:component:switch::controls',
			'rdk:service:discovery::controls',
			'rdk:service:navigation::controls',
			'rdk:service:slam::controls',
			'rdk:service:vision::controls',
		])
	})
})

describe('apiWidgetsForResource', () => {
	it("returns the targeted resource's API widgets", () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'gripper')).map((widget) => widget.id)
		).toEqual([
			'controls',
			'open-grab',
			'is-holding-something',
			'is-moving',
			'open',
			'grab',
			'stop',
			'get-current-inputs',
			'go-to-inputs',
		])
	})

	it("lists the input controller's API widgets in order", () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'input_controller')).map(
				(widget) => widget.id
			)
		).toEqual(['get-events', 'trigger-event'])
	})

	it('keeps the base ids the app persists, with stop and get-properties added last', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'base')).map((widget) => widget.id)
		).toEqual([
			'controls',
			'quick-move',
			'move-straight',
			'spin',
			'set-power',
			'set-velocity',
			'is-moving',
			'stop',
			'get-properties',
		])
	})

	it('returns an empty list for a recognized resource with no API widgets', () => {
		expect(apiWidgetsForResource(resourceName('rdk', 'component', 'button'))).toEqual([])
	})

	it('lists the board API widgets in the Board-Frames order', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'board')).map((widget) => widget.id)
		).toEqual([
			'controls',
			'pins',
			'set-gpio',
			'get-gpio',
			'pwm',
			'set-pwm',
			'pwm-frequency',
			'set-pwm-frequency',
			'read-analog-reader',
			'write-analog',
			'get-digital-interrupt-value',
			'stream-ticks',
			'set-power-mode',
		])
	})

	it('keeps the servo ids the app persists, with get-position and stop added last', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'servo')).map((widget) => widget.id)
		).toEqual(['controls', 'move', 'quick-move', 'move-to', 'is-moving', 'get-position', 'stop'])
	})

	it('returns an empty list for the widget-only motion service', () => {
		expect(apiWidgetsForResource(resourceName('rdk', 'service', 'motion'))).toEqual([])
	})

	it('keeps the arm ids the app persists, with the control interfaces first, quick move removed, and stop last', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'arm')).map((widget) => widget.id)
		).toEqual([
			'controls',
			'jog',
			'joints',
			'move-to-joint-positions',
			'move-to-position',
			'get-joint-positions',
			'get-end-position',
			'is-moving',
			'manual-mode',
			'set-manual-mode',
			'get-manual-mode',
			'get-properties',
			'stop',
		])
	})

	it('keeps the motor ids the app persists, with the method widgets after is-moving', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'motor')).map((widget) => widget.id)
		).toEqual([
			'controls',
			'quick-move',
			'move',
			'set-power',
			'set-rpm',
			'go-for',
			'go-to',
			'is-moving',
			'reset-zero-position',
			'get-position',
			'get-properties',
			'stop',
			'is-powered',
		])
	})

	it('returns an empty list for an unrecognized resource', () => {
		expect(apiWidgetsForResource(resourceName('acme', 'component', 'widget'))).toEqual([])
	})
})

describe('widgetForResource', () => {
	it('returns the composite widget for a resource that has one', () => {
		expect(widgetForResource(resourceName('rdk', 'component', 'arm'))).toBe(ArmWidget)
	})

	it('returns the composite widget for the motion service', () => {
		expect(widgetForResource(resourceName('rdk', 'service', 'motion'))).toBe(MotionServiceWidget)
	})

	it('returns undefined for a recognized resource without a widget', () => {
		expect(widgetForResource(resourceName('rdk', 'service', 'shell'))).toBeUndefined()
	})
})

const resourceNameForTriplet = (triplet: string): ResourceName => {
	const [namespace = '', type = '', subtype = ''] = triplet.split(':')
	return resourceName(namespace, type, subtype)
}

const sizeProblems = (name: string, size: ResourceWidgetSize | undefined): string[] => {
	if (!size) return [`${name} has no size`]
	const { minWidth, minHeight, recommendedWidths, maxWidth } = size
	const lastRecommended = recommendedWidths.at(-1)
	const problems: string[] = []
	const numbers: [string, number][] = [
		['minWidth', minWidth],
		['minHeight', minHeight],
		['maxWidth', maxWidth],
		...recommendedWidths.map((width, index): [string, number] => [
			`recommendedWidths[${String(index)}]`,
			width,
		]),
	]
	for (const [field, value] of numbers) {
		if (value <= 0) problems.push(`${name} ${field} is ${String(value)}`)
	}
	if (lastRecommended === undefined) return [...problems, `${name} recommends no width`]
	if (
		recommendedWidths.some(
			(width, index) => index > 0 && width <= (recommendedWidths[index - 1] ?? 0)
		)
	) {
		problems.push(`${name} recommends ${recommendedWidths.join(', ')}, not strictly ascending`)
	}
	if ((recommendedWidths[0] ?? 0) < minWidth) {
		problems.push(
			`${name} recommends ${String(recommendedWidths[0])}, under its minWidth ${String(minWidth)}`
		)
	}
	if (maxWidth < lastRecommended) {
		problems.push(
			`${name} caps at ${String(maxWidth)}, under its widest recommended ${String(lastRecommended)}`
		)
	}
	return problems
}

const VALID_SIZE: ResourceWidgetSize = {
	minWidth: 100,
	minHeight: 50,
	recommendedWidths: [100, 200],
	maxWidth: 300,
}

describe('widget sizes', () => {
	it('gives every composite and API entry a size that holds the size invariants', () => {
		const problems = Object.entries(availableAPIWidgets()).flatMap(([triplet, apis]) => [
			...sizeProblems(
				`${triplet} composite`,
				widgetSizeForResource(resourceNameForTriplet(triplet))
			),
			...(apis ?? []).flatMap((api) => sizeProblems(`${triplet} ${api.id}`, api.size)),
		])

		expect(problems).toEqual([])
	})

	it('gives arm controls the pop-out size of the 3D scene and no other entry one', () => {
		const withPopOut = Object.entries(availableAPIWidgets()).flatMap(([triplet, apis]) =>
			(apis ?? []).filter((api) => api.popOutSize).map((api) => `${triplet} ${api.id}`)
		)
		const armControls = availableAPIWidgets()[ResourceTriplets.Arm]?.find(
			(api) => api.id === 'controls'
		)

		expect(armControls?.popOutSize).toEqual({ minWidth: 672, minHeight: 504 })
		expect(withPopOut).toEqual([`${ResourceTriplets.Arm} controls`])
	})

	it.each([
		{ problem: 'a missing size', size: undefined, expected: ['x has no size'] },
		{
			problem: 'a zero minHeight',
			size: { ...VALID_SIZE, minHeight: 0 },
			expected: ['x minHeight is 0'],
		},
		{
			problem: 'a negative recommended width',
			size: { ...VALID_SIZE, minWidth: -10, recommendedWidths: [-10, 200] },
			expected: ['x minWidth is -10', 'x recommendedWidths[0] is -10'],
		},
		{
			problem: 'an empty recommended list',
			size: { ...VALID_SIZE, recommendedWidths: [] },
			expected: ['x recommends no width'],
		},
		{
			problem: 'an unsorted recommended list',
			size: { ...VALID_SIZE, recommendedWidths: [200, 100] },
			expected: ['x recommends 200, 100, not strictly ascending'],
		},
		{
			problem: 'a recommended width under minWidth',
			size: { ...VALID_SIZE, minWidth: 150 },
			expected: ['x recommends 100, under its minWidth 150'],
		},
		{
			problem: 'a maxWidth under the widest recommended width',
			size: { ...VALID_SIZE, maxWidth: 150 },
			expected: ['x caps at 150, under its widest recommended 200'],
		},
	])('flags $problem', ({ size, expected }) => {
		expect(sizeProblems('x', size)).toEqual(expected)
	})

	it('passes a size that holds every invariant', () => {
		expect(sizeProblems('x', VALID_SIZE)).toEqual([])
	})
})

describe('widgetSizeForResource', () => {
	it("returns the composite card's size", () => {
		expect(widgetSizeForResource(resourceName('rdk', 'component', 'servo'))).toEqual({
			minWidth: 169,
			minHeight: 555,
			recommendedWidths: [320, 672],
			maxWidth: 688,
		})
	})

	it('returns undefined for a recognized resource without a widget', () => {
		expect(widgetSizeForResource(resourceName('rdk', 'service', 'shell'))).toBeUndefined()
	})
})

describe('isKnownResource', () => {
	// The control view gates generic Do Command / Get Status sections on this, so it
	// must stay true for recognized resources even when they have no test widget.
	it('is true for any recognized resource, including ones without a widget', () => {
		expect(isKnownResource(resourceName('rdk', 'component', 'arm'))).toBe(true)
		expect(isKnownResource(resourceName('rdk', 'service', 'motion'))).toBe(true)
	})

	it('is false for unrecognized resources', () => {
		expect(isKnownResource(resourceName('acme', 'component', 'widget'))).toBe(false)
	})
})

describe('showResourceWidget', () => {
	it('shows recognized resources but hides rdk-internal and confusing services', () => {
		expect(showResourceWidget(resourceName('rdk', 'component', 'arm'))).toBe(true)
		// Motion has a widget but is hidden from the control view for now to avoid
		// surprising downstream users; it is still available via the registry/exports.
		expect(showResourceWidget(resourceName('rdk', 'service', 'motion'))).toBe(false)
		expect(showResourceWidget(resourceName('rdk', 'service', 'shell'))).toBe(false)
		expect(showResourceWidget(resourceName('rdk-internal', 'service', 'foo'))).toBe(false)
	})
})
