<script lang="ts">
	import type { MovementSensorPosition } from '@viamrobotics/sdk';

	import {
		DirectionalMarker,
		FollowControls,
		MapLibre,
		MapLibreMarker,
		MapProviders,
		NavigationControls,
		SatelliteControls
	} from '$lib/components/maplibre';
	import { safeReadCoordinate } from './safe-read-coordinate';

	interface Props {
		coordinate: MovementSensorPosition['coordinate'];
		rotation: number | undefined;
	}

	const { coordinate, rotation }: Props = $props();

	const lat = $derived(safeReadCoordinate(coordinate?.latitude));
	const lng = $derived(safeReadCoordinate(coordinate?.longitude));
</script>

<div class="relative h-[300px] w-full lg:h-auto lg:w-1/2">
	<MapLibre
		zoom={15}
		options={{ attributionControl: { compact: false } }}
		mapProvider={MapProviders.googleMaps}
		mapProviderKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
	>
		<div class="absolute top-2.5 right-12 z-10 flex items-center gap-2">
			<SatelliteControls />
			<NavigationControls />
		</div>

		{#if lat !== undefined && lng !== undefined && rotation !== undefined}
			<DirectionalMarker
				{lat}
				{lng}
				{rotation}
			/>
		{:else if lat !== undefined && lng !== undefined}
			<MapLibreMarker
				{lat}
				{lng}
			/>
		{/if}
		<div class="absolute right-3 bottom-7 z-10">
			{#if lat !== undefined && lng !== undefined}
				<FollowControls
					following
					{lat}
					{lng}
				/>
			{/if}
		</div>
	</MapLibre>
</div>
