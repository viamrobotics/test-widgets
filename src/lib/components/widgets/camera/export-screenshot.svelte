<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { CameraClient } from '@viamrobotics/sdk'

	import { Button } from '@viamrobotics/prime-core'

	import ErrorDisplay from '$lib/components/error.svelte'

	interface Props {
		name: string
		getImage: () => Promise<QueryObserverResult<Awaited<ReturnType<CameraClient['getImages']>>>>
	}

	const { name, getImage }: Props = $props()

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
		if (image.data?.images?.[0]?.image) {
			const imageBlob = new Blob([new Uint8Array(image.data.images[0].image)], {
				type: image.data.images[0].mimeType || 'image/jpeg',
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
