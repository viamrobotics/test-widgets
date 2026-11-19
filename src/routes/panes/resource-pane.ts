import type { PaneNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'

import { getResourceAPI } from '$lib/get-resource-api'
import {
	apiWidgetsForResource,
	type ResourceAPIWidget,
	type ResourceWidget,
	widgetForResource,
} from '$lib/registry'
import { type ResourceTriplet, ResourceTriplets } from '$lib/resource-triplet'

/**
 * What one playground pane hosts. `composite` is the resource's full card. `api` is one per-method
 * registry entry, titled with its method. `control` is an entry that is not one method, titled
 * with the resource name alone.
 */
export type ResourcePane =
	| { kind: 'composite'; resource: ResourceName; widget: ResourceWidget }
	| { kind: 'api' | 'control'; resource: ResourceName; entry: ResourceAPIWidget }

// design-decisions.md: "Motor quick move stays a control interface". The registry has no `kind`
// yet. Keyed per resource API, so a future entry that reuses an id is not a control by accident.
const CONTROL_ENTRY_IDS: Readonly<Record<string, ReadonlySet<string>>> = {
	[ResourceTriplets.Motor]: new Set(['quick-move']),
	[ResourceTriplets.Arm]: new Set(['manual-mode']),
	[ResourceTriplets.Base]: new Set(['quick-move']),
	[ResourceTriplets.Gantry]: new Set(['quick-move']),
	[ResourceTriplets.Servo]: new Set(['quick-move']),
	[ResourceTriplets.Gripper]: new Set(['open-grab']),
	[ResourceTriplets.Camera]: new Set(['controls']),
	[ResourceTriplets.Vision]: new Set(['controls']),
	[ResourceTriplets.Navigation]: new Set(['controls']),
	[ResourceTriplets.Slam]: new Set(['controls']),
	[ResourceTriplets.AudioInput]: new Set(['controls']),
	[ResourceTriplets.Discovery]: new Set(['controls']),
	[ResourceTriplets.AudioOutput]: new Set(['controls']),
}

/** The pane slot and minimum key for a resource's composite card, which has no registry id. */
export const COMPOSITE_SLOT = 'composite'

/** One pane id per resource and slot, so a pick finds the pane it already added. */
const resourcePaneId = (resource: ResourceName, slot: string) => `${resource.name}::${slot}`

/** The resource's composite card as a pane, or undefined when the registry has none. */
export const compositePane = (resource: ResourceName): PaneNode<ResourcePane> | undefined => {
	const widget = widgetForResource(resource)
	if (!widget) return undefined
	return {
		type: 'pane',
		id: resourcePaneId(resource, COMPOSITE_SLOT),
		data: { kind: 'composite', resource, widget },
	}
}

/** One pane per registry entry of the resource, in the registry's order. */
export const entryPanes = (resource: ResourceName): PaneNode<ResourcePane>[] =>
	apiWidgetsForResource(resource).map((entry) => ({
		type: 'pane',
		id: resourcePaneId(resource, entry.id),
		data: {
			kind: CONTROL_ENTRY_IDS[getResourceAPI(resource)]?.has(entry.id) ? 'control' : 'api',
			resource,
			entry,
		},
	}))

/** The method an `api` pane's breadcrumb title ends with, or undefined for other panes. */
export const resourcePaneMethod = (pane: ResourcePane): string | undefined =>
	pane.kind === 'api' ? pane.entry.label : undefined

/** The name a pane goes by in tabs, triggers, and announcements, unique across one resource. */
export const resourcePaneLabel = (pane: ResourcePane): string =>
	pane.kind === 'composite' ? pane.resource.name : `${pane.resource.name} ${pane.entry.label}`

/** The tree row's text for a pane: the resource for a composite, the entry's label otherwise. */
export const resourcePaneTreeLabel = (pane: ResourcePane): string =>
	pane.kind === 'composite' ? pane.resource.name : pane.entry.label

/** The pane's resource API triplet, or undefined when the registry does not know the resource. */
export const resourcePaneAPI = (pane: ResourcePane): ResourceTriplet | undefined =>
	Object.values(ResourceTriplets).find((api) => api === getResourceAPI(pane.resource))
