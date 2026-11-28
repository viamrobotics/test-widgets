<script lang="ts">
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'

	import ReadWritePins from './ReadWritePins.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4">
			<ReadWritePins
				{partID}
				{resourceName}
			/>
		</div>
	{/snippet}
</ConnectionStatus>
