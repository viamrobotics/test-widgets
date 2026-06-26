import { ResourceName } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import {
	ArmWidget,
	GripperGrabWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperOpenWidget,
} from '../components'
import {
	isKnownResource,
	resourceApiWidgets,
	showResourceWidget,
	widgetForResource,
} from '../resource-widget'

const resourceName = (namespace: string, type: string, subtype: string): ResourceName =>
	new ResourceName({ namespace, type, subtype, name: 'test' })

describe('availableResourceWidgets', () => {
	it('maps a resource to its pinnable options with stable id, label, and components', () => {
		expect(resourceApiWidgets()['rdk:component:gripper']).toEqual([
			{ id: 'open-grab', label: 'Open / Grab', components: [GripperOpenWidget, GripperGrabWidget] },
			{
				id: 'is-holding-something',
				label: 'IsHoldingSomething',
				components: [GripperIsHoldingSomethingWidget],
			},
			{ id: 'is-moving', label: 'IsMoving', components: [GripperIsMovingWidget] },
		])
	})

	it('folds the query views in alongside the action views', () => {
		const armIds = resourceApiWidgets()['rdk:component:arm'].map((option) => option.id)
		expect(armIds).toContain('move-to-joint-positions')
		expect(armIds).toContain('get-joint-positions')
	})

	it('returns an empty list for resources with a card but no pinnable options', () => {
		expect(resourceApiWidgets()['rdk:component:camera']).toEqual([])
	})

	it('excludes resources that have no test card', () => {
		expect(resourceApiWidgets()).not.toHaveProperty('rdk:service:motion')
	})
})

describe('widgetForResource', () => {
	it('returns the composite widget for a resource that has one', () => {
		expect(widgetForResource(resourceName('rdk', 'component', 'arm'))).toBe(ArmWidget)
	})

	it('returns undefined for a recognized resource without a widget', () => {
		expect(widgetForResource(resourceName('rdk', 'service', 'motion'))).toBeUndefined()
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
		expect(showResourceWidget(resourceName('rdk', 'service', 'motion'))).toBe(false)
		expect(showResourceWidget(resourceName('rdk-internal', 'service', 'foo'))).toBe(false)
	})
})
