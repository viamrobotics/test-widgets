<script lang="ts">
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import CloudSlamNotice from './cloud-slam-notice.svelte'
	import SlamGetInternalStateWidget from './get-internal-state-widget.svelte'
	import SlamGetPointCloudMapWidget from './get-point-cloud-map-widget.svelte'
	import SlamGetPositionWidget from './get-position-widget.svelte'
	import SlamGetPropertiesWidget from './get-properties-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	// Same query and options as GetProperties, so the query cache shares one request.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
</script>

<div class="@container">
	<div class="flex flex-col divide-y">
		{#if propertiesQuery.data?.cloudSlam}
			<CloudSlamNotice />
		{/if}
		<SlamGetPositionWidget
			{partID}
			{resourceName}
		/>
		<SlamGetPointCloudMapWidget
			{partID}
			{resourceName}
		/>
		<div
			role="group"
			aria-label="Queries"
			class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0"
		>
			<SlamGetInternalStateWidget
				{partID}
				{resourceName}
			/>
			<SlamGetPropertiesWidget
				{partID}
				{resourceName}
			/>
		</div>
	</div>
</div>
