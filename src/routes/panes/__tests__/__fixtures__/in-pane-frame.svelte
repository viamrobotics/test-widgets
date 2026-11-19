<script lang="ts">
	import '@viamrobotics/tailwind-config/fonts'

	import '../../../../app.css'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import { type PaneNode, Panes, type PaneState } from '@viamrobotics/prime-panes'

	import { providePip } from '$lib/pip/context.svelte'

	import { type ResourcePane, resourcePaneLabel } from '../../resource-pane'
	import ResourcePaneFrame from '../../resource-pane-frame.svelte'

	interface Props {
		/** The one pane to render, in the frame the playground draws around every pane. */
		paneNode: PaneNode<ResourcePane>
		partID: string
	}

	const { paneNode, partID }: Props = $props()

	// Stands in for the playground's own providers: its pip context and ViamProvider's query client.
	providePip(() => partID)
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<div
		data-testid="pane-host"
		class="h-80 w-20"
	>
		<Panes
			layout={paneNode}
			paneLabel={(node) => resourcePaneLabel(node.data)}
			class="size-full"
		>
			{#snippet pane(node: PaneNode<ResourcePane>, paneState: PaneState)}
				<ResourcePaneFrame
					{node}
					{paneState}
					{partID}
					onclose={() => {}}
				/>
			{/snippet}
		</Panes>
	</div>
</QueryClientProvider>
