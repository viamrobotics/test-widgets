<script lang="ts">
	import '../../../../../../app.css'

	import type { Component } from 'svelte'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	import { providePip } from '$lib/pip/context.svelte'

	interface Props {
		widget: Component<{ partID: string; resourceName: string }>
	}

	const { widget: Widget }: Props = $props()

	providePip(() => 'test-part')
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<div
		data-testid="pane"
		class="w-80"
	>
		<Widget
			partID="test-part"
			resourceName="test-slam"
		/>
	</div>
</QueryClientProvider>
