<script lang="ts">
	import { DirectionalMarker, FollowControls } from '#lib/components/MapLibre/index.js'

	interface Props {
		lat?: number
		lng?: number
		rotation?: number
	}

	const { lat, lng, rotation }: Props = $props()
</script>

<div class="absolute right-4 bottom-12 z-10">
	<FollowControls
		{lat}
		{lng}
	/>
</div>

{#if lat !== undefined && lng !== undefined}
	<DirectionalMarker
		{lat}
		{lng}
		{rotation}
	/>
{/if}
