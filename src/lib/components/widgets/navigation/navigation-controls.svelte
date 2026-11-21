<script lang="ts">
	import type { LngLat, Map as MapLibreMap } from 'maplibre-gl'

	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { Banner } from '@viamrobotics/prime-ui'
	import { GeoGeometry, navigationApi, NavigationClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { SvelteSet } from 'svelte/reactivity'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { MapLibre, MapProviders, NavigationControls } from '$lib/components/maplibre'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import DirectionalMarker from './directional-marker.svelte'
	import MapViewPanel from './map-view-panel.svelte'
	import { modeFromLabel, modeLabel } from './navigation-mode'
	import ObstaclesOverlay from './obstacles/obstacles-overlay.svelte'
	import Obstacles from './obstacles/obstacles.svelte'
	import PathsLayer from './paths-layer.svelte'
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

	const pathsQuery = createResourceQuery(client, 'getPaths', () => ({
		refetchInterval: refetchInterval.current,
	}))

	// The properties do not change while the service runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

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

	// A press while a SetMode call is pending is dropped, never queued.
	const modeGuard = createInFlightGuard()

	// Each waypoint's remove is its own group, so other rows stay live. A guard per id would be
	// created while the list renders, where Svelte does not track it, so the ids are one reactive set.
	const removingIds = new SvelteSet<string>()
	const isRemoving = (id: string) => removingIds.has(id)

	const commitMode = async (label: string | undefined) => {
		const nextMode = modeFromLabel(label)
		if (nextMode === undefined) return

		const outcome = await modeGuard.run(() => setModeMutation.mutateAsync([nextMode]))
		if (outcome === 'succeeded') await getModeQuery.refetch()
	}

	const selectMode = (label: string | undefined) => {
		void commitMode(label)
	}

	const hasMap = $derived(propertiesQuery.data?.mapType !== navigationApi.MapType.NONE)
	const paths = $derived(pathsQuery.data ?? [])
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
		// A press while this waypoint's remove is pending is dropped, never queued.
		if (removingIds.has(id)) return
		removingIds.add(id)
		try {
			await removeWaypointMutation.mutateAsync([id])
			await waypointsQuery.refetch()
		} catch {
			// The mutation's own state carries the error.
		} finally {
			removingIds.delete(id)
		}
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container flex w-full min-w-0 flex-col">
			{#if hasMap}
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

						<PathsLayer {paths} />

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
						{hasMap}
						onEnter={setHovered}
						onLeave={setHovered}
					/>
				</div>
			{:else}
				<div class="p-2">
					<Banner>
						<Banner.Description>Map type is None, so there is no map.</Banner.Description>
					</Banner>
				</div>
			{/if}

			<div class="flex flex-col gap-2 p-2">
				<div
					class="flex items-end gap-2"
					aria-busy={modeGuard.isBusy}
				>
					<ToggleButtons
						label="Mode"
						items={MODE_ITEMS}
						disabled={modeGuard.isBusy}
						bind:value={getMode, selectMode}
					/>
					{#if modeGuard.isBusy}
						<span
							class="progress-dots mb-2"
							aria-hidden="true"
						></span>
					{/if}
				</div>

				<div class="flex flex-col gap-1">
					<h4 class="text-xs font-semibold">Waypoints</h4>
					<WaypointsLegend
						{map}
						{hasMap}
						{hovered}
						{waypoints}
						onEnter={setHovered}
						onLeave={setHovered}
						onRemove={removeWayPoint}
						{isRemoving}
					/>
					{#if hasMap}
						<p class="text-subtle-2 px-1 py-1.5 text-xs">Click on the map to add a waypoint.</p>
					{/if}
				</div>

				<div class="w-58 max-w-full">
					<RefetchController
						{refetchInterval}
						queries={[locationQuery, obstaclesQuery, waypointsQuery, pathsQuery]}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
