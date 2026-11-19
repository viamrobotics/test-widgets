<script lang="ts">
	import { AudioInClient } from '@viamrobotics/sdk'
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
		AudioInClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the device runs, so they are read once.
	const query = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const properties = $derived(query.data)

	const codecsText = $derived(
		properties === undefined || properties.supportedCodecs.length === 0
			? MISSING_VALUE
			: properties.supportedCodecs.join(', ')
	)
	const sampleRateText = $derived(
		properties === undefined ? MISSING_VALUE : String(properties.sampleRateHz)
	)
	const channelsText = $derived(
		properties === undefined ? MISSING_VALUE : String(properties.numChannels)
	)
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.AudioInput}
	queries={[query]}
	class="grow flex-col gap-2"
>
	<div
		role="group"
		aria-label="Properties"
		class="flex flex-col gap-1"
	>
		<div class="flex min-w-0 items-center gap-2">
			<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">Sample rate</span>
			<span class="readout font-roboto-mono">
				<span class="readout-value">{sampleRateText}</span>
				{#if properties !== undefined}
					<span class="readout-suffix">Hz</span>
				{/if}
			</span>
		</div>
		<div class="flex min-w-0 items-center gap-2">
			<span class="text-subtle-1 w-31 shrink-0 truncate text-xs">Channels</span>
			<span class="readout font-roboto-mono">
				<span class="readout-value">{channelsText}</span>
			</span>
		</div>
	</div>
	<p class="text-subtle-2 text-xs">Supported codecs: {codecsText}</p>
</ApiSection>
