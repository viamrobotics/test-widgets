<script lang="ts">
	import { Canvas } from '@threlte/core';

	import type { GeoGeometry } from '@viamrobotics/sdk';

	import Meshes from './meshes.svelte';
	import Scene from './scene.svelte';

	interface Props {
		obstacles: GeoGeometry[];
		hovered: string | null;
		setHovered: (_: string | null) => void;
		view: '2D' | '3D';
	}

	const { obstacles, hovered, setHovered, view }: Props = $props();
</script>

<div class="pointer-events-none absolute top-0 left-0 h-full w-full">
	<Canvas autoRender={false}>
		<Scene {view}>
			<Meshes
				{obstacles}
				{hovered}
				{setHovered}
				{view}
			/>
		</Scene>
	</Canvas>
</div>
