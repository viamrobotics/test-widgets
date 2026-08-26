<script lang="ts">
	import type { Vector3Tuple } from 'three'

	import { Canvas } from '@threlte/core'

	import Inputs from './inputs.svelte'
	import Scene from './scene.svelte'

	interface Props {
		data: Uint8Array
	}

	const { data }: Props = $props()

	let up: Vector3Tuple = $state([0, 0, 1])
	let pointSize = $state(0.02)

	const handlePointSizeChange = (value: number) => {
		pointSize = value
	}

	const handleUpChange = (value: Vector3Tuple) => {
		up = value
	}
</script>

<div class="@container">
	<div class="flex flex-col gap-4 @2xl:h-120 @2xl:flex-row">
		<Inputs
			{pointSize}
			{up}
			{data}
			onPointSizeChange={handlePointSizeChange}
			onUpChange={handleUpChange}
		/>

		<div class="relative h-80 overflow-hidden border @2xl:h-full @2xl:w-2/3">
			<Canvas>
				<Scene
					{data}
					{up}
					{pointSize}
				/>
			</Canvas>
		</div>
	</div>
</div>
