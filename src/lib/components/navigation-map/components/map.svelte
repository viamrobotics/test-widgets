<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LngLat, Map } from 'maplibre-gl';

	import { Icon, ToggleButtons, Tooltip } from '@viamrobotics/prime-core';

	import {
		CenterControls,
		FollowControls,
		GeoPose,
		MapLibre,
		type MapProvider,
		MapProviders,
		NavigationControls,
		SatelliteControls
	} from '../../maplibre';
	import type { Obstacle } from '../types';
	import { useNavigationMap } from '../use-navigation-map.svelte';
	import Nav from './nav/index.svelte';
	import ObstaclesLegend from './nav/obstacles-legend.svelte';
	import RobotMarker from './robot-marker.svelte';
	import SceneLayer from './scene-layer.svelte';
	import Waypoints from './waypoints.svelte';

	const minPitch = 0;
	const maxPitch = 60;

	interface Props {
		/** The Geo-pose of a robot base. */
		baseGeoPose?: GeoPose;
		/** The map provider to use. */
		mapProvider?: MapProvider;
		/** The API key for the map provider. */
		mapProviderKey?: string;
		map?: Map;
		tab?: Snippet;
		onupdate: (obstacles: Obstacle[]) => void;
		onaddwaypoint: (waypoint: LngLat) => void;
		ondeletewaypoint: (id: string) => void;
	}

	let {
		baseGeoPose = undefined,
		mapProvider = MapProviders.openStreet,
		mapProviderKey = undefined,
		map = $bindable(),
		onupdate,
		onaddwaypoint,
		ondeletewaypoint,
		tab
	}: Props = $props();

	const nav = useNavigationMap();

	const handleViewSelect = ({ detail }: CustomEvent<string>) => {
		nav.view = detail as '2D' | '3D';
	};

	let didHoverTooltip = $state(
		Boolean(localStorage.getItem('navigation-service-card-tooltip-hovered'))
	);

	const currentTab = $derived(tab);
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

		<div class="absolute top-2.5 right-12 z-10 flex hidden items-center gap-2 lg:flex">
			{#if nav.environment === 'configure'}
				<Tooltip>
					<div
						class="relative"
						onpointerenter={() => {
							didHoverTooltip = true;
							localStorage.setItem('navigation-service-card-tooltip-hovered', 'true');
						}}
					>
						{#if !didHoverTooltip}
							<div
								class="bg-success-dark absolute -m-1 h-[28px] w-[28px] animate-ping rounded-full"
							></div>
						{/if}
						<div class="relative z-10 rounded-full bg-white">
							<Icon
								size="lg"
								name="help-circle-outline"
							/>
						</div>
					</div>

					<div
						class="flex flex-col p-2"
						slot="description"
					>
						<ObstaclesLegend />
					</div>
				</Tooltip>
			{/if}

			<SatelliteControls />

			<ToggleButtons
				options={['2D', '3D']}
				selected={nav.view}
				on:input={handleViewSelect}
			/>

			<div class="flex w-60 flex-wrap items-end justify-between gap-y-2">
				<CenterControls />
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
