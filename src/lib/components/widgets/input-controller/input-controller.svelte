<script lang="ts">
	import { InputControllerClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Query from '$lib/components/query.svelte'
	import ReadingsList from '$lib/components/readings-list.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import Webgamepad from './webgamepad.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'input-controller'
	)

	const isWebgamepad = $derived(resourceName.toLowerCase() === 'webgamepad')

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const eventsQuery = createResourceQuery(client, 'getEvents', () => ({
		refetchInterval: refetchInterval.current,
	}))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-row items-center justify-between p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[eventsQuery]}
			/>
			{#if isWebgamepad}
				<Webgamepad
					{partID}
					{resourceName}
					refetch={eventsQuery.refetch}
				/>
			{/if}
		</div>

		<ApiSection
			title="GetReadings"
			class="relative"
		>
			<Query
				query={eventsQuery}
				contentCx="h-4"
			>
				{#if eventsQuery.data !== undefined}
					<ReadingsList
						data={Object.fromEntries(
							eventsQuery.data.map(({ control, value }) => [control, value])
						)}
					/>
				{/if}
			</Query>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
