<script lang="ts">
	import type { LngLat, Map as MaplLibreMap } from 'maplibre-gl'

	import { ToggleButtons } from '@viamrobotics/prime-core'
	import { GoalState, NavigationClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

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
	import { toGeoWaypoint } from './waypoints/geo-waypoint.ts'
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

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const locationsQuery = createResourceQuery(client, 'listLocations', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const statusQuery = createResourceQuery(client, 'getNavigationStatus', {
		refetchInterval: 10_000,
	})

	const addLocationMutation = createResourceMutation(client, 'addLocation')
	const deleteLocationMutation = createResourceMutation(client, 'deleteLocation')
	const navigateRouteMutation = createResourceMutation(client, 'navigateRoute')
	const cancelMutation = createResourceMutation(client, 'cancel')

	/**
	 * SDK 0.78 replaced waypoints and modes with saved locations, routes, and goals. This widget
	 * keeps its old shape until it is rebuilt: a waypoint is a saved location, and Waypoint mode is
	 * a route through every saved location.
	 */
	const waypoints = $derived(
		(locationsQuery.data ?? [])
			.map((location) => toGeoWaypoint(location))
			.filter((waypoint) => waypoint !== undefined)
	)

	const mode = $derived(statusQuery.data?.goal?.state === GoalState.ACTIVE ? 'Waypoint' : 'Manual')

	const startRoute = () =>
		navigateRouteMutation.mutateAsync([
			{
				waypoints: waypoints.map((waypoint) => ({
					value: { case: 'location', value: waypoint.id },
				})),
			},
		])

	const handleModeChange = async (event: CustomEvent<string>) => {
		await (event.detail === 'Waypoint' ? startRoute() : cancelMutation.mutateAsync([]))
		await statusQuery.refetch()
	}

	const robotGeoPose = $derived.by(() => {
		const position = positionQuery.data?.value

		return position?.case === 'geoPose' ? position.value : undefined
	})

	const robotHeading = $derived(
		robotGeoPose?.orientation.case === 'heading' ? robotGeoPose.orientation.value : 0
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
		await addLocationMutation.mutateAsync([
			`waypoint-${Date.now().toString()}`,
			{
				value: {
					case: 'geoPose',
					value: {
						location: { latitude: lngLat.lat, longitude: lngLat.lng },
						orientation: { case: 'heading', value: 0 },
					},
				},
			},
		])
		await locationsQuery.refetch()
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex w-full flex-wrap justify-between gap-2 p-4">
			<RefetchController
				{refetchInterval}
				queries={[positionQuery, locationsQuery]}
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
					<h3 class="text-subtle-1 border-b-medium border-b p-2 text-xs">Waypoints</h3>

					<ul class="max-h-60 overflow-auto @2xl:h-[calc(100%-32px)] @2xl:max-h-none">
						<WaypointsLegend
							{map}
							{hovered}
							{waypoints}
							onEnter={setHovered}
							onLeave={setHovered}
							onRemove={async (id) => {
								await deleteLocationMutation.mutateAsync([id])
								await locationsQuery.refetch()
							}}
						/>
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

						{#if positionQuery.data}
							<DirectionalMarker
								lat={robotGeoPose?.location?.latitude}
								lng={robotGeoPose?.location?.longitude}
								rotation={robotHeading}
							/>
						{/if}

						<Waypoints
							{waypoints}
							{addWayPoint}
							{hovered}
						/>
					</MapLibre>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
