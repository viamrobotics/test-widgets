<script lang="ts">
	import type { PointCloudObject } from '@viamrobotics/sdk'

	import { Canvas } from '@threlte/core'
	import { View } from '@threlte/extras'

	import type { MediaFrameCapture } from '$lib/components/media-frame/media-frame-capture'

	import MediaFrame from '$lib/components/media-frame/media-frame.svelte'

	import GeometryDetails from './geometry-details.svelte'
	import ObjectPointCloudScene from './object-point-cloud-scene.svelte'

	interface Props {
		objects: PointCloudObject[]
		/**
		 * Puts each view in a `MediaFrame` with a heading and Screenshot. Off for a host that frames
		 * the clouds itself.
		 */
		isFramed?: boolean
	}

	const { objects, isFramed = false }: Props = $props()

	const hashPointCloud = (data: Uint8Array): string => {
		const len = data.length
		if (len === 0) return '0'

		// Sample bytes from start, middle, and end
		const samples = [
			data[0],
			data[Math.floor(len / 4)],
			data[Math.floor(len / 2)],
			data[Math.floor((3 * len) / 4)],
			data[len - 1],
		]

		return `${len}-${samples.join('-')}`
	}

	interface Item {
		id: string
		object: PointCloudObject
	}

	// Keyed by the cloud's hash, so a refetch of the same cloud keeps its view. Objects whose clouds
	// hash alike share one view.
	const items = $derived.by((): Item[] => {
		const all = objects.map((object) => ({
			id: hashPointCloud(new Uint8Array(object.pointCloud)),
			object,
		}))
		return all.filter((item, index) => all.findIndex((other) => other.id === item.id) === index)
	})

	const cellsById: Record<string, HTMLElement | undefined> = $state({})
	// A view's Screenshot shows only once its scene has mounted in the shared canvas and set its capture.
	const capturesById: Record<string, (() => Promise<MediaFrameCapture>) | undefined> = $state({})

	const headingId = $props.id()
</script>

{#snippet cell(id: string)}
	<div
		bind:this={cellsById[id]}
		data-testid="object-point-cloud-cell"
		class="aspect-square w-full"
	></div>
{/snippet}

{#snippet geometries(object: PointCloudObject)}
	{#if object.geometries}
		<GeometryDetails geometries={object.geometries} />
	{/if}
{/snippet}

<div class="@container relative">
	<div class="relative z-10 grid grid-cols-1 gap-4 @2xl:grid-cols-2">
		{#each items as item, index (item.id)}
			{#if isFramed}
				{@const title = `Object ${String(index + 1)}`}
				<section
					aria-labelledby="{headingId}-{item.id}"
					class="flex min-w-0 flex-col gap-2"
				>
					<h4
						id="{headingId}-{item.id}"
						class="text-xs font-semibold"
					>
						{title}
					</h4>
					<MediaFrame
						label="{title} point cloud"
						aspectRatio="1 / 1"
						screenshot={capturesById[item.id]}
					>
						{#snippet media()}
							{@render cell(item.id)}
						{/snippet}
					</MediaFrame>
					{@render geometries(item.object)}
				</section>
			{:else}
				<div class="flex min-w-0 flex-col gap-2">
					{@render cell(item.id)}
					{@render geometries(item.object)}
				</div>
			{/if}
		{/each}
	</div>

	<div class="absolute inset-0">
		<Canvas>
			{#each items as item (item.id)}
				<View dom={cellsById[item.id]}>
					<ObjectPointCloudScene
						object={item.object}
						bind:capture={capturesById[item.id]}
					/>
				</View>
			{/each}
		</Canvas>
	</div>
</div>
