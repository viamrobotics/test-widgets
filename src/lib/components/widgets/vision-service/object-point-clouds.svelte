<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { View } from '@threlte/extras';

	import type { PointCloudObject } from '@viamrobotics/sdk';

	import GeometryDetails from './geometry-details.svelte';
	import ObjectPointCloudScene from './object-point-cloud-scene.svelte';

	interface Props {
		objects: PointCloudObject[];
	}

	const { objects }: Props = $props();

	const hashPointCloud = (data: Uint8Array): string => {
		const len = data.length;
		if (len === 0) return '0';

		// Sample bytes from start, middle, and end
		const samples = [
			data[0],
			data[Math.floor(len / 4)],
			data[Math.floor(len / 2)],
			data[Math.floor((3 * len) / 4)],
			data[len - 1]
		];

		return `${len}-${samples.join('-')}`;
	};

	interface Item {
		id: string;
		object: PointCloudObject;
		dom: HTMLElement | undefined;
	}

	const items: Item[] = $state([]);

	$effect.pre(() => {
		const itemsToRemove = new Set(items.map((item) => item.id));
		for (const object of objects) {
			const id = hashPointCloud(new Uint8Array(object.pointCloud));
			const existingItem = items.find((item) => item.id === id);
			if (existingItem) {
				existingItem.object = object;
			} else {
				items.push({ id, object, dom: undefined });
			}

			itemsToRemove.delete(id);
		}

		for (const id of itemsToRemove) {
			const index = items.findIndex((item) => item.id === id);
			if (index !== -1) {
				items.splice(index, 1);
			}
		}
	});
</script>

<div class="relative h-[600px] max-h-[80vh] bg-white">
	<div class="relative z-10 h-full overflow-y-scroll p-4">
		<div class="grid grid-cols-[repeat(auto-fit,320px)] justify-center gap-4">
			{#each items as item (item.id)}
				<div class="w-[320px] shadow-sm">
					<div
						bind:this={item.dom}
						class="h-[320px] w-[320px]"
					></div>
					<div class="bg-white p-2">
						{#if item.object.geometries}
							<GeometryDetails geometries={item.object.geometries} />
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="absolute inset-0">
		<Canvas>
			{#each items as item (item.id)}
				<View dom={item.dom}>
					<ObjectPointCloudScene object={item.object} />
				</View>
			{/each}
		</Canvas>
	</div>
</div>
