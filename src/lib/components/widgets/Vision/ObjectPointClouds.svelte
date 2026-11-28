<!--
@component
Draws the objects a vision service segmented in one scene: every object's point cloud with its
geometries over it, on the camera's whole cloud when the host has it. The View select shows one
object alone, and All objects brings the rest back. The objects' values are listed below the scene.
-->
<script lang="ts">
	import type { PointCloudObject } from '@viamrobotics/sdk'
	import type { MediaFrameCapture } from '#lib/components/MediaFrame/media-frame-capture.js'
	import type { Snippet } from 'svelte'
	import type { Vector3Tuple } from 'three'

	import { Select } from '@viamrobotics/prime-controls'
	import { Banner } from '@viamrobotics/prime-ui'
	import { Visualizer } from '@viamrobotics/visualization'
	import { MeasureTool } from '@viamrobotics/visualization/plugins/measure-tool'
	import MediaFrame from '#lib/components/MediaFrame/MediaFrame.svelte'

	import Inputs from '../PCD/Inputs.svelte'
	import ReleaseWorldOnUnmount from '../PCD/ReleaseWorldOnUnmount.svelte'
	import SceneCapture from '../PCD/SceneCapture.svelte'
	import ObjectList from './ObjectList.svelte'
	import ObjectPointCloudsView from './ObjectPointCloudsView.svelte'

	interface Props {
		/** `undefined` before the first response, which draws `placeholder` in the frame. */
		objects: PointCloudObject[] | undefined
		/** The bytes of the PCD the objects were cut from, drawn dimmed behind them. */
		backdrop?: Uint8Array
		/** Names the frame, such as the host section's heading. */
		label: string
		/** Host controls placed in the frame's controls, after the View select. */
		children?: Snippet
		/** Bind it to show the frame's `Start feed automatically` checkbox. */
		startAutomatically?: boolean
		/** With `onStart` set, `false` shows the frame's splash and draws no scene. */
		running?: boolean
		onStart?: () => void
		startLabel?: string
		/** Drawn in place of the scene until the first response, such as a progress bar. */
		placeholder?: Snippet
	}

	let {
		objects,
		backdrop,
		label,
		children,
		startAutomatically = $bindable(),
		running = true,
		onStart,
		startLabel,
		placeholder,
	}: Props = $props()

	const ALL_OBJECTS = 'all'
	const DEFAULT_POINT_SIZE_M = 0.02

	const objectName = (index: number) => `Object ${String(index + 1)}`

	let up: Vector3Tuple = $state([0, 0, 1])
	let pointSize = $state(DEFAULT_POINT_SIZE_M)

	let pickedIndex = $state<number>()
	// A refetch can return fewer objects than the one in focus.
	const focusedIndex = $derived(
		pickedIndex !== undefined && pickedIndex < (objects?.length ?? 0) ? pickedIndex : undefined
	)

	const viewItems = $derived([
		{ value: ALL_OBJECTS, label: 'All objects' },
		...(objects ?? []).map((_, index) => ({ value: String(index), label: objectName(index) })),
	])

	const getView = () => (focusedIndex === undefined ? ALL_OBJECTS : String(focusedIndex))
	const setView = (next: string | undefined) => {
		if (next === undefined) return
		pickedIndex = next === ALL_OBJECTS ? undefined : Number(next)
	}

	// Kept with the objects it was raised for, so the next response starts without it.
	let parseFailure = $state.raw<{ error: Error; objects: PointCloudObject[] | undefined }>()
	const shownParseError = $derived(
		parseFailure !== undefined && parseFailure.objects === objects ? parseFailure.error : undefined
	)

	let capture = $state<() => Promise<MediaFrameCapture>>()

	const screenshot = async () => {
		if (!capture) throw new Error('The object point clouds have no canvas to capture')
		return capture()
	}

	const hasObjects = $derived(objects !== undefined && objects.length > 0)

	const id = $props.id()
</script>

{#snippet media()}
	<div class="absolute inset-0">
		{#if objects !== undefined && objects.length > 0 && running}
			<!-- Keyboard input is off, so the embedded scene takes no shortcut from the host page. -->
			<Visualizer inputBindingsEnabled={false}>
				<ObjectPointCloudsView
					{objects}
					{focusedIndex}
					{backdrop}
					{pointSize}
					{up}
					ondrawn={() => {
						parseFailure = undefined
					}}
					onerror={(error) => {
						parseFailure = { error, objects }
					}}
				/>
				<SceneCapture bind:capture />
				<MeasureTool />
				<ReleaseWorldOnUnmount />
			</Visualizer>
			{#if shownParseError}
				<!-- Centered, clear of the visualizer's toolbar at the top and its buttons in the corners. -->
				<div class="absolute inset-x-2 top-1/2 z-10 -translate-y-1/2">
					<Banner variant="danger">
						<Banner.Title>{shownParseError.message}</Banner.Title>
					</Banner>
				</div>
			{/if}
		{:else if objects === undefined}
			{@render placeholder?.()}
		{:else if running}
			<p class="text-subtle-2 grid size-full place-content-center p-2 text-xs">
				The service returned no objects.
			</p>
		{/if}
	</div>
{/snippet}

{#snippet overlay()}
	{#if hasObjects}
		<Inputs
			{pointSize}
			{up}
			onPointSizeChange={(value) => {
				pointSize = value
			}}
			onUpChange={(value) => {
				up = value
			}}
		/>
	{/if}
{/snippet}

{#snippet controls()}
	{#if hasObjects}
		<div class="flex max-w-60 items-center gap-2">
			<span
				id="{id}-view"
				class="text-subtle-1 shrink-0 text-xs"
			>
				View
			</span>
			<Select
				items={viewItems}
				aria-labelledby="{id}-view"
				bind:value={getView, setView}
			/>
		</div>
	{/if}
	{@render children?.()}
{/snippet}

<div class="flex min-w-0 flex-col gap-2">
	<MediaFrame
		{label}
		{media}
		{overlay}
		aspectRatio="1 / 1"
		{screenshot}
		{running}
		{onStart}
		{startLabel}
		bind:startAutomatically
		children={controls}
	/>

	{#if objects !== undefined && objects.length > 0}
		<div class="px-2">
			<ObjectList
				{objects}
				withPreview={false}
			/>
		</div>
	{/if}
</div>
