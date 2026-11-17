import type { PaneNode } from '@viamrobotics/prime-panes'
import type { ResourceName } from '@viamrobotics/sdk'

import {
	apiWidgetsForResource,
	type ResourceAPIWidget,
	type ResourceWidget,
	widgetForResource,
} from '$lib/registry'

/**
 * What one playground pane hosts. `composite` is the resource's full card. `api` is one per-method
 * registry entry, titled with its method. `control` is an entry that is not one method, titled
 * with the resource name alone.
 */
export type MotorPane =
	| { kind: 'composite'; resource: ResourceName; widget: ResourceWidget }
	| { kind: 'api' | 'control'; resource: ResourceName; entry: ResourceAPIWidget }

// design-decisions.md: "Motor quick move stays a control interface". The registry has no `kind` yet.
const CONTROL_ENTRY_IDS: ReadonlySet<string> = new Set(['quick-move'])

const COMPOSITE_SLOT = 'composite'

/** One pane id per resource and slot, so a pick finds the pane it already added. */
const motorPaneId = (resource: ResourceName, slot: string) => `${resource.name}::${slot}`

/** The resource's composite card as a pane, or undefined when the registry has none. */
export const compositePane = (resource: ResourceName): PaneNode<MotorPane> | undefined => {
	const widget = widgetForResource(resource)
	if (!widget) return undefined
	return {
		type: 'pane',
		id: motorPaneId(resource, COMPOSITE_SLOT),
		data: { kind: 'composite', resource, widget },
	}
}

/** One pane per registry entry of the resource, in the registry's order. */
export const entryPanes = (resource: ResourceName): PaneNode<MotorPane>[] =>
	apiWidgetsForResource(resource).map((entry) => ({
		type: 'pane',
		id: motorPaneId(resource, entry.id),
		data: { kind: CONTROL_ENTRY_IDS.has(entry.id) ? 'control' : 'api', resource, entry },
	}))

/** The method an `api` pane's breadcrumb title ends with, or undefined for other panes. */
export const motorPaneMethod = (pane: MotorPane): string | undefined =>
	pane.kind === 'api' ? pane.entry.label : undefined

/** The name a pane goes by in tabs, triggers, and announcements, unique across one motor. */
export const motorPaneLabel = (pane: MotorPane): string =>
	pane.kind === 'composite' ? pane.resource.name : `${pane.resource.name} ${pane.entry.label}`

/** The tree row's text for a pane: the resource for a composite, the entry's label otherwise. */
export const motorPaneTreeLabel = (pane: MotorPane): string =>
	pane.kind === 'composite' ? pane.resource.name : pane.entry.label
