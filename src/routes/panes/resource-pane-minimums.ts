import type { ResourceWidgetSize } from '$lib/registry'

import type { PaneSize } from './layout-minimum'
import type { ResourcePane } from './resource-pane'

// resource-pane-frame.svelte and pop-out-pane-frame.svelte: the frame's 1 px `border` on each side.
const PANE_BORDERS = 2

// Both frames: the header's `py-1` around its `size-6` buttons, plus its 1 px `border-b`.
const PANE_HEADER_HEIGHT = 33

/** The pane a body of `minWidth` by `minHeight` needs once the frame adds its borders and header. */
export const framedPaneSize = ({
	minWidth,
	minHeight,
}: {
	minWidth: number
	minHeight: number
}): PaneSize => ({
	width: minWidth + PANE_BORDERS,
	height: minHeight + PANE_HEADER_HEIGHT + PANE_BORDERS,
})

/**
 * The narrowest each kind of pane's header lays out, borders included, with its title truncated to
 * nothing. Every header ends in its Move and Close buttons. An `api` header adds the method's chevron and its docs and errors buttons. Measured by
 * `__tests__/pane-minimums.svelte.spec.ts` on a docked pane.
 */
const HEADER_FLOOR_WIDTH: Readonly<Record<ResourcePane['kind'], number>> = {
	composite: 106,
	control: 106,
	api: 180,
}

const paneWidgetSize = (pane: ResourcePane): ResourceWidgetSize =>
	pane.kind === 'composite' ? pane.size : pane.entry.size

/**
 * The smallest a resource pane snaps to before its body scrolls: the widget's registry size plus the
 * frame's borders and header, and never narrower than the header itself.
 */
export const resourcePaneMinimum = (pane: ResourcePane): PaneSize => {
	const { width, height } = framedPaneSize(paneWidgetSize(pane))
	return { width: Math.max(width, HEADER_FLOOR_WIDTH[pane.kind]), height }
}

/** The narrowest the widget in a pane's body lays out. Narrower, the body scrolls sideways. */
export const resourcePaneBodyMinWidth = (pane: ResourcePane): number =>
	resourcePaneMinimum(pane).width - PANE_BORDERS
