<script lang="ts">
	import type { NavigationPosition } from '@viamrobotics/sdk';

	import { DirectionalMarker, FollowControls } from '$lib/components/maplibre';

	interface Props {
		position: NavigationPosition;
	}

	const { position }: Props = $props();
</script>

<div class="absolute right-4 bottom-12 z-10">
	<FollowControls
		lat={position.location?.latitude}
		lng={position.location?.longitude}
	/>
</div>

{#if position.location}
	<DirectionalMarker
		lat={position.location.latitude}
		lng={position.location.longitude}
		rotation={position.compassHeading}
	/>
{/if}
