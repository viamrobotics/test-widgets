<script lang="ts">
	import type { MovementSensorPosition } from '@viamrobotics/sdk'

	import {
		DirectionalMarker,
		FollowControls,
		MapLibre,
		MapLibreMarker,
		MapProviders,
		SatelliteControls,
	} from '$lib/components/maplibre'

	import { safeReadCoordinate } from './safe-read-coordinate'

	interface Props {
		coordinate: MovementSensorPosition['coordinate']
		rotation: number | undefined
	}

	const { coordinate, rotation }: Props = $props()

	const lat = $derived(safeReadCoordinate(coordinate?.latitude))
	const lng = $derived(safeReadCoordinate(coordinate?.longitude))
</script>

<div class="relative aspect-4/3 w-full">
	<MapLibre
		zoom={15}
		options={{ attributionControl: { compact: false } }}
		mapProvider={MapProviders.googleMaps}
		mapProviderKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
	>
		<div
			role="group"
			aria-label="Map view"
			class="bg-extralight border-light absolute top-2 right-2 z-10 flex flex-col gap-2 rounded-sm border p-2 text-xs"
		>
			<FollowControls
				following
				{lat}
				{lng}
			/>
			<SatelliteControls />
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
	</MapLibre>
</div>
