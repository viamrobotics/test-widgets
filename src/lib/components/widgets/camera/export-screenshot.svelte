<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { CameraClient } from '@viamrobotics/sdk'

	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

	import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'
	import { pickImageForSource } from './pick-image-for-source'

	interface Props {
		name: string
		sourceName?: string
		getImage: () => Promise<QueryObserverResult<Awaited<ReturnType<CameraClient['getImages']>>>>
	}

	const { name, sourceName = '', getImage }: Props = $props()

	let lastError = $state<Error>()

	// en-CA for iso formatting (better for filename sorting)
	const dateFormatter = new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})

	// Formats as 2024-06-27_12_30_45 to get filename sorting.
	// Intl.DateTimeFormat puts spaces in the resulting string when hours are included
	// (bad for filenames))
	// This should not change much so it is simple enough to live within this component
	const getDateString = () => {
		return dateFormatter.format(new Date()).split(', ').join('_')
	}

	const handleExport = async () => {
		const image = await getImage()
		if (image.error) {
			lastError = image.error
			return
		}

		lastError = undefined
		const matchingImage = pickImageForSource(image.data?.images, sourceName)
		if (!matchingImage?.image) {
			return
		}

		const bytes = new Uint8Array(matchingImage.image)
		let blob: Blob
		let ext: string

		if (matchingImage.mimeType === VIAM_DEPTH_MIME_TYPE) {
			// Decode depth frames to a viewable PNG so the exported file matches the live feed.
			const depthBlob = await getBlobForViamDepth(bytes)
			if (!depthBlob) {
				lastError = new Error('Failed to decode depth image')
				return
			}
			blob = depthBlob
			ext = 'png'
		} else {
			blob = new Blob([bytes], { type: matchingImage.mimeType || 'image/jpeg' })
			ext = 'jpeg'
		}

		const exportFilename = `${name}-${getDateString()}.${ext}`
		const link = document.createElement('a')
		const dataUrl = URL.createObjectURL(blob)
		link.href = dataUrl
		link.download = exportFilename
		link.click()
		URL.revokeObjectURL(dataUrl)
	}
</script>

<div class="flex flex-col items-start gap-1">
	<Button
		icon="camera-outline"
		onclick={handleExport}
	>
		Screenshot
	</Button>
	<ErrorDisplay
		class="max-w-50"
		{lastError}
	/>
</div>
