<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import GetPropertiesWidget from './get-properties-widget.svelte'
	import PlayStreamWidget from './play-stream-widget.svelte'
	import PlayWidget from './play-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="Mutators"
					class="grid grid-cols-1 divide-y"
				>
					<PlayWidget
						{partID}
						{resourceName}
					/>
					<PlayStreamWidget
						{partID}
						{resourceName}
					/>
				</div>
				<div
					role="group"
					aria-label="Queries"
					class="grid grid-cols-1 divide-y"
				>
					<GetPropertiesWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
