import type { ResourceName } from '@viamrobotics/sdk'

import { getResourceAPI } from './get-resource-api.ts'
import { ResourceTriplets } from './resource-triplet.ts'

const hiddenResources = new Set<string>([
	ResourceTriplets.DataManager,
	ResourceTriplets.Motion,
	ResourceTriplets.Sensors,
	ResourceTriplets.Shell,
])

/** Whether the control view should surface a card for this resource. */
export const showResourceWidget = (resource: ResourceName): boolean =>
	resource.namespace !== 'rdk-internal' && !hiddenResources.has(getResourceAPI(resource))
