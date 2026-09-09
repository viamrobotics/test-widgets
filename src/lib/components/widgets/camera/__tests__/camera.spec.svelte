<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	import { providePip } from '$lib/pip/context.svelte'

	import Camera from '../camera.svelte'

	interface Props {
		partID: string
		resourceName: string
		autoplay?: boolean
	}

	const { partID, resourceName, autoplay }: Props = $props()

	providePip(() => partID)
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<Camera
		{partID}
		{resourceName}
		{autoplay}
	/>
</QueryClientProvider>
