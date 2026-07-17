<script lang="ts">
	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import MoveWidget from './move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<ApiSection
			title="Move"
			api="rdk:service:motion"
		>
			<MoveWidget
				{partID}
				{resourceName}
			/>
		</ApiSection>
	{/snippet}
</ConnectionStatus>
