<script lang="ts">
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import PcdWidget from '../PCD/PCDWidget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const BUSY_REASON = 'Wait for the point cloud map in flight to finish.'

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

	let hasLastFetchFailed = $state(false)

	// The button stays focusable while a fetch is in flight, so a press then is dropped here.
	const getPointCloudMap = async () => {
		if (pointCloudMapQuery.isFetching) return
		hasLastFetchFailed = false
		const { error } = await pointCloudMapQuery.refetch()
		hasLastFetchFailed = Boolean(error)
	}

	const statusText = $derived.by(() => {
		if (pointCloudMapQuery.isFetching) return 'Getting point cloud map.'
		return hasLastFetchFailed ? 'Get point cloud map failed' : ''
	})
</script>

<ApiSection
	method="GetPointCloudMap"
	api={ResourceTriplets.Slam}
	queries={[pointCloudMapQuery]}
	class="grow flex-col gap-3"
>
	<Field
		label="Return edited map"
		class="flex items-center gap-2"
	>
		<Checkbox bind:checked={shouldReturnEditedMap} />
		<Label />
	</Field>

	<div class="flex flex-col gap-2">
		<div class="flex items-start">
			<HeldBack reason={pointCloudMapQuery.isFetching ? BUSY_REASON : undefined}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={getPointCloudMap}
					>
						Get point cloud map
					</button>
				{/snippet}
			</HeldBack>
		</div>
		<StatusLine text={statusText} />
	</div>

	{#if pointCloudMapQuery.data !== undefined}
		<div class="-mx-4">
			<PcdWidget
				data={pointCloudMapQuery.data}
				label={resourceName}
			/>
		</div>
	{/if}
</ApiSection>
