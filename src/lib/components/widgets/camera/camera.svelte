<script lang="ts">
	import { CameraClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import CameraGetImagesWidget from './get-images-widget.svelte'
	import CameraGetPointCloudWidget from './get-point-cloud-widget.svelte'
	import CameraGetPropertiesWidget from './get-properties-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * @deprecated Moved to `CameraControls`. The composite no longer streams, so it reads
		 * nothing from this prop.
		 */
		autoplay?: boolean
	}

	// eslint-disable-next-line svelte/no-unused-props -- `autoplay` stays so callers that pass it still type-check until the next major
	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		CameraClient,
		() => partID,
		() => resourceName
	)

	// GetProperties is read once here to decide whether GetPointCloud shows.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	// Shown until GetProperties answers, and hidden only on an answered `supports_pcd: false`.
	const showPointCloud = $derived(propertiesQuery.data?.supportsPcd !== false)
</script>

<div class="flex flex-col gap-4">
	<CameraGetImagesWidget
		{partID}
		{resourceName}
	/>
	{#if showPointCloud}
		<CameraGetPointCloudWidget
			{partID}
			{resourceName}
		/>
	{/if}
	<CameraGetPropertiesWidget
		{partID}
		{resourceName}
	/>
</div>
