<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Vector3Tuple } from 'three'

	import { Banner } from '@viamrobotics/prime-ui'
	import { Visualizer } from '@viamrobotics/visualization'
	import { MeasureTool } from '@viamrobotics/visualization/plugins/measure-tool'

	import type { MediaFitState } from '../../MediaFrame/media-fit.svelte'
	import type {
		MediaFrameAddToDataset,
		MediaFrameCapture,
	} from '../../MediaFrame/media-frame-capture'

	import MediaFrame from '../../MediaFrame/MediaFrame.svelte'
	import Download from './Download.svelte'
	import Inputs from './Inputs.svelte'
	import PointCloudView from './PointCloudView.svelte'
	import ReleaseWorldOnUnmount from './ReleaseWorldOnUnmount.svelte'
	import SceneCapture from './SceneCapture.svelte'

	interface Props {
		/** The bytes of a PCD file. `undefined` before the first cloud lands, which draws `placeholder`. */
		data: Uint8Array | undefined
		/** Names the frame, such as the host section's heading. */
		label: string
		/** Host controls placed first in the frame's controls, above Download raw data. */
		children?: Snippet
		/** From `createMediaFit` with `CANVAS_FITS`. Shows the frame's Fit select. Absent, the canvas keeps its square. */
		fit?: MediaFitState
		/** Bind it to show the frame's `Start feed automatically` checkbox, before Screenshot and Picture-in-picture. */
		startAutomatically?: boolean
		/**
		 * From `useAddToDatasetAction`. Shows the frame's Add to dataset action, which adds the PCD bytes
		 * and previews them with a capture of the scene. Ignored without a host `form`: the legacy
		 * `onAddImage` handler takes images only.
		 */
		addToDataset?: Omit<MediaFrameAddToDataset, 'capture'>
		/** With `onStart` set, `false` shows the frame's splash and draws no scene. */
		running?: boolean
		onStart?: () => void
		startLabel?: string
		/** Drawn in place of the scene until the first cloud lands, such as a progress bar. */
		placeholder?: Snippet
	}

	let {
		data,
		label,
		children,
		fit,
		startAutomatically = $bindable(),
		addToDataset,
		running = true,
		onStart,
		startLabel,
		placeholder,
	}: Props = $props()

	const PCD_MIME_TYPE = 'pointcloud/pcd'

	let up: Vector3Tuple = $state([0, 0, 1])
	let pointSize = $state(0.02)
	let container = $state<HTMLElement>()

	const handlePointSizeChange = (value: number) => {
		pointSize = value
	}

	const handleUpChange = (value: Vector3Tuple) => {
		up = value
	}

	let parseError = $state<Error>()
	// The bytes the scene shows, which trail `data` by one parse.
	let drawnData = $state.raw<Uint8Array>()

	const handleDrawn = (bytes: Uint8Array) => {
		drawnData = bytes
		parseError = undefined
	}

	const handleParseError = (error: Error) => {
		parseError = error
	}

	const findCanvas = () => container?.querySelector('canvas') ?? undefined

	let capture = $state<() => Promise<MediaFrameCapture>>()

	const screenshot = async () => {
		if (!capture) throw new Error('The point cloud has no canvas to capture')
		return capture()
	}

	const capturePointCloud = async (): Promise<MediaFrameCapture> => {
		// Read before the capture awaits, so a poll landing meanwhile cannot swap in bytes the preview does not show.
		const binaryData = drawnData
		if (!binaryData) throw new Error('No point cloud is drawn yet')
		return { binaryData, mimeType: PCD_MIME_TYPE, preview: await screenshot() }
	}

	const pointCloudDataset = $derived(
		addToDataset?.form ? { ...addToDataset, capture: capturePointCloud } : undefined
	)

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
		{#if data !== undefined && running}
			<!-- Keyboard input is off, so the embedded scene takes no shortcut from the host page. -->
			<Visualizer inputBindingsEnabled={false}>
				<PointCloudView
					{data}
					name={label}
					{pointSize}
					{up}
					ondrawn={handleDrawn}
					onerror={handleParseError}
				/>
				<SceneCapture bind:capture />
				<MeasureTool />
				<ReleaseWorldOnUnmount />
			</Visualizer>
		{:else}
			{@render placeholder?.()}
		{/if}
		{#if parseError}
			<!-- Centered, clear of the visualizer's toolbar at the top and its buttons in the corners. -->
			<div class="absolute inset-x-2 top-1/2 z-10 -translate-y-1/2">
				<Banner variant="danger">
					<Banner.Title>{parseError.message}</Banner.Title>
				</Banner>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet overlay()}
	{#if data !== undefined}
		<Inputs
			{pointSize}
			{up}
			onPointSizeChange={handlePointSizeChange}
			onUpChange={handleUpChange}
		/>
	{/if}
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
	addToDataset={pointCloudDataset}
	{fit}
	{running}
	{onStart}
	{startLabel}
	bind:startAutomatically
	children={controls}
/>
