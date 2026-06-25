import type { ResourceStatus } from '@viamrobotics/svelte-sdk'

import { type ResourceName, robotApi } from '@viamrobotics/sdk'

export type NamedResourceStatus = ResourceStatus & {
	name: ResourceName
}

export const ResourceStatusText = {
	[robotApi.ResourceStatus_State.UNSPECIFIED]: 'unspecified',
	[robotApi.ResourceStatus_State.READY]: 'ready',
	[robotApi.ResourceStatus_State.CONFIGURING]: 'configuring',
	[robotApi.ResourceStatus_State.UNHEALTHY]: 'unhealthy',
	[robotApi.ResourceStatus_State.UNCONFIGURED]: 'unconfigured',
	[robotApi.ResourceStatus_State.REMOVING]: 'removing',
}

// sorts resource names by local/remote -> type -> name (alphabetical) to produce a list like
// component a
// component z
// service   b
// component remote:c
// service   remote:b
export const sortResourceNames = (names: ResourceName[]): ResourceName[] =>
	names.toSorted(({ type, name }, { type: otherType, name: otherName }) => {
		// sort all non-remote resources before remote resources
		if (name.includes(':') !== otherName.includes(':')) {
			return name.includes(':') ? 1 : -1
		}
		// sort alphabetically within type
		// sort components before services
		return type === otherType ? name.localeCompare(otherName) : type.localeCompare(otherType)
	})
