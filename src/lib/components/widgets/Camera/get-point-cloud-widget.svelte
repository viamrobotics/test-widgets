<script lang="ts">
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import PcdWidget from '../pcd/pcd-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	// Disabled so nothing is fetched until the button is pressed.
	const pointCloudQuery = createResourceQuery(client, 'getPointCloud', () => ({
		enabled: false,
		refetchInterval: false,
	}))

	const getPointCloud = async () => {
		await pointCloudQuery.refetch()
	}
</script>

<ApiSection
	method="GetPointCloud"
	api={ResourceTriplets.Camera}
	queries={[pointCloudQuery]}
	class="grow flex-col gap-3"
>
	{#snippet tooltip()}
		Get depth measurement data from cameras with depth sensing support
	{/snippet}
	<button
		type="button"
		class="button button-compact"
		onclick={getPointCloud}
	>
		Get point cloud
	</button>

	{#if pointCloudQuery.data !== undefined}
		<div class="-mx-4">
			<PcdWidget
				data={pointCloudQuery.data}
				label={resourceName}
			/>
		</div>
	{/if}
</ApiSection>
