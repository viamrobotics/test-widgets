<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import InferWidget from './infer-widget.svelte'
	import MetadataWidget from './metadata-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<MetadataWidget
			{partID}
			{resourceName}
		/>
		<InferWidget
			{partID}
			{resourceName}
		/>
	{/snippet}
</ConnectionStatus>
