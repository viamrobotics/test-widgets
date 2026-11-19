<script lang="ts">
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import { untrack } from 'svelte'

	import { createAddImageToDatasetContext, type ImageData } from '$lib/add-image-to-dataset'
	import { providePip } from '$lib/pip/context.svelte'

	import CameraControls from '../../camera-controls.svelte'

	interface Props {
		partID: string
		resourceName: string
		autoplay?: boolean
		/** Provides the app's legacy dataset context, which turns on Add to dataset. */
		onAddImage?: (imageData: ImageData) => void
	}

	const { partID, resourceName, autoplay, onAddImage }: Props = $props()

	providePip(() => partID)
	const addImageHandler = untrack(() => onAddImage)
	if (addImageHandler) createAddImageToDatasetContext(addImageHandler)
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<CameraControls
		{partID}
		{resourceName}
		{autoplay}
	/>
</QueryClientProvider>
