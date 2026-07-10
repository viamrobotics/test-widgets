<script lang="ts">
	import { Button } from '@viamrobotics/prime-core'
	import { EncoderClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import ErrorDisplay from '$lib/components/error.svelte'
	import Queries from '$lib/components/queries.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import { getEncoderPositionArgs } from './encoder-position-type'
	import Position from './position.svelte'

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

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const positionQuery = createResourceQuery(
		client,
		'getPosition',
		() => getEncoderPositionArgs(propertiesQuery.data),
		() => ({
			enabled: propertiesQuery.data !== undefined,
			refetchInterval: refetchInterval.current,
		})
	)
	const resetMutation = createResourceMutation(client, 'resetPosition')
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[propertiesQuery, positionQuery]}
			/>
		</div>

		<div class="grid w-full grid-cols-2 divide-x">
			<ApiSection
				title="GetPosition"
				api="rdk:component:encoder"
				tooltip="Relative encoders return ticks since last zeroing. Absolute encoders return degrees."
				class="gap-3"
			>
				<Queries queries={[propertiesQuery, positionQuery]}>
					{#if positionQuery.data !== undefined}
						{@const [position, encoderPositionType] = positionQuery.data}
						<div class="font-roboto-mono flex flex-col gap-2 text-sm">
							<Position
								{position}
								{encoderPositionType}
							/>
						</div>
					{/if}
				</Queries>
			</ApiSection>

			<ApiSection
				title="ResetPosition"
				api="rdk:component:encoder"
				description="Set the current position as the new zero position"
			>
				<Button
					icon="play-circle-outline"
					class="w-fit"
					onclick={() => {
						resetMutation.mutate([], {})
					}}
				>
					Execute
				</Button>
				<ErrorDisplay lastError={resetMutation.error} />
			</ApiSection>
		</div>
	{/snippet}
</ConnectionStatus>
