<script lang="ts">
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import PcdWidget from '../pcd/pcd-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	let shouldReturnEditedMap = $state(false)

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	// Disabled so nothing is fetched until the button is pressed.
	const pointCloudMapQuery = createResourceQuery(
		client,
		'getPointCloudMap',
		(): Parameters<SlamClient['getPointCloudMap']> => [shouldReturnEditedMap],
		() => ({
			enabled: false,
			refetchInterval: false,
		})
	)

	const getPointCloudMap = async () => {
		await pointCloudMapQuery.refetch()
	}
</script>

<ApiSection
	method="GetPointCloudMap"
	api={ResourceTriplets.Slam}
	queries={[pointCloudMapQuery]}
	class="grow flex-col gap-3"
>
	<Field class="flex items-center gap-2">
		<Checkbox bind:checked={shouldReturnEditedMap} />
		<Label>Return edited map</Label>
	</Field>

	<button
		type="button"
		class="button button-compact"
		onclick={getPointCloudMap}
	>
		Get point cloud map
	</button>

	{#if pointCloudMapQuery.data !== undefined}
		<div class="-mx-4">
			<PcdWidget
				data={pointCloudMapQuery.data}
				label={resourceName}
			/>
		</div>
	{/if}
</ApiSection>
