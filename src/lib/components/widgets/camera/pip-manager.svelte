<!--
	@component

	Always-mounted PiP video element. Render this once at the widgets.svelte level
	so it stays alive when individual camera cards collapse.

	Reads the PipContext created by createPipContext() in the parent script.
-->
<script lang="ts">
	import { usePipContext } from './pip-context.svelte'

	const pip = usePipContext()

	let videoElement = $state.raw<HTMLVideoElement>()

	$effect(() => {
		pip._onVideoElement(videoElement)
	})

	$effect(() => {
		if (!videoElement) return
		videoElement.addEventListener('enterpictureinpicture', pip._onEnterPip)
		videoElement.addEventListener('leavepictureinpicture', pip._onLeavePip)
		return () => {
			videoElement?.removeEventListener('enterpictureinpicture', pip._onEnterPip)
			videoElement?.removeEventListener('leavepictureinpicture', pip._onLeavePip)
		}
	})
</script>

<!-- Visually hidden but always present — required for PiP to work. -->
<video
	class="fixed right-0 bottom-0 h-px w-px opacity-[0.01]"
	bind:this={videoElement}
	muted
	autoplay
	controls={false}
	playsinline
	aria-hidden="true"

>
</video>
