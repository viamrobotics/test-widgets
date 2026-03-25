<script lang="ts">
	import type { ColorRepresentation } from 'three'

	import { T } from '@threlte/core'

	import type { Path } from '../types'

	interface Props {
		path: Path
		color: ColorRepresentation
	}

	const { path, color }: Props = $props()
</script>

{#each path as loc, index (index)}
	<T.Mesh userData.lngLat={loc}>
		<T.SphereGeometry args={[0.2]} />
		<T.MeshBasicMaterial {color} />
	</T.Mesh>
{/each}

<T.Line userData.lngLat={path}>
	<T.BufferGeometry />
	<T.LineDashedMaterial
		{color}
		dashSize={0.1}
		gapSize={0.1}
	/>
</T.Line>
