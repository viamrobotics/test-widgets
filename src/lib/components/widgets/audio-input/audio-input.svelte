<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import GetAudioWidget from './get-audio-widget.svelte'
	import GetPropertiesWidget from './get-properties-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-y-0">
				<GetAudioWidget
					{partID}
					{resourceName}
				/>
				<GetPropertiesWidget
					{partID}
					{resourceName}
				/>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
