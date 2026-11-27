<script lang="ts">
	import { AudioOutClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import ReadoutRow from '#lib/components/ReadoutRow.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		AudioOutClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the device runs, so they are read once.
	const query = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const properties = $derived(query.data)
	const codecs = $derived(properties?.supportedCodecs ?? [])

	const codecsLabelId = $props.id()
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.AudioOutput}
	queries={[query]}
	class="grow flex-col gap-2"
>
	<div
		role="group"
		aria-label="Properties"
		class="flex flex-col gap-1"
	>
		<ReadoutRow
			label="Sample rate"
			value={properties && String(properties.sampleRateHz)}
			suffix="Hz"
		/>
		<ReadoutRow
			label="Channels"
			value={properties && String(properties.numChannels)}
		/>
	</div>
	<!-- A list, so many codecs wrap onto more lines where one readout would cut them off. -->
	<div class="flex min-w-0 items-start gap-2">
		<span
			id={codecsLabelId}
			class="text-subtle-1 w-31 shrink-0 truncate pt-1 text-xs"
		>
			Supported codecs
		</span>
		{#if codecs.length === 0}
			<span
				role="group"
				aria-labelledby={codecsLabelId}
				class="readout font-roboto-mono"
			>
				{MISSING_VALUE}
			</span>
		{:else}
			<ul
				aria-labelledby={codecsLabelId}
				class="flex min-w-0 flex-wrap gap-1"
			>
				{#each codecs as codec (codec)}
					<li class="readout font-roboto-mono">{codec}</li>
				{/each}
			</ul>
		{/if}
	</div>
</ApiSection>
