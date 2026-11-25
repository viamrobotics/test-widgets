import { ResourceTriplets } from '$lib/resource-triplet'

const labelId = (api: string, key: string) => `${api}/${key}`

/**
 * A host's own labels, as an example of what a host does with a key. Keyed by triplet and key, so a
 * key shared across resources is relabeled only where it is listed.
 */
const CUSTOM_LABELS: ReadonlyMap<string, string> = new Map([
	[labelId(ResourceTriplets.Gripper, 'openGrab'), 'Open / Grab'],
	[labelId(ResourceTriplets.Board, 'setGpio'), 'SetGPIO'],
	[labelId(ResourceTriplets.Board, 'getGpio'), 'GetGPIO'],
	[labelId(ResourceTriplets.Board, 'pwm'), 'PWM'],
	[labelId(ResourceTriplets.Board, 'setPwm'), 'SetPWM'],
	[labelId(ResourceTriplets.Board, 'pwmFrequency'), 'PWMFrequency'],
	[labelId(ResourceTriplets.Board, 'setPwmFrequency'), 'SetPWMFrequency'],
	[labelId(ResourceTriplets.Motor, 'setRpm'), 'SetRPM'],
])

const pascalCase = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1)

/**
 * A widget's title from its key: the key in PascalCase, unless the host labels it itself.
 *
 * @example
 * resourceWidgetTitle(ResourceTriplets.Motor, 'setRpm') // 'SetRPM'
 * resourceWidgetTitle(ResourceTriplets.Arm, 'moveToJointPositions') // 'MoveToJointPositions'
 */
export const resourceWidgetTitle = (api: string, key: string): string =>
	CUSTOM_LABELS.get(labelId(api, key)) ?? pascalCase(key)
