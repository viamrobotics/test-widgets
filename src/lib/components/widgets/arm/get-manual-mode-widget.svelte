<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const query = $derived(createResourceQuery(client, 'getManualMode', { refetchInterval: 500 }))
</script>

<ApiSection
	method="GetManualMode"
	api={ResourceTriplets.Arm}
	class="flex-col gap-4"
>
	{#snippet description()}Updates automatically{/snippet}
	<Query {query}>
		<StatusPill
			isActive={query.data ?? false}
			activeText="Enabled"
			inactiveText="Disabled"
		/>
	</Query>
</ApiSection>
