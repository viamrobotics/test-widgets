<script lang="ts">
	import { Canvas } from '@threlte/core';
	import type { Vector3Tuple } from 'three';

	import Inputs from './inputs.svelte';
	import Scene from './scene.svelte';

	interface Props {
		data: Uint8Array;
	}

	const { data }: Props = $props();

	let up: Vector3Tuple = $state([0, 0, 1]);
	let pointSize = $state(0.02);

	const handlePointSizeChange = (value: number) => {
		pointSize = value;
	};

	const handleUpChange = (value: Vector3Tuple) => {
		up = value;
	};
</script>

<div class="flex h-120 gap-4">
	<Inputs
		{pointSize}
		{up}
		{data}
		onPointSizeChange={handlePointSizeChange}
		onUpChange={handleUpChange}
	/>

	<div class="relative h-full w-2/3 overflow-hidden border">
		<Canvas>
			<Scene
				{data}
				{up}
				{pointSize}
			/>
		</Canvas>
	</div>
</div>
