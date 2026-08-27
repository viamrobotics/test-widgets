<script lang="ts">
	import { SensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import ExtraParamsInput from '$lib/components/extra-params-input.svelte'
	import { createExtraParamsStore } from '$lib/components/extra-params-store.svelte'
	import Query from '$lib/components/query.svelte'
	import ReadingsList from '$lib/components/readings-list.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'sensor'
	)

	const client = createResourceClient(
		SensorClient,
		() => partID,
		() => resourceName
	)

	const extraParams = createExtraParamsStore(
		() => partID,
		() => resourceName,
		'sensor-getReadings'
	)

	const readingsQuery = createResourceQuery(
		client,
		'getReadings',
		(): [Record<string, unknown>?] => (extraParams.current ? [extraParams.current] : []),
		() => ({
			refetchInterval: refetchInterval.current,
		})
	)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-col gap-3 p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[readingsQuery]}
			/>
			<ExtraParamsInput store={extraParams} />
		</div>

		<ApiSection
			title="GetReadings"
			api="rdk:component:sensor"
			class="relative"
		>
			<Query
				query={readingsQuery}
				contentCx="h-6"
			>
				{#if readingsQuery.data !== undefined}
					<ReadingsList data={readingsQuery.data} />
				{/if}
			</Query>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
