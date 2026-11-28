import type { Component } from 'svelte'

/**
 * Every resource widget shares this prop contract. The pair is also the key into the shared state
 * `WidgetsProvider` holds, so two widgets naming the same resource share its guards.
 */
export interface ResourceWidgetProps {
	partID: string
	resourceName: string
}

export type ResourceWidget = Component<ResourceWidgetProps>

/**
 * What a widget is. `api` renders one RDK method, and its key is that method's name in camelCase.
 * `control` is bespoke and bound to no one method, such as quick move.
 */
export type ResourceWidgetKind = 'api' | 'control'

/** One of a resource's widgets, as `resourceWidgets` lists it. */
export interface ResourceWidgetDefinition {
	component: ResourceWidget
	kind: ResourceWidgetKind
}

/** A resource's entry in `resourceWidgets`. */
export interface ResourceWidgetsEntry {
	/**
	 * Keyed by id: the method or control name in camelCase. A key is safe to persist. The order is
	 * the declared order, which a host's menu can keep.
	 */
	widgets: Record<string, ResourceWidgetDefinition>
}
