<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import Push from './push.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4">
			<Push
				{partID}
				{resourceName}
			/>
		</div>
	{/snippet}
</ConnectionStatus>
