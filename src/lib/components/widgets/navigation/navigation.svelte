<script lang="ts">
	import type { LngLat, Map as MaplLibreMap } from 'maplibre-gl'

	import { Tab, TabsBar, ToggleButtons } from '@viamrobotics/prime-core'
	import { GeoGeometry, navigationApi, NavigationClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { PersistedState } from 'runed'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import {
		CenterControls,
		MapLibre,
		MapProviders,
		NavigationControls,
		SatelliteControls,
	} from '$lib/components/maplibre'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

	import DirectionalMarker from './directional-marker.svelte'
	import ObstaclesLegend from './obstacles/legend.svelte'
	import Obstacles from './obstacles/obstacles.svelte'
	import WaypointsLegend from './waypoints/legend.svelte'
	import Waypoints from './waypoints/waypoints.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

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
		refetchInterval: 10_000,
	})

	const addWaypointMutation = createResourceMutation(client, 'addWayPoint')
	const removeWaypointMutation = createResourceMutation(client, 'removeWayPoint')
	const setModeMutation = createResourceMutation(client, 'setMode')

	/**
	 * Explore mode is hidden due to being slated for removal.
	 * Do not enable it, Rand's well-being and happiness are at stake.
	 */
	//
	const mode = $derived(
		{
			[navigationApi.Mode.UNSPECIFIED]: '',
			[navigationApi.Mode.EXPLORE]: '',
			[navigationApi.Mode.MANUAL]: 'Manual',
			[navigationApi.Mode.WAYPOINT]: 'Waypoint',
		}[getModeQuery.data ?? 0] ?? ''
	)

	const handleModeChange = async (event: CustomEvent<string>) => {
		const nextMode =
			{
				'': navigationApi.Mode.UNSPECIFIED,
				Manual: navigationApi.Mode.MANUAL,
				Waypoint: navigationApi.Mode.WAYPOINT,
			}[event.detail] ?? navigationApi.Mode.UNSPECIFIED

		await setModeMutation.mutateAsync([nextMode])
		await getModeQuery.refetch()
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

	const tab = new PersistedState<'obstacles' | 'waypoints'>(
		'navigation-service-test-card-tab',
		'obstacles'
	)
	let view = $state<'2D' | '3D'>('2D')
	let hovered = $state<string | null>(null)

	const handleViewSelect = ({ detail }: CustomEvent<string>) => {
		view = detail as '2D' | '3D'
	}

	const setHovered = (next?: string | null) => {
		hovered = next ?? null
	}

	let map = $state.raw<MaplLibreMap>()

	const addWayPoint = async (lngLat: LngLat) => {
		const location = {
			latitude: lngLat.lat,
			longitude: lngLat.lng,
		}

		await addWaypointMutation.mutateAsync([location])
		await waypointsQuery.refetch()
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex w-full flex-wrap justify-between gap-2 p-4">
			<RefetchController
				{refetchInterval}
				queries={[locationQuery, obstaclesQuery, waypointsQuery]}
			/>

			<div>
				<label class="flex items-center gap-2 text-xs">
					Mode
					<ToggleButtons
						options={['Manual', 'Waypoint']}
						selected={mode}
						on:input={handleModeChange}
					/>
				</label>
			</div>
		</div>

		<div class="@container">
			<div class="relative flex w-full flex-col items-stretch p-2 @2xl:h-120 @2xl:flex-row">
				<div class="w-full p-2 @2xl:max-w-62.5">
					<TabsBar variant="secondary">
						<Tab
							title="Obstacles"
							selected={tab.current === 'obstacles'}
							selectTab={() => (tab.current = 'obstacles')}
						/>
						<Tab
							title="Waypoints"
							selected={tab.current === 'waypoints'}
							selectTab={() => (tab.current = 'waypoints')}
						/>
					</TabsBar>

					<ul class="max-h-60 overflow-auto @2xl:h-[calc(100%-32px)] @2xl:max-h-none">
						{#if tab.current === 'obstacles'}
							<ObstaclesLegend
								{map}
								{hovered}
								{obstacles}
								onEnter={setHovered}
								onLeave={setHovered}
							/>
						{:else if tab.current === 'waypoints'}
							<WaypointsLegend
								{map}
								{hovered}
								{waypoints}
								onEnter={setHovered}
								onLeave={setHovered}
								onRemove={async (id) => {
									await removeWaypointMutation.mutateAsync([id])
									await waypointsQuery.refetch()
								}}
							/>
						{/if}
					</ul>
				</div>

				<div class="relative h-80 @2xl:h-auto @2xl:grow">
					<MapLibre
						class="relative"
						maxPitch={view === '3D' ? 60 : 0}
						mapProvider={MapProviders.googleMaps}
						mapProviderKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
						bind:map
					>
						<NavigationControls showZoom={false} />

						<div class="absolute top-5 right-14 z-10 flex items-center gap-2">
							<ToggleButtons
								options={['2D', '3D']}
								selected={view}
								on:input={handleViewSelect}
							/>
							<SatelliteControls />
							<CenterControls />
						</div>

						{#if locationQuery.data}
							<DirectionalMarker position={locationQuery.data} />
						{/if}

						<Waypoints
							{waypoints}
							{addWayPoint}
							tab={tab.current ?? 'obstacles'}
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
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
