import type { PaneNode } from '@viamrobotics/prime-panes'

import type { PopOutSize } from '$lib/components/pop-out/pop-out-host-context'

import type { PaneSize } from './layout-minimum'

import { type ResourcePane, resourcePaneLabel } from './resource-pane'
import { framedPaneSize, resourcePaneMinimum } from './resource-pane-minimums'

/**
 * A window a control opened through the playground's pop-out host. The layout holds only plain
 * data, so the request's content and `onClose` stay with the host, keyed by `popOutId`.
 */
export interface PopOutPane {
	kind: 'pop-out'
	popOutId: string
	title: string
	minSize: PopOutSize
}

/** What any playground pane hosts: a resource's widget, or a control's pop-out window. */
export type PlaygroundPane = ResourcePane | PopOutPane

/** The pane id of the pop-out with `popOutId`, apart from every resource pane id. */
export const popOutPaneId = (popOutId: string) => `pop-out::${popOutId}`

export const isResourcePaneNode = (
	node: PaneNode<PlaygroundPane>
): node is PaneNode<ResourcePane> => node.data.kind !== 'pop-out'

/** The name a pane goes by in tabs, window labels, and announcements. */
export const playgroundPaneLabel = (pane: PlaygroundPane): string =>
	pane.kind === 'pop-out' ? pane.title : resourcePaneLabel(pane)

/** The smallest a pane snaps to. A pop-out's body never goes under the size its control asked for. */
export const playgroundPaneMinimum = (pane: PlaygroundPane): PaneSize =>
	pane.kind === 'pop-out' ? framedPaneSize(pane.minSize) : resourcePaneMinimum(pane)
