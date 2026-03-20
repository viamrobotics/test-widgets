<script lang="ts">
	import { DirectionalMarker, type GeoPose } from '../../maplibre';

	interface Props {
		/** The Lng,Lat and rotation of the marker. */
		pose?: GeoPose;
	}

	const { pose }: Props = $props();
</script>

{#if pose}
	<DirectionalMarker
		lng={pose.lng}
		lat={pose.lat}
		rotation={pose.rotation}
	/>
{/if}
