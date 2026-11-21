<script lang="ts">
	import '../../../../../app.css'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
	import { commonApi } from '@viamrobotics/sdk'

	import { providePip } from '$lib/pip/context.svelte'

	import LiveOrPollingVideo from '../live-or-polling-video.svelte'

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
		class?: string
		videoClass?: string
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
		class: className,
		videoClass,
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
		<LiveOrPollingVideo
			{partID}
			{resourceName}
			{isLive}
			{data}
			{error}
			isLoading={false}
			refetch={() => Promise.resolve()}
			class={className}
			{videoClass}
			{showMousePositionTooltip}
			{onPollingError}
			{onStreamError}
		/>
		<div class="h-500"></div>
	</div>
</QueryClientProvider>
