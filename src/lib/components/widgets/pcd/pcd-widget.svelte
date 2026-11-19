<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Vector3Tuple } from 'three'

	import { Canvas } from '@threlte/core'

	import type { MediaFrameCapture } from '../../media-frame/media-frame-capture'

	import MediaFrame from '../../media-frame/media-frame.svelte'
	import Download from './download.svelte'
	import Inputs from './inputs.svelte'
	import Scene from './scene.svelte'

	interface Props {
		data: Uint8Array
		/** Names the frame, such as the host section's heading. */
		label: string
		/** Host controls placed first in the frame's controls, above Download raw data. */
		children?: Snippet
	}

	const { data, label, children }: Props = $props()

	let up: Vector3Tuple = $state([0, 0, 1])
	let pointSize = $state(0.02)
	let container = $state<HTMLElement>()

	const handlePointSizeChange = (value: number) => {
		pointSize = value
	}

	const handleUpChange = (value: Vector3Tuple) => {
		up = value
	}

	const findCanvas = () => container?.querySelector('canvas') ?? undefined

	let capture = $state<() => Promise<MediaFrameCapture>>()

	const screenshot = async () => {
		if (!capture) throw new Error('The point cloud has no canvas to capture')
		return capture()
	}

	const pictureInPicture = $derived({
		key: `${label}-point-cloud`,
		stream: () => findCanvas()?.captureStream(),
	})
</script>

{#snippet media()}
	<div
		class="absolute inset-0"
		bind:this={container}
	>
		<Canvas>
			<Scene
				{data}
				{up}
				{pointSize}
				bind:capture
			/>
		</Canvas>
	</div>
{/snippet}

{#snippet overlay()}
	<Inputs
		{pointSize}
		{up}
		onPointSizeChange={handlePointSizeChange}
		onUpChange={handleUpChange}
	/>
{/snippet}

{#snippet controls()}
	{@render children?.()}
	<div>
		<Download {data} />
	</div>
{/snippet}

<MediaFrame
	{label}
	{media}
	{overlay}
	aspectRatio="1 / 1"
	{screenshot}
	{pictureInPicture}
	children={controls}
/>
