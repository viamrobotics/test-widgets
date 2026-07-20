import type { Component } from 'svelte'

/** Every resource widget shares this prop contract and is self-contained. */
export interface ResourceWidgetProps {
	partID: string
	resourceName: string
}

export type ResourceWidget = Component<ResourceWidgetProps>

/** One of a resource's individual API widgets (e.g. a menu entry); renders one or more self-contained widgets. */
export interface ResourceAPIWidget {
	/** Stable identifier, safe to persist. Never rename. e.g. `'move-to-joint-positions'`. */
	id: string
	/** Human-readable menu label. e.g. `'MoveToJointPositions'` or `'Quick move'`. */
	label: string
	/** The self-contained widget(s) this entry renders, each with `{ partID, resourceName }`. */
	widgets: ResourceWidget[]
}

/** A registry entry: a resource's composite card plus its individual API widgets. */
export interface ResourceWidgetEntry {
	widget: ResourceWidget
	apis: ResourceAPIWidget[]
}
