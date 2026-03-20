<script lang="ts">
	import type { Writable } from 'svelte/store'

	import { Button } from '@viamrobotics/prime-core'
	import { onMount } from 'svelte'

	import ErrorDisplay from '$lib/components/error.svelte'

	interface Props {
		resourceName: string
		mediaStream: MediaStream | null
		isShowingPip: Writable<boolean>
	}

	const { resourceName, mediaStream, isShowingPip }: Props = $props()

	let videoElement = $state.raw<HTMLVideoElement>()
	let lastErr = $state.raw<Error>()

	const onEnter = () => {
		$isShowingPip = true
	}
	const onLeave = () => {
		$isShowingPip = false
	}

	onMount(() => {
		videoElement?.addEventListener('enterpictureinpicture', onEnter)
		videoElement?.addEventListener('leavepictureinpicture', onLeave)

		return () => {
			videoElement?.removeEventListener('enterpictureinpicture', onEnter)
			videoElement?.removeEventListener('leavepictureinpicture', onLeave)
			if ($isShowingPip) {
				document.exitPictureInPicture()
			}
		}
	})

	$effect.pre(() => {
		if (videoElement) {
			videoElement.srcObject = mediaStream
		}
	})

	const togglePictureInPicture = async () => {
		lastErr = undefined

		try {
			await ($isShowingPip
				? document.exitPictureInPicture()
				: videoElement?.requestPictureInPicture())
		} catch (error) {
			lastErr = error as Error
		}
	}
</script>

<Button
	icon="picture-in-picture-top-right"
	onclick={togglePictureInPicture}
>
	Toggle picture-in-picture
</Button>

<!-- Display a fixed video element on the page but essentially hide it.
  There must always be a video element visible for PiP. -->
<video
	class="fixed right-0 bottom-0 h-px w-px opacity-[0.01]"
	bind:this={videoElement}
	muted
	autoplay
	controls={false}
	playsinline
	aria-label={`${resourceName} picture-in-picture stream`}
></video>

<ErrorDisplay
	class="max-w-50"
	lastError={lastErr}
/>
