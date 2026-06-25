import { ArmClient, SwitchClient } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import { ArmWidget, NotImplementedWidget, SwitchWidget } from '../components'
import { availableResourceWidgets, createResourceWidget } from '../resource-widget'

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
