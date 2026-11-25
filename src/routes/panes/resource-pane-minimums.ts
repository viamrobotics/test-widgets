import { HEIGHT_BAND_PX, WIDTH_CLASS_PX } from '$lib/widget-size'

import type { PaneSize } from './layout-minimum'
import type { ResourcePane } from './resource-pane'

// resource-pane-frame.svelte: the frame's 1 px `border` on each side.
const PANE_BORDERS = 2

// resource-pane-frame.svelte: the header's `py-1` around its `size-6` buttons, plus its 1 px `border-b`.
const PANE_HEADER_HEIGHT = 33

/** The narrowest the widget in a pane's body lays out, from its width class floor. */
export const resourcePaneBodyMinWidth = (pane: ResourcePane): number =>
	WIDTH_CLASS_PX[pane.definition.size.width.min]

/** The widest the widget in a pane's body adds anything but empty space, or undefined for `fill`. */
export const resourcePaneBodyMaxWidth = (pane: ResourcePane): number | undefined => {
	const { max } = pane.definition.size.width
	return max === 'fill' ? undefined : WIDTH_CLASS_PX[max]
}

/** The height band's px. An `xl` widget scrolls, so it floors at the `lg` band. */
const bodyMinHeight = (pane: ResourcePane): number => {
	const { height } = pane.definition.size
	return height === 'xl' ? HEIGHT_BAND_PX.lg : HEIGHT_BAND_PX[height]
}

/**
 * The smallest a resource pane snaps to before its body scrolls: the widget's class floor and band
 * plus the frame's borders and header.
 */
export const resourcePaneMinimum = (pane: ResourcePane): PaneSize => ({
	width: resourcePaneBodyMinWidth(pane) + PANE_BORDERS,
	height: bodyMinHeight(pane) + PANE_HEADER_HEIGHT + PANE_BORDERS,
})
