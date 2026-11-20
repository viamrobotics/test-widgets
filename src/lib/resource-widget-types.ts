import type { Component } from 'svelte'

/** Every resource widget shares this prop contract and is self-contained. */
export interface ResourceWidgetProps {
	partID: string
	resourceName: string
}

export type ResourceWidget = Component<ResourceWidgetProps>

/**
 * A widget's layout sizes in px, for a host that sizes, snaps, or caps the box it renders in.
 * Every number is the widget's own box, the body the library renders, without any header,
 * padding, or border the host draws around it.
 */
export interface ResourceWidgetSize {
	/** Narrower than this, the widget overflows. A host scrolls it sideways or keeps its box wider. */
	minWidth: number
	/** Shorter than this at `minWidth`, the widget overflows. A host scrolls it or keeps its box taller. */
	minHeight: number
	/** The narrowest width of each of the widget's layouts, ascending. A host may snap to these. */
	recommendedWidths: readonly number[]
	/** Wider than this, the widget adds only empty space. */
	maxWidth: number
}

/** One of a resource's individual API widgets (e.g. a menu entry); renders one or more self-contained widgets. */
export interface ResourceAPIWidget {
	/** Stable identifier, safe to persist. Never rename. e.g. `'move-to-joint-positions'`. */
	id: string
	/** Human-readable menu label. e.g. `'MoveToJointPositions'` or `'Quick move'`. */
	label: string
	/** The self-contained widget(s) this entry renders, each with `{ partID, resourceName }`. */
	widgets: ResourceWidget[]
	/** The layout sizes of the entry's widgets, rendered together as the entry renders them. */
	size: ResourceWidgetSize
}

/** A registry entry: a resource's composite card plus its individual API widgets. */
export interface ResourceWidgetEntry {
	widget: ResourceWidget
	/** The composite card's layout sizes. */
	size: ResourceWidgetSize
	apis: ResourceAPIWidget[]
}
