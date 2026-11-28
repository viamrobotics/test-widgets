<!--
@component
A Preview button that opens one segmented object in a dialog: its point cloud with its geometries
over it, in a scene the person can orbit and measure in. The scene exists only while the dialog is
open, so a long list of objects holds no more than one.
-->
<script lang="ts">
	import type { PointCloudObject } from '@viamrobotics/sdk'
	import type { Vector3Tuple } from 'three'

	import { Banner, Dialog } from '@viamrobotics/prime-ui'
	import { Visualizer } from '@viamrobotics/visualization'
	import { MeasureTool } from '@viamrobotics/visualization/plugins/measure-tool'

	import Inputs from '../PCD/Inputs.svelte'
	import ReleaseWorldOnUnmount from '../PCD/ReleaseWorldOnUnmount.svelte'
	import ObjectPointCloudsView from './ObjectPointCloudsView.svelte'

	interface Props {
		object: PointCloudObject
		/** Names the object in the button and the dialog, such as `Object 1`. */
		name: string
	}

	const { object, name }: Props = $props()

	const DEFAULT_POINT_SIZE_M = 0.02

	let isOpen = $state(false)
	let up: Vector3Tuple = $state([0, 0, 1])
	let pointSize = $state(DEFAULT_POINT_SIZE_M)
	let parseError = $state<Error>()
</script>

<Dialog bind:open={isOpen}>
	<Dialog.Trigger
		class="button button-compact"
		aria-label="Preview {name}"
	>
		Preview
	</Dialog.Trigger>
	<Dialog.Content class="flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-3 overflow-y-auto">
		<Dialog.Title class="text-heading text-base font-semibold">{name}</Dialog.Title>
		<Dialog.Description class="text-subtle-1 text-xs">
			The object's point cloud, with its geometries drawn over it.
		</Dialog.Description>

		<div class="bg-light relative aspect-square w-full overflow-hidden">
			{#if isOpen}
				<!-- Keyboard input is off, so the embedded scene takes no shortcut from the host page. -->
				<Visualizer inputBindingsEnabled={false}>
					<ObjectPointCloudsView
						objects={[object]}
						focusedIndex={undefined}
						{pointSize}
						{up}
						ondrawn={() => {
							parseError = undefined
						}}
						onerror={(error) => {
							parseError = error
						}}
					/>
					<MeasureTool />
					<ReleaseWorldOnUnmount />
				</Visualizer>
				{#if parseError}
					<!-- Centered, clear of the visualizer's toolbar at the top and its buttons in the corners. -->
					<div class="absolute inset-x-2 top-1/2 z-10 -translate-y-1/2">
						<Banner variant="danger">
							<Banner.Title>{parseError.message}</Banner.Title>
						</Banner>
					</div>
				{/if}
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
		</div>

		<div class="flex justify-end">
			<Dialog.Close class="button">Close</Dialog.Close>
		</div>
	</Dialog.Content>
</Dialog>
