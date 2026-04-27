import {
	MachineConnectionEvent,
	MLModelClient,
	type Resource,
	ResourceName,
} from '@viamrobotics/sdk'
import { useConnectionStatus, useRobotClient } from '@viamrobotics/svelte-sdk'

import { clientForBuiltinResource } from '$lib/client-map'

type DoCommandable = Exclude<Resource, MLModelClient>

export const createDoCommandClient = (
	resource: () => ResourceName,
	partID: () => string,
	resourceName: () => string
): { current: DoCommandable | undefined } => {
	const robotClient = useRobotClient(partID)
	const connectionStatus = useConnectionStatus(partID)

	const resourceClient = $derived.by(() => {
		if (!robotClient.current) return
		if (connectionStatus.current !== MachineConnectionEvent.CONNECTED) return

		const constructor = clientForBuiltinResource(resource())
		if (!constructor) return

		const nextClient = new constructor(robotClient.current, resourceName()) as DoCommandable
		// PartIDs are used to invalidate queries for this client
		;(nextClient as typeof nextClient & { partID: string }).partID = partID()

		return nextClient
	})

	return {
		get current() {
			return resourceClient
		},
	}
}
