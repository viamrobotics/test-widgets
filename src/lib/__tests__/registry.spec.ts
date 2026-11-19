import { ResourceName } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import {
	ArmWidget,
	GripperGrabWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperOpenGrabWidget,
	GripperOpenWidget,
	GripperStopWidget,
	MotionServiceWidget,
} from '../components'
import { isKnownResource } from '../is-known-resource'
import { apiWidgetsForResource, availableAPIWidgets, widgetForResource } from '../registry'
import { showResourceWidget } from '../show-resource-widget'

const resourceName = (namespace: string, type: string, subtype: string): ResourceName =>
	new ResourceName({ namespace, type, subtype, name: 'test' })

describe('availableAPIWidgets', () => {
	it('maps each resource with a card to its API widgets', () => {
		expect(availableAPIWidgets()['rdk:component:gripper']).toEqual([
			{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenGrabWidget] },
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				widgets: [GripperIsHoldingSomethingWidget],
			},
			{ id: 'is-moving', label: 'IsMoving', widgets: [GripperIsMovingWidget] },
			{ id: 'open', label: 'Open', widgets: [GripperOpenWidget] },
			{ id: 'grab', label: 'Grab', widgets: [GripperGrabWidget] },
			{ id: 'stop', label: 'Stop', widgets: [GripperStopWidget] },
		])
	})

	it('folds the query views in alongside the action views', () => {
		const armIds = availableAPIWidgets()['rdk:component:arm']?.map((widget) => widget.id) ?? []
		expect(armIds).toContain('move-to-joint-positions')
		expect(armIds).toContain('get-joint-positions')
	})

	it('maps a resource with a card but no API widgets to an empty list', () => {
		expect(availableAPIWidgets()['rdk:component:board']).toEqual([])
	})

	it('registers the motion service as widget-only (no standalone API widgets)', () => {
		expect(availableAPIWidgets()['rdk:service:motion']).toEqual([])
	})

	it('lists Metadata as the one ML model service API widget', () => {
		const mlModelIds = availableAPIWidgets()['rdk:service:mlmodel']?.map((widget) => widget.id)

		expect(mlModelIds).toEqual(['metadata'])
	})

	it('excludes resources that have no test card', () => {
		expect(availableAPIWidgets()).not.toHaveProperty('rdk:service:shell')
	})
})

describe('apiWidgetsForResource', () => {
	it("returns the targeted resource's API widgets", () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'gripper')).map((widget) => widget.id)
		).toEqual(['open-grab', 'is-holding-something', 'is-moving', 'open', 'grab', 'stop'])
	})

	it('keeps the base ids the app persists, with stop added last', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'base')).map((widget) => widget.id)
		).toEqual([
			'quick-move',
			'move-straight',
			'spin',
			'set-power',
			'set-velocity',
			'is-moving',
			'stop',
		])
	})

	it('returns an empty list for a recognized resource with no API widgets', () => {
		expect(apiWidgetsForResource(resourceName('rdk', 'component', 'board'))).toEqual([])
	})

	it('keeps the servo ids the app persists, with get-position and stop added last', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'servo')).map((widget) => widget.id)
		).toEqual(['move', 'quick-move', 'is-moving', 'get-position', 'stop'])
	})

	it('returns an empty list for the widget-only motion service', () => {
		expect(apiWidgetsForResource(resourceName('rdk', 'service', 'motion'))).toEqual([])
	})

	it('keeps the arm ids the app persists, with quick move removed and stop last', () => {
		expect(
			apiWidgetsForResource(resourceName('rdk', 'component', 'arm')).map((widget) => widget.id)
		).toEqual([
			'move-to-joint-positions',
			'move-to-position',
			'get-joint-positions',
			'is-moving',
			'manual-mode',
			'stop',
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
