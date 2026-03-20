<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { Color } from 'three';
	import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';
	import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

	import type { PointCloudObject } from '@viamrobotics/sdk';

	interface Props {
		object: PointCloudObject;
	}

	const { object }: Props = $props();

	const { scene, invalidate } = useThrelte();
	scene.background = new Color(0xe0_e0_e0);

	const loader = new PCDLoader();

	let controlsRef = $state<OrbitControlsType>();

	const points = $derived.by(() => {
		const dataCopy = new Uint8Array(object.pointCloud);
		return loader.parse(dataCopy.buffer);
	});

	const boundingInfo = $derived.by(() => {
		if (!points) return undefined;

		points.geometry.computeBoundingSphere();
		const sphere = points.geometry.boundingSphere;
		if (!sphere) return undefined;

		return {
			center: sphere.center.clone(),
			distance: sphere.radius * 2.5
		};
	});

	const cameraPosition = $derived.by((): [number, number, number] => {
		if (!boundingInfo) return [0, 0, 2];
		const { center, distance } = boundingInfo;
		return [center.x, center.y, center.z + distance];
	});

	$effect(() => {
		if (controlsRef && boundingInfo) {
			controlsRef.target.copy(boundingInfo.center);
			controlsRef.update();
			invalidate();
		}
	});
</script>

<T.PerspectiveCamera
	makeDefault
	position={cameraPosition}
	fov={50}
	near={0.001}
	far={1000}
>
	<OrbitControls bind:ref={controlsRef} />
</T.PerspectiveCamera>

<T.HemisphereLight args={[0xaa_aa_aa, 0x44_44_44, 3]} />
<T.DirectionalLight
	args={[0xff_ff_ff, 1.5]}
	position={[1, 1, 1]}
/>

{#if points}
	<T is={points} />
{/if}
