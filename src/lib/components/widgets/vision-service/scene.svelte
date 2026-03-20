<script lang="ts">
	import { T } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import { Fullscreen, Image } from 'threlte-uikit';

	import { useDetections } from './context.svelte';
	import Detection from './detection.svelte';

	interface Props {
		src: string;
		factor?: number;
	}

	const { src, factor = 0 }: Props = $props();

	const context = useDetections();

	interactivity();
</script>

<T.OrthographicCamera
	makeDefault
	position={[0, 0, 1]}
>
	<Fullscreen
		positionType="relative"
		width="100%"
		height="100%"
	>
		<Image
			positionType="absolute"
			width="100%"
			height="100%"
			{src}
		/>
	</Fullscreen>

	<Fullscreen
		positionType="relative"
		width="100%"
		height="100%"
	>
		{#each context.current as detection (detection.id)}
			<Detection
				{detection}
				{factor}
			/>
		{/each}
	</Fullscreen>
</T.OrthographicCamera>
