import { ArmClient, ResourceName, SwitchClient } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import { ArmWidget, NotImplementedWidget, SwitchWidget } from '../components'
import {
	availableResourceWidgets,
	createResourceWidget,
	isKnownResource,
	showResourceWidget,
	widgetForResource,
} from '../resource-widget'

const resourceName = (namespace: string, type: string, subtype: string): ResourceName =>
	new ResourceName({ namespace, type, subtype, name: 'test' })

describe('createResourceWidget', () => {
	it('returns the full composite widget as `.Widget`', () => {
		expect(createResourceWidget(ArmClient).Widget).toBe(ArmWidget)
		expect(createResourceWidget(SwitchClient).Widget).toBe(SwitchWidget)
	})

	it('exposes query sub-widgets where a single API has a standalone view', () => {
		const Arm = createResourceWidget(ArmClient)
		expect(Arm.GetJointPositions).toBeDefined()
		expect(Arm.IsMoving).toBeDefined()
	})

	it('exposes only `.Widget` for resources whose APIs only make sense combined', () => {
		const Switch = createResourceWidget(SwitchClient)
		expect(Object.keys(Switch)).toEqual(['Widget'])
	})

	it('falls back to the not-implemented widget for unregistered clients', () => {
		class UnknownClient {}
		expect(createResourceWidget(UnknownClient).Widget).toBe(NotImplementedWidget)
	})
})

describe('availableResourceWidgets', () => {
	it('maps each resource triplet to its available widget names', () => {
		const available = availableResourceWidgets()
		expect(available['rdk:component:arm']).toEqual(['Widget', 'GetJointPositions', 'IsMoving'])
		expect(available['rdk:component:power_sensor']).toEqual([
			'Widget',
			'GetVoltage',
			'GetCurrent',
			'GetPower',
		])
		expect(available['rdk:component:switch']).toEqual(['Widget'])
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
