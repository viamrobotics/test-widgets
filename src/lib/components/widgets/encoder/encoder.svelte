<script lang="ts">
	import { EncoderClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { getEncoderPositionArgs } from './encoder-position-type'
	import Position from './position.svelte'
	import PropertiesReadout from './properties-readout.svelte'
	import ResetPositionWidget from './reset-position-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		EncoderClient,
		() => partID,
		() => resourceName
	)

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'encoder-view'
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', {
		refetchInterval: false,
	})

	const positionQuery = createResourceQuery(
		client,
		'getPosition',
		() => getEncoderPositionArgs(propertiesQuery.data),
		() => ({
			enabled: propertiesQuery.data !== undefined,
			refetchInterval: refetchInterval.current,
		})
	)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="Refresh"
					class="p-2"
				>
					<RefetchController
						{refetchInterval}
						queries={[positionQuery]}
					/>
				</div>

				<div
					role="group"
					aria-label="Mutators"
					class="flex min-w-0 flex-col"
				>
					<ResetPositionWidget
						{partID}
						{resourceName}
					/>
				</div>

				<div
					role="group"
					aria-label="Queries"
					class="grid w-full grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0"
				>
					<div class="flex min-w-0 flex-col">
						<ApiSection
							method="GetPosition"
							api={ResourceTriplets.Encoder}
							queries={[propertiesQuery, positionQuery]}
							class="grow flex-col gap-4"
						>
							{#snippet tooltip()}
								Relative encoders return ticks since last zeroing. Absolute encoders return degrees.
							{/snippet}
							<Position data={positionQuery.data} />
						</ApiSection>
					</div>

					<div class="flex min-w-0 flex-col">
						<ApiSection
							method="GetProperties"
							api={ResourceTriplets.Encoder}
							queries={[propertiesQuery]}
							class="grow flex-col gap-1"
						>
							{#snippet tooltip()}
								Returns which position types the encoder supports: ticks count, angle degrees, or
								both.
							{/snippet}
							<PropertiesReadout properties={propertiesQuery.data} />
						</ApiSection>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
