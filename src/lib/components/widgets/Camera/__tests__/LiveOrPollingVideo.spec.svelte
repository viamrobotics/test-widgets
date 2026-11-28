<script lang="ts">
	import '../../../../../app.css'

	import type { MediaFit } from '#lib/components/MediaFrame/media-fit.js'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import { commonApi } from '@viamrobotics/sdk'
	import { providePip } from '#lib/pip/context.svelte.js'

	import LiveOrPollingVideo from '../LiveOrPollingVideo.svelte'

	interface PolledImage {
		sourceName: string
		mimeType: string
		image: Uint8Array
	}

	interface Props {
		partID: string
		resourceName: string
		error?: Error
		isLive?: boolean
		/** The last polled GetImages response's images. */
		images?: PolledImage[]
		fit?: MediaFit
		/** Classes for a box around the video, to give it a size. */
		boxClass?: string
		showMousePositionTooltip?: boolean
		onPollingError?: (error: Error | undefined) => void
		onStreamError?: (error: Error) => void
	}

	const {
		partID,
		resourceName,
		error,
		isLive = false,
		images,
		fit = 'keep-ratio',
		boxClass,
		showMousePositionTooltip,
		onPollingError,
		onStreamError,
	}: Props = $props()

	const { capturedAt } = new commonApi.ResponseMetadata({ capturedAt: {} })
	const data = $derived(images && capturedAt ? { images, metadata: { capturedAt } } : undefined)

	providePip(() => partID)
	const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
	<div
		data-testid="scroller"
		class="h-50 overflow-auto"
	>
		<div class={boxClass}>
			<LiveOrPollingVideo
				{partID}
				{resourceName}
				{isLive}
				{data}
				{error}
				isLoading={false}
				refetch={() => Promise.resolve()}
				{fit}
				{showMousePositionTooltip}
				{onPollingError}
				{onStreamError}
			/>
		</div>
		<div class="h-500"></div>
	</div>
</QueryClientProvider>
