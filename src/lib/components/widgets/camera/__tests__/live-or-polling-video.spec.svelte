<script lang="ts">
	import '../../../../../app.css'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	import { providePip } from '$lib/pip/context.svelte'

	import LiveOrPollingVideo from '../live-or-polling-video.svelte'

	interface Props {
		partID: string
		resourceName: string
		error: Error
	}

	const { partID, resourceName, error }: Props = $props()

	providePip(() => partID)
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<div
		data-testid="scroller"
		class="h-50 overflow-auto"
	>
		<LiveOrPollingVideo
			{partID}
			{resourceName}
			isLive={false}
			data={undefined}
			{error}
			isLoading={false}
			refetch={() => Promise.resolve()}
		/>
		<div class="h-500"></div>
	</div>
</QueryClientProvider>
