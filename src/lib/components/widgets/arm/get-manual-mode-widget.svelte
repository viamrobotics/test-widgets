<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Query from '$lib/components/query.svelte'
	import StatusPill from '$lib/components/status-pill.svelte'

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
	title="GetManualMode"
	api="rdk:component:arm"
	bottomText="Updates automatically"
>
	<Query {query}>
		<StatusPill
			isActive={query.data ?? false}
			activeText="Enabled"
			inactiveText="Disabled"
		/>
	</Query>
</ApiSection>
