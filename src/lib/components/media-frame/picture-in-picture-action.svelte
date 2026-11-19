<script lang="ts">
	import { mdiPictureInPictureTopRight } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'

	import { usePip } from '$lib/pip/context.svelte'

	import type { MediaFramePictureInPicture } from './media-frame-capture'

	import { toError } from './to-error'
	import { useReportedError } from './use-reported-error.svelte'

	interface Props {
		pictureInPicture: MediaFramePictureInPicture
		disabled?: boolean
	}

	const { pictureInPicture, disabled = false }: Props = $props()

	const pip = usePip()

	const isLoading = $derived(
		pip.readyState === 'loading' && pip.resourceName === pictureInPicture.key
	)

	let pictureInPictureError = $state<Error | null>(null)

	useReportedError(() => pictureInPictureError)

	const togglePictureInPicture = async () => {
		const { key, stream } = pictureInPicture
		try {
			if (stream) pip.setStream(key, stream() ?? null)
			await pip.toggle(key)
			pictureInPictureError = pip.error ?? null
		} catch (error) {
			pictureInPictureError = toError(error)
		}
	}
</script>

<button
	type="button"
	class="button button-xs"
	{disabled}
	aria-busy={isLoading}
	onclick={togglePictureInPicture}
>
	<Icon
		icon={mdiPictureInPictureTopRight}
		size="sm"
	/>
	Picture-in-picture
</button>
<span
	class="sr-only"
	role="status"
>
	{isLoading ? 'Loading picture-in-picture' : ''}
</span>
