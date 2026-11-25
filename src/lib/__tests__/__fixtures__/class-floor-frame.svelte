<script lang="ts">
	import '@viamrobotics/tailwind-config/fonts'

	import '../../../app.css'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	import type { ResourceWidget } from '$lib/resource-widget-types'

	import { providePip } from '$lib/pip/context.svelte'
	import WidgetsProvider from '$lib/widgets-provider.svelte'

	interface Props {
		/** The widget under test, rendered once below one provider. */
		component: ResourceWidget
		partID: string
		resourceName: string
		/** The box width in px, the widget's class floor. The box has no height limit. */
		width: number
	}

	const { component: Widget, partID, resourceName, width }: Props = $props()

	// Stands in for a host's own providers: its pip context and ViamProvider's query client.
	providePip(() => partID)
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<WidgetsProvider>
		<div
			data-testid="class-floor-box"
			style:width="{width}px"
		>
			<Widget
				{partID}
				{resourceName}
			/>
		</div>
	</WidgetsProvider>
</QueryClientProvider>
