import { MachineConnectionEvent, MLModelClient, ResourceName } from '@viamrobotics/sdk'
import { useConnectionStatus, useRobotClient } from '@viamrobotics/svelte-sdk'

import { clientForBuiltinResource, clientMap } from '$lib/client-map'

type DoCommandable = InstanceType<
	Exclude<(typeof clientMap)[keyof typeof clientMap], typeof MLModelClient>
>

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
		if (constructor === MLModelClient) return

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
