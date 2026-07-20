import type { ResourceName } from '@viamrobotics/sdk'

import type { ResourceTriplet } from './resource-triplet.ts'
import type { ResourceAPIWidget, ResourceWidget } from './resource-widget-types.ts'

import {
	componentApiWidgets,
	componentWidgetForResource,
	componentWidgetRegistry,
} from './component-widget-registry.ts'
import { getResourceAPI } from './get-resource-api.ts'
import {
	serviceApiWidgets,
	serviceWidgetForResource,
	serviceWidgetRegistry,
} from './service-widget-registry.ts'

/**
 * Returns a resource's individual API widgets. Each entry carries a stable `id`, a
 * display `label`, and the `widgets` to render with `{ partID, resourceName }`.
 *
 * Composes the component and service registries. Returns `[]` for a resource with a
 * card but no standalone API widgets, and for unrecognized resources.
 *
 * @example
 * apiWidgetsForResource(gripperResourceName)
 * // [{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenWidget, GripperGrabWidget] }, ...]
 */
export const apiWidgetsForResource = (resource: ResourceName): ResourceAPIWidget[] => {
	const api = getResourceAPI(resource)
	if (api in componentWidgetRegistry) return componentApiWidgets(resource)
	if (api in serviceWidgetRegistry) return serviceApiWidgets(resource)
	return []
}

/**
 * Returns every resource triplet that has a test card, mapped to its API widgets.
 * Use this to enumerate the full catalog, e.g. a menu spanning every resource type;
 * for a single resource, prefer `apiWidgetsForResource`.
 *
 * @example
 * availableAPIWidgets()[ResourceTriplets.Gripper]
 * // [{ id: 'open-grab', label: 'Open / Grab', widgets: [GripperOpenWidget, GripperGrabWidget] }, ...]
 */
export const availableAPIWidgets = (): Partial<Record<ResourceTriplet, ResourceAPIWidget[]>> => {
	const result: Partial<Record<ResourceTriplet, ResourceAPIWidget[]>> = {}
	for (const [api, entry] of Object.entries(componentWidgetRegistry)) {
		if (entry) result[api as ResourceTriplet] = entry.apis
	}
	for (const [api, entry] of Object.entries(serviceWidgetRegistry)) {
		if (entry) result[api as ResourceTriplet] = entry.apis
	}

	return result
}

/** Returns the full composite test card for a resource, or `undefined` if none exists. */
export const widgetForResource = (resource: ResourceName): ResourceWidget | undefined =>
	componentWidgetForResource(resource) ?? serviceWidgetForResource(resource)
