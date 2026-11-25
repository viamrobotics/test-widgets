<script lang="ts">
	import { NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { modeLabel } from './navigation-mode'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const REFETCH_INTERVAL_MS = 1000

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const query = createResourceQuery(client, 'getMode', { refetchInterval: REFETCH_INTERVAL_MS })
</script>

<ApiSection
	method="GetMode"
	api={ResourceTriplets.Navigation}
	queries={[query]}
	class="grow flex-col gap-2"
>
	<div class="flex min-w-0 flex-col gap-0.5">
		<span class="text-subtle-1 truncate text-xs">Mode</span>
		<span class="readout font-roboto-mono">
			<span class="readout-value">{modeLabel(query.data)}</span>
		</span>
	</div>
</ApiSection>
