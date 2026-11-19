import type { FloatRect, LayoutNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'

import { compositePane, entryPanes, type MotorPane } from './motor-pane'

// IsMoving's recommended and maximum width on the Motor-Frames registry table. The height fits
// today's IsMoving body, which is taller than the compact badge the table measures.
const IS_MOVING_WINDOW: FloatRect = { x: 24, y: 64, width: 242, height: 140 }

const COMPOSITE_SHARE = 0.5
const SET_POWER_SHARE = 0.4

/**
 * The layout the playground opens with for one motor: the composite beside SetPower in a split,
 * SetRPM, GoFor, and GoTo in a stack under SetPower, and IsMoving floating over them. Falls back
 * to the composite alone when the registry no longer lists one of those entries.
 */
export const initialMotorLayout = (resource: ResourceName): LayoutNode<MotorPane> | undefined => {
	const composite = compositePane(resource)
	const entries = entryPanes(resource)
	const entry = (id: string) =>
		entries.find(({ data }) => data.kind !== 'composite' && data.entry.id === id)

	const setPower = entry('set-power')
	const setRpm = entry('set-rpm')
	const goFor = entry('go-for')
	const goTo = entry('go-to')
	const isMoving = entry('is-moving')

	if (!composite || !setPower || !setRpm || !goFor || !goTo || !isMoving) return composite

	return {
		type: 'float',
		id: `${composite.id}::float`,
		base: {
			type: 'split',
			id: `${composite.id}::split`,
			direction: 'row',
			ratio: COMPOSITE_SHARE,
			first: composite,
			second: {
				type: 'split',
				id: `${composite.id}::api-split`,
				direction: 'column',
				ratio: SET_POWER_SHARE,
				first: setPower,
				second: {
					type: 'stack',
					id: `${composite.id}::stack`,
					activeId: setRpm.id,
					panes: [setRpm, goFor, goTo],
				},
			},
		},
		floats: [{ id: `${composite.id}::window`, rect: IS_MOVING_WINDOW, content: isMoving }],
	}
}
