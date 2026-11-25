import type { ResourceName } from '@viamrobotics/sdk'

import type { ResourceWidgetsEntry } from '$lib/resource-widget-types'

import Stub from './stub-widget.svelte'

const MOTOR_KEYS = ['quickMove', 'setPower', 'setRpm', 'goFor', 'goTo', 'isMoving']

const entry = (keys: string[], controls: string[]): ResourceWidgetsEntry => ({
	widgets: Object.fromEntries(
		keys.map((key) => [
			key,
			{
				component: Stub,
				kind: controls.includes(key) ? 'control' : 'api',
				size: { width: { min: 'xs', max: 'fill' }, height: 'sm' },
			},
		])
	),
})

const ENTRIES: Record<string, ResourceWidgetsEntry> = {
	motor: entry(MOTOR_KEYS, ['quickMove']),
	arm: entry(['jog', 'moveToPosition', 'getEndPosition'], ['jog']),
}

/** A stand-in for `widgetsForResource` with a motor and an arm entry, whatever `resourceWidgets` holds. */
export const stubWidgetsForResource = ({
	subtype,
}: ResourceName): ResourceWidgetsEntry | undefined =>
	Object.hasOwn(ENTRIES, subtype) ? ENTRIES[subtype] : undefined
