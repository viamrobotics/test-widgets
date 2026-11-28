<script lang="ts">
	import '../../../../../../app.css'

	import type { MediaFit } from '#lib/components/MediaFrame/media-fit.js'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import { createAddImageToDatasetContext, type ImageData } from '#lib/add-image-to-dataset.js'
	import { providePip } from '#lib/pip/context.svelte.js'
	import { untrack } from 'svelte'

	import CameraControls from '../../CameraControls.svelte'

	interface Props {
		partID: string
		resourceName: string
		autoplay?: boolean
		widthPx?: number
		heightPx?: number
		defaultFit?: MediaFit
		/** Provides the app's legacy dataset context, which turns on Add to dataset. */
		onAddImage?: (imageData: ImageData) => void
	}

	const { partID, resourceName, autoplay, widthPx, heightPx, defaultFit, onAddImage }: Props =
		$props()

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
		{widthPx}
		{heightPx}
		{defaultFit}
	/>
</QueryClientProvider>
