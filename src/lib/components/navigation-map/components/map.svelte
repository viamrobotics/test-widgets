<script lang="ts">
	import type { LngLat, Map } from 'maplibre-gl'
	import type { Snippet } from 'svelte'

	import { mdiHelpCircleOutline } from '@mdi/js'
	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import {
		CenterControls,
		FollowControls,
		MapLibre,
		type MapProvider,
		MapProviders,
		NavigationControls,
		SatelliteControls,
	} from '@viamrobotics/prime-map'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	import type { GeoPose } from '../geo-pose'
	import type { Obstacle } from '../types'

	import { useNavigationMap } from '../use-navigation-map.svelte'
	import Nav from './nav/index.svelte'
	import ObstaclesLegend from './nav/obstacles-legend.svelte'
	import RobotMarker from './robot-marker.svelte'
	import SceneLayer from './scene-layer.svelte'
	import Waypoints from './waypoints.svelte'

	const minPitch = 0
	const maxPitch = 60

	interface Props {
		/** The Geo-pose of a robot base. */
		baseGeoPose?: GeoPose
		/** The map provider to use. */
		mapProvider?: MapProvider
		/** The API key for the map provider. */
		mapProviderKey?: string
		map?: Map
		tab?: Snippet
		onupdate: (obstacles: Obstacle[]) => void
		onaddwaypoint: (waypoint: LngLat) => void
		ondeletewaypoint: (id: string) => void
	}

	let {
		baseGeoPose = undefined,
		mapProvider = MapProviders.openStreet,
		mapProviderKey = undefined,
		map = $bindable(),
		onupdate,
		onaddwaypoint,
		ondeletewaypoint,
		tab,
	}: Props = $props()

	const nav = useNavigationMap()

	const VIEW_ITEMS = [
		{ value: '2D', label: '2D' },
		{ value: '3D', label: '3D' },
	]

	const handleViewSelect = (value: string) => {
		if (value === '2D' || value === '3D') {
			nav.view = value
		}
	}

	let didHoverTooltip = $state(
		Boolean(localStorage.getItem('navigation-service-card-tooltip-hovered'))
	)

	const markTooltipSeen = () => {
		didHoverTooltip = true
		localStorage.setItem('navigation-service-card-tooltip-hovered', 'true')
	}

	const currentTab = $derived(tab)
</script>

<div class="relative h-full w-full items-stretch lg:flex">
	<MapLibre
		class="relative hidden grow lg:block"
		{minPitch}
		maxPitch={nav.view === '3D' ? maxPitch : minPitch}
		minZoom={6}
		{mapProvider}
		{mapProviderKey}
		bind:map
	>
		<NavigationControls showZoom={false} />

		<Nav
			{onaddwaypoint}
			{ondeletewaypoint}
			{onupdate}
		>
			{@render currentTab?.()}
		</Nav>
		<RobotMarker pose={baseGeoPose} />
		<Waypoints />

		{#snippet layer()}
			<SceneLayer onUpdate={onupdate} />
		{/snippet}

		<div class="absolute top-2.5 right-12 z-10 flex items-center gap-2 lg:flex">
			{#if nav.environment === 'configure'}
				<Tooltip>
					<Tooltip.Trigger>
						<button
							type="button"
							class="relative"
							aria-label="Obstacle legend"
							onpointerenter={markTooltipSeen}
							onfocus={markTooltipSeen}
						>
							{#if !didHoverTooltip}
								<div class="bg-success-dark absolute -m-1 h-7 w-7 animate-ping rounded-full"></div>
							{/if}
							<div class="relative z-10 rounded-full bg-white">
								<Icon
									icon={mdiHelpCircleOutline}
									size="lg"
									aria-hidden="true"
								/>
							</div>
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<div class="flex flex-col p-2">
							<ObstaclesLegend />
						</div>
					</Tooltip.Content>
				</Tooltip>
			{/if}

			<SatelliteControls />

			<ToggleButtons
				aria-label="Map view"
				items={VIEW_ITEMS}
				bind:value={() => nav.view, handleViewSelect}
			/>

			<div class="flex w-60 flex-wrap items-end justify-between gap-y-2">
				<CenterControls storageKey="viam-blocks-navigation-map-center" />
			</div>
		</div>

		<div class="absolute right-2 bottom-10 z-10 hidden lg:block">
			<FollowControls
				lng={baseGeoPose?.lng}
				lat={baseGeoPose?.lat}
				following
			/>
		</div>
	</MapLibre>
</div>
