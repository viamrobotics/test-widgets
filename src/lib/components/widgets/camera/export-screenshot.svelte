<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { CameraClient } from '@viamrobotics/sdk'

	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

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
		const exportFilename = `${name}-${getDateString()}.jpeg`
		const image = await getImage()
		if (image.error) {
			lastError = image.error
			return
		}

		lastError = undefined
		const matchingImage = pickImageForSource(image.data?.images, sourceName)
		if (matchingImage?.image) {
			const imageBlob = new Blob([new Uint8Array(matchingImage.image)], {
				type: matchingImage.mimeType || 'image/jpeg',
			})

			const link = document.createElement('a')
			const dataUrl = URL.createObjectURL(imageBlob)
			link.href = dataUrl
			link.download = exportFilename
			link.click()
			URL.revokeObjectURL(dataUrl)
		}
	}
</script>

<Button
	icon="camera-outline"
	onclick={handleExport}>Export screenshot</Button
>
<ErrorDisplay
	class="max-w-50"
	{lastError}
/>
