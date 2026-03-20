<script lang="ts">
	import { Canvas } from '@threlte/core'

	import type { Obstacle } from '../types'

	import Scene from './scene.svelte'

	interface Props {
		onUpdate: (payload: Obstacle[]) => void
	}

	const { onUpdate }: Props = $props()
</script>

<div class="pointer-events-none absolute right-0 bottom-0 h-full w-full">
	<Canvas
		autoRender={false}
		renderMode="always"
	>
		<Scene {onUpdate} />
	</Canvas>
</div>
