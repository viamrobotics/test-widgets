import type { PaneNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'
import type { ResourceWidgetDefinition, ResourceWidgetKind } from '#lib/resource-widget-types.js'

import { getResourceAPI } from '#lib/get-resource-api.js'
import { type ResourceTriplet, ResourceTriplets } from '#lib/resource-triplet.js'
import { widgetsForResource } from '#lib/resource-widgets.js'

import { resourceWidgetTitle } from '../resource-widget-title'

/**
 * What one playground pane hosts: one widget of a resource. An `api` pane renders one RDK method,
 * so its title is the method. A `control` pane is titled with the resource name alone.
 */
export interface ResourcePane {
	kind: ResourceWidgetKind
	resource: ResourceName
	/** The widget's key in the resource's entry. */
	key: string
	title: string
	definition: ResourceWidgetDefinition
}

const resourceTriplet = (resource: ResourceName): ResourceTriplet | undefined =>
	Object.values(ResourceTriplets).find((api) => api === getResourceAPI(resource))

/** The pane's resource API triplet, or undefined when the widgets table does not know the resource. */
export const resourcePaneAPI = (pane: ResourcePane): ResourceTriplet | undefined =>
	resourceTriplet(pane.resource)

/**
 * One pane per widget of the resource, in the entry's order. The id holds the API, the name, and
 * the key, since two resources of different APIs can share a name.
 */
export const resourcePanes = (resource: ResourceName): PaneNode<ResourcePane>[] => {
	const entry = widgetsForResource(resource)
	if (!entry) return []
	const api = getResourceAPI(resource)
	return Object.entries(entry.widgets).map(([key, definition]) => ({
		type: 'pane',
		id: `${api}/${resource.name}::${key}`,
		data: {
			kind: definition.kind,
			resource,
			key,
			title: resourceWidgetTitle(api, key),
			definition,
		},
	}))
}

/** The method an `api` pane's breadcrumb title ends with, or undefined for a control. */
export const resourcePaneMethod = (pane: ResourcePane): string | undefined =>
	pane.kind === 'api' ? pane.title : undefined

/** The name a pane goes by in tabs, triggers, and announcements, unique across one resource. */
export const resourcePaneLabel = (pane: ResourcePane): string =>
	`${pane.resource.name} ${pane.title}`
