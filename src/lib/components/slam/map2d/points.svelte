<!--
  @component
  Renders Points from a .pcd file.
  Creates an invisible plane mesh with dimensions matching the diameter of
  the points' bounding sphere.
  Emits click events that intersect this plane.
-->
<script lang="ts">
	import { T } from '@threlte/core';
	import { BufferAttribute } from 'three';
	import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

	import { mapColorAttributeGrayscale } from './color-map';
	import { renderOrder } from './render-order';

	interface Props {
		/** A buffer representing a .pcd file */
		pointcloud: Uint8Array;
		/** The size of each individual point */
		size: number;
		/** Dispatched whenever a new .pcd file is parsed. Emits the radius and center of the cloud's bounding sphere. */
		onUpdate: (payload: { radius: number; center: { x: number; y: number } }) => void;
	}

	const { pointcloud, size, onUpdate }: Props = $props();

	const loader = new PCDLoader();

	const points = $derived(loader.parse(pointcloud.buffer as ArrayBuffer));
</script>

{#if points}
	<T
		is={points}
		renderOrder={renderOrder.points}
		frustumCulled={false}
		oncreate={(ref) => {
			const { color } = ref.geometry.attributes;

			if (color instanceof BufferAttribute) {
				mapColorAttributeGrayscale(color);
			}

			ref.geometry.computeBoundingSphere();
			const { boundingSphere } = ref.geometry;

			if (boundingSphere !== null) {
				const radius = boundingSphere.radius;
				const center = boundingSphere.center;
				onUpdate({ center, radius });
			}
		}}
	>
		<T
			is={points.material}
			{size}
			sizeAttenuation={false}
		/>
	</T>
{/if}
