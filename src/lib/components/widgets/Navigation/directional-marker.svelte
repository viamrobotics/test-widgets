<script lang="ts">
	import type { NavigationPosition } from '@viamrobotics/sdk'

	import { DirectionalMarker } from '@viamrobotics/prime-map'

	interface Props {
		position: NavigationPosition
	}

	const { position }: Props = $props()
</script>

{#if position.location}
	<DirectionalMarker
		lat={position.location.latitude}
		lng={position.location.longitude}
		rotation={position.compassHeading}
	/>
{/if}
