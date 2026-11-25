<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { VisionClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	interface Row {
		label: string
		text: string
		/** A capability row's dot. A plain readout has none. */
		dot?: 'success' | 'disabled'
	}

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		VisionClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties')

	const supportRow = (label: string, isSupported: boolean | undefined): Row => {
		if (isSupported === undefined) return { label, text: MISSING_VALUE }
		if (isSupported) return { label, text: 'Supported', dot: 'success' }
		return { label, text: 'Not supported', dot: 'disabled' }
	}

	// An empty name means the service has no default camera.
	const defaultCameraRow = (name: string | undefined): Row => {
		if (!name) return { label: 'Default camera', text: MISSING_VALUE }
		return { label: 'Default camera', text: name }
	}

	const rows = $derived<Row[]>([
		supportRow('Classifications', propertiesQuery.data?.classificationsSupported),
		supportRow('Detections', propertiesQuery.data?.detectionsSupported),
		supportRow('Object point clouds', propertiesQuery.data?.objectPointCloudsSupported),
		defaultCameraRow(propertiesQuery.data?.defaultCamera),
	])

	const labelId = $props.id()
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="GetProperties"
	api={ResourceTriplets.Vision}
	queries={[propertiesQuery]}
>
	<div class="flex flex-col gap-1">
		{#each rows as row, index (row.label)}
			{@const rowLabelId = `${labelId}-${String(index)}`}
			<div class="flex min-w-0 items-center gap-2">
				<span
					id={rowLabelId}
					class="text-subtle-1 w-31 shrink-0 truncate text-xs"
				>
					{row.label}
				</span>
				<span
					role="group"
					aria-labelledby={rowLabelId}
					class="readout font-roboto-mono min-w-0"
				>
					<span class="readout-value inline-flex items-center gap-2">
						{#if row.dot}
							<StatusDot
								state={row.dot}
								label={row.text}
							/>
						{/if}
						{row.text}
					</span>
				</span>
			</div>
		{/each}
	</div>
</ApiSection>
