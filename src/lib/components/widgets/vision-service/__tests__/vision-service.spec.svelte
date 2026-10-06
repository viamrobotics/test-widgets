<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	import {
		createResourceDependenciesContext,
		type GetResourceDependencies,
	} from '$lib/resource-dependencies'

	import VisionService from '../vision-service.svelte'

	interface Props {
		partID: string
		resourceName: string
		getDependencies?: GetResourceDependencies
	}

	const { partID, resourceName, getDependencies }: Props = $props()

	// svelte-ignore state_referenced_locally
	if (getDependencies) {
		createResourceDependenciesContext(getDependencies)
	}

	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<VisionService
		{partID}
		{resourceName}
	/>
</QueryClientProvider>
