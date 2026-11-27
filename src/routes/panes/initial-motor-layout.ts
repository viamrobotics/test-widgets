import type { FloatRect, LayoutNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'

import { type ResourcePane, resourcePanes } from './resource-pane'

const IS_MOVING_WINDOW: FloatRect = { x: 24, y: 64, width: 242, height: 140 }

const QUICK_MOVE_SHARE = 0.5
const SET_POWER_SHARE = 0.4

/**
 * The layout the playground opens with for one motor: QuickMove beside SetPower in a split, SetRPM,
 * GoFor, and GoTo in a stack under SetPower, and IsMoving floating over them. Returns undefined
 * when the motor's entry no longer lists one of those keys.
 */
export const initialMotorLayout = (
	resource: ResourceName
): LayoutNode<ResourcePane> | undefined => {
	const panes = resourcePanes(resource)
	const widget = (key: string) => panes.find(({ data }) => data.key === key)

	const quickMove = widget('quickMove')
	const setPower = widget('setPower')
	const setRpm = widget('setRpm')
	const goFor = widget('goFor')
	const goTo = widget('goTo')
	const isMoving = widget('isMoving')

	if (!quickMove || !setPower || !setRpm || !goFor || !goTo || !isMoving) return undefined

	return {
		type: 'float',
		id: `${quickMove.id}::float`,
		base: {
			type: 'split',
			id: `${quickMove.id}::split`,
			direction: 'row',
			ratio: QUICK_MOVE_SHARE,
			first: quickMove,
			second: {
				type: 'split',
				id: `${quickMove.id}::api-split`,
				direction: 'column',
				ratio: SET_POWER_SHARE,
				first: setPower,
				second: {
					type: 'stack',
					id: `${quickMove.id}::stack`,
					activeId: setRpm.id,
					panes: [setRpm, goFor, goTo],
				},
			},
		},
		floats: [{ id: `${quickMove.id}::window`, rect: IS_MOVING_WINDOW, content: isMoving }],
	}
}
