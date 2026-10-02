<script lang="ts">
	import { EncoderClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import Queries from '$lib/components/queries.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: 500 })

	const positionQuery = createResourceQuery(
		client,
		'getPosition',
		() => getEncoderPositionArgs(propertiesQuery.data),
		() => ({
			enabled: propertiesQuery.data !== undefined,
			refetchInterval: 500,
		})
	)
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Encoder}
	class="grow flex-col gap-4"
>
	{#snippet tooltip()}
		Relative encoders return ticks since last zeroing. Absolute encoders return degrees.
	{/snippet}
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
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
