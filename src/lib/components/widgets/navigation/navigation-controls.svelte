<script lang="ts">
	import type { LngLat, Map as MapLibreMap } from 'maplibre-gl'

	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { GeoGeometry, navigationApi, NavigationClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { MapLibre, MapProviders, NavigationControls } from '$lib/components/maplibre'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import DirectionalMarker from './directional-marker.svelte'
	import MapViewPanel from './map-view-panel.svelte'
	import { modeFromLabel, modeLabel } from './navigation-mode'
	import ObstaclesOverlay from './obstacles/obstacles-overlay.svelte'
	import Obstacles from './obstacles/obstacles.svelte'
	import WaypointsLegend from './waypoints/legend.svelte'
	import Waypoints from './waypoints/waypoints.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MODE_REFETCH_INTERVAL_MS = 10_000
	const PITCHED_MAX_PITCH = 60
	const FLAT_MAX_PITCH = 0
	// The width of the `@2xl` container query, where the Obstacles overlay moves to the left edge.
	const OVERLAY_DOCKS_LEFT_PX = 672

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'navigation-view'
	)

	const client = createResourceClient(
		NavigationClient,
		() => partID,
		() => resourceName
	)

	const locationQuery = createResourceQuery(client, 'getLocation', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const waypointsQuery = createResourceQuery(client, 'getWayPoints', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const obstaclesQuery = createResourceQuery(client, 'getObstacles', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const getModeQuery = createResourceQuery(client, 'getMode', {
		refetchInterval: MODE_REFETCH_INTERVAL_MS,
	})

	const addWaypointMutation = createResourceMutation(client, 'addWayPoint')
	const removeWaypointMutation = createResourceMutation(client, 'removeWayPoint')
	const setModeMutation = createResourceMutation(client, 'setMode')

	/**
	 * Explore mode is hidden due to being slated for removal.
	 * Do not enable it, Rand's well-being and happiness are at stake.
	 */
	const MODE_ITEMS = [navigationApi.Mode.MANUAL, navigationApi.Mode.WAYPOINT].map((mode) => ({
		value: modeLabel(mode),
		label: modeLabel(mode),
	}))

	const getMode = () => modeLabel(getModeQuery.data)

	const commitMode = async (label: string | undefined) => {
		const nextMode = modeFromLabel(label)
		if (nextMode === undefined) return

		await setModeMutation.mutateAsync([nextMode])
		await getModeQuery.refetch()
	}

	const selectMode = (label: string | undefined) => {
		void commitMode(label)
	}

	const waypoints = $derived(waypointsQuery.data ?? [])
	const obstacles = $derived<GeoGeometry[]>(
		(obstaclesQuery.data ?? []).map((obstacle, index) => ({
			location: obstacle.location,
			geometries: obstacle.geometries.map((geometry) => ({
				center: geometry.center,
				geometryType: geometry.geometryType,
				label: geometry.label === '' ? `Obstacle ${(index + 1).toString()}` : geometry.label,
			})),
		}))
	)

	let view = $state<'2D' | '3D'>('2D')
	let hovered = $state<string | null>(null)

	const maxPitch = $derived(view === '3D' ? PITCHED_MAX_PITCH : FLAT_MAX_PITCH)

	const setHovered = (next?: string | null) => {
		hovered = next ?? null
	}

	let map = $state.raw<MapLibreMap>()
	let mapWidth = $state(0)

	// Top left stays clear of the bottom overlay and top right panel below 672 px. Above it the
	// overlay takes the top left, so the compass moves to the bottom right.
	const compassPosition = $derived(mapWidth < OVERLAY_DOCKS_LEFT_PX ? 'top-left' : 'bottom-right')

	const addWayPoint = async (lngLat: LngLat) => {
		const location = {
			latitude: lngLat.lat,
			longitude: lngLat.lng,
		}

		await addWaypointMutation.mutateAsync([location])
		await waypointsQuery.refetch()
	}

	const removeWayPoint = async (id: string) => {
		await removeWaypointMutation.mutateAsync([id])
		await waypointsQuery.refetch()
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container flex w-full min-w-0 flex-col">
			<div
				class="relative aspect-4/3 w-full"
				bind:clientWidth={mapWidth}
			>
				<MapLibre
					{maxPitch}
					mapProvider={MapProviders.googleMaps}
					mapProviderKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
					bind:map
				>
					<NavigationControls
						showZoom={false}
						position={compassPosition}
					/>

					<MapViewPanel
						bind:view
						location={locationQuery.data?.location}
					/>

					{#if locationQuery.data}
						<DirectionalMarker position={locationQuery.data} />
					{/if}

					<Waypoints
						{waypoints}
						{addWayPoint}
						{hovered}
					/>

					{#snippet layer()}
						<Obstacles
							{obstacles}
							{hovered}
							{setHovered}
							{view}
						/>
					{/snippet}
				</MapLibre>

				<ObstaclesOverlay
					{map}
					{hovered}
					{obstacles}
					onEnter={setHovered}
					onLeave={setHovered}
				/>
			</div>

			<div class="flex flex-col gap-2 p-2">
				<ToggleButtons
					label="Mode"
					items={MODE_ITEMS}
					bind:value={getMode, selectMode}
				/>

				<div class="flex flex-col gap-1">
					<h4 class="text-xs font-semibold">Waypoints</h4>
					<WaypointsLegend
						{map}
						{hovered}
						{waypoints}
						onEnter={setHovered}
						onLeave={setHovered}
						onRemove={removeWayPoint}
					/>
					<p class="text-subtle-2 px-1 py-1.5 text-xs">Click on the map to add a waypoint.</p>
				</div>

				<div class="w-58 max-w-full">
					<RefetchController
						{refetchInterval}
						queries={[locationQuery, obstaclesQuery, waypointsQuery]}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
