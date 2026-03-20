<!--
  @component
  Renders a 2d pointcloud from a top-down perspective.
  The pointcloud exists on the xy axis, with the camera set at z=1.
  Has the ability to also render other environmental features,
  such as the pose of a base and / or a motion plan.

  ```svelte
  <SlamMap2d
    pointcloud={new Uint8Array()} // An arraybuffer representing a PCD file.
    basePose={{ x: number, y: number, z: number }} // An optional pose of a robot.
    destination={{ x: number, y: number }} // An optional user-specificed robot destination.
    helpers={true | false} // Whether or not scene helpers should be rendered. Default true.
    motionPath={new Float32Array(x1, y1, x2, y2, x3, y3])} // An optional motion path. Units are assumed to be in Meters. Must not contain NaN.
  />
  ```
-->
<script lang="ts">
	import { Canvas } from '@threlte/core';
	import type { Vector2, Vector3 } from 'three';

	import Legend from './legend.svelte';
	import Scene from './scene.svelte';

	interface Props {
		/** A buffer representing a .pcd file */
		pointcloud?: Uint8Array | undefined;
		/** The pose of the base of the robot */
		basePose?: { x: number; y: number; theta: number } | undefined;
		/** A user-specificed robot destination */
		destination?: Vector2 | undefined;
		/** Whether or not scene helpers should be rendered */
		helpers?: boolean;
		/** An optional motion path */
		motionPath?: Float32Array | undefined;
		onClick: (value: Vector3) => void;
	}

	const {
		pointcloud,
		basePose,
		destination,
		helpers = true,
		motionPath,
		onClick
	}: Props = $props();
</script>

<div class="relative h-full w-full">
	<Canvas>
		<Scene
			{helpers}
			{pointcloud}
			{basePose}
			{destination}
			{motionPath}
			{onClick}
		/>
	</Canvas>

	{#if helpers}
		<p class="absolute top-3 left-3 bg-white text-xs">Grid set to 1 meter</p>
	{/if}

	<Legend />
</div>
