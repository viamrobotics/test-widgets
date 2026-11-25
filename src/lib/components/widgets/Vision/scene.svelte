<script lang="ts">
	import { T } from '@threlte/core'
	import { interactivity } from '@threlte/extras'
	import { Fullscreen } from 'threlte-uikit'

	import { useDetections } from './context.svelte'
	import Detection from './detection.svelte'

	interface Props {
		factor?: number
	}

	const { factor = 0 }: Props = $props()

	const context = useDetections()

	interactivity()
</script>

<T.OrthographicCamera
	makeDefault
	position={[0, 0, 1]}
>
	<Fullscreen>
		{#each context.current as detection (detection.id)}
			<Detection
				{detection}
				{factor}
			/>
		{/each}
	</Fullscreen>
</T.OrthographicCamera>
