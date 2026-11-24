<script lang="ts">
	import { Canvas } from '@threlte/core'

	import RenderLoopGuard from '../../render-loop-guard.svelte'
	import FrameProbe from './frame-probe.svelte'

	interface Props {
		guarded: boolean
		counter: { frames: number; renders: number }
		throwFromFrame: number
		onError: (error: Error) => void
	}

	const { guarded, counter, throwFromFrame, onError }: Props = $props()
</script>

<div style="width: 100px; height: 100px">
	<Canvas renderMode="always">
		{#if guarded}
			<RenderLoopGuard {onError} />
		{/if}
		<FrameProbe
			{counter}
			{throwFromFrame}
		/>
	</Canvas>
</div>
