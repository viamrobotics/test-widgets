import { ResourceTriplets } from '#lib/resource-triplet.js'
import { describe, expect, it } from 'vitest'

import { resourceWidgetTitle } from '../resource-widget-title'

describe('resourceWidgetTitle', () => {
	it.each([
		[ResourceTriplets.Gripper, 'openGrab', 'Open / Grab'],
		[ResourceTriplets.Board, 'setGpio', 'SetGPIO'],
		[ResourceTriplets.Board, 'getGpio', 'GetGPIO'],
		[ResourceTriplets.Board, 'pwm', 'PWM'],
		[ResourceTriplets.Board, 'setPwm', 'SetPWM'],
		[ResourceTriplets.Board, 'pwmFrequency', 'PWMFrequency'],
		[ResourceTriplets.Board, 'setPwmFrequency', 'SetPWMFrequency'],
		[ResourceTriplets.Motor, 'setRpm', 'SetRPM'],
	])('labels %s %s as %s', (api, key, title) => {
		expect(resourceWidgetTitle(api, key)).toBe(title)
	})

	it('writes a plain key in PascalCase', () => {
		expect(resourceWidgetTitle(ResourceTriplets.Arm, 'moveToJointPositions')).toBe(
			'MoveToJointPositions'
		)
	})

	it('does not relabel a listed key on another resource', () => {
		expect(resourceWidgetTitle(ResourceTriplets.Arm, 'setRpm')).toBe('SetRpm')
	})
})
