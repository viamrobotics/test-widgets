import type { ResourceName } from '@viamrobotics/sdk'

import { getResourceAPI } from './get-resource-api.ts'
import { ResourceTriplets } from './resource-triplet.ts'

const knownResources = new Set<string>(Object.values(ResourceTriplets))

/** Whether a resource's API is a recognized Viam resource triplet. */
export const isKnownResource = (resource: ResourceName): boolean =>
	knownResources.has(getResourceAPI(resource))
