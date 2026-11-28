<script lang="ts">
	import { mdiPictureInPictureTopRight } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { usePip } from '#lib/pip/context.svelte.js'

	import type { MediaFramePictureInPicture } from './media-frame-capture'

	import HeldBack from '../HeldBack.svelte'
	import { toError } from './to-error'
	import { useReportedError } from './use-reported-error.svelte'

	interface Props {
		pictureInPicture: MediaFramePictureInPicture
		/** Why the action will not run, such as while the frame shows its splash. */
		blockedReason?: string
	}

	const { pictureInPicture, blockedReason }: Props = $props()

	const pip = usePip()

	const isLoading = $derived(
		pip.readyState === 'loading' && pip.resourceName === pictureInPicture.key
	)

	let pictureInPictureError = $state<Error | null>(null)

	useReportedError(() => pictureInPictureError)

	const heldBackReason = $derived(
		blockedReason ?? (isLoading ? 'Wait for picture-in-picture to finish loading.' : undefined)
	)

	const togglePictureInPicture = async () => {
		if (heldBackReason !== undefined) return
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

<HeldBack reason={heldBackReason}>
	{#snippet children(heldBack)}
		<button
			type="button"
			class="button button-xs"
			{...heldBack}
			onclick={togglePictureInPicture}
		>
			<Icon
				icon={mdiPictureInPictureTopRight}
				size="sm"
			/>
			Picture-in-picture
		</button>
	{/snippet}
</HeldBack>
<span
	class="sr-only"
	role="status"
>
	{isLoading ? 'Loading picture-in-picture' : ''}
</span>
