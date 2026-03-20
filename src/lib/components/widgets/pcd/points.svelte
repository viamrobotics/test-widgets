<script lang="ts">
	import { T, useThrelte } from '@threlte/core'
	import { bvh } from '@threlte/extras'
	import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js'

	import PointLabel from './point-label.svelte'

	interface Props {
		data: Uint8Array
		pointSize: number
	}

	const { data, pointSize }: Props = $props()

	const { invalidate } = useThrelte()

	bvh()

	const loader = new PCDLoader()
	const points = $derived(loader.parse(new Uint8Array(data).buffer))

	$effect.pre(() => {
		const { material } = points
		material.size = pointSize
		invalidate()
	})
</script>

<T
	is={points}
	matrixAutoUpdate={false}
	matrixWorldAutoUpdate={false}
/>

<PointLabel {points} />
