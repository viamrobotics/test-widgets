<script lang="ts">
	import { navigationApi, NavigationClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the service runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const mapTypeLabels: Record<navigationApi.MapType, string> = {
		[navigationApi.MapType.UNSPECIFIED]: MISSING_VALUE,
		[navigationApi.MapType.NONE]: 'None',
		[navigationApi.MapType.GPS]: 'GPS',
	}

	const mapTypeText = $derived(
		propertiesQuery.data === undefined
			? MISSING_VALUE
			: (mapTypeLabels[propertiesQuery.data.mapType] ?? MISSING_VALUE)
	)

	const mapTypeLabelId = $props.id()
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Navigation}
	queries={[propertiesQuery]}
	class="grow flex-col gap-2"
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={mapTypeLabelId}
			class="text-subtle-1 truncate text-xs"
		>
			Map type
		</span>
		<span
			role="group"
			aria-labelledby={mapTypeLabelId}
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{mapTypeText}</span>
		</span>
	</div>
</ApiSection>
