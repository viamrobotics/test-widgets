<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { Camera, type Intersection, Plane, Vector3 } from 'three';

	import {
		useMapLibre,
		useMapLibreThreeRaycast,
		useMapLibreThreeRenderer
	} from '$lib/components/maplibre';

	interface Props {
		view: '2D' | '3D';
		children?: import('svelte').Snippet;
	}

	const { view, children }: Props = $props();

	const { map } = useMapLibre();
	const { scene, camera, renderer } = $state(useThrelte());

	camera.set(new Camera());

	const { pointer, compute } = useMapLibreThreeRaycast(camera);

	interactivity({
		target: map.getCanvas(),
		filter: (hits: Intersection[]) => {
			// Only return the first hit
			return hits.slice(0, 1);
		},
		compute: (_, state) => {
			state.pointer.update((vec2) => {
				vec2.copy(pointer);
				return vec2;
			});

			compute(state.raycaster);
		}
	});

	useMapLibreThreeRenderer(scene, camera, () => {
		renderer.render(scene, camera.current);
	});

	const clippingPlane = new Plane(new Vector3(0, 1, 0), 0);

	$effect.pre(() => {
		renderer.clippingPlanes = view === '2D' ? [] : [clippingPlane];
	});
</script>

<T.AmbientLight intensity={view === '2D' ? 2 : 1.5} />

{#if view === '3D'}
	<T.DirectionalLight />
{/if}

{@render children?.()}
