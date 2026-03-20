<!--
  @component
  A 2D marker that can accept a texture.
  Used for rendering the base position, endpoints, etc.
-->
<script
	lang="ts"
	module
>
	import { TextureLoader } from 'three';

	const textureLoader = new TextureLoader();
</script>

<script lang="ts">
	import { T } from '@threlte/core';

	import { renderOrder } from './render-order';

	interface Props {
		name: string;
		url: string;
		rotation?: number;
		[key: string]: unknown;
	}

	const { name, url, rotation = 0, ...rest }: Props = $props();
</script>

<T.Sprite
	{name}
	{...rest}
	renderOrder={renderOrder.markers}
>
	<T.SpriteMaterial
		map={textureLoader.load(url)}
		sizeAttenuation={false}
		color="#ff0047"
		{rotation}
	/>
</T.Sprite>
