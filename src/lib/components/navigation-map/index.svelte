<!--
  @component

  A map for configuring or viewing navigation service information, such as waypoints, obstacles, or motion paths.

  ```svelte
    <NavigationMap
      environment={'debug' | 'configure'}
      waypoints={Waypoint[]}
      obstacles={Obstacle[]}
      on:click
      on:delete-waypoint
      on:update-obstacles
    />
  ```
-->
<script lang="ts">
	import type { LngLat, Map as MapType } from 'maplibre-gl'
	import type { Snippet } from 'svelte'

	import { type GeoPose, type MapProvider, MapProviders, type Waypoint } from '../maplibre/types'
	import Map from './components/map.svelte'
	import { NavigationTab, type NavigationTabType, type Obstacle, type Path } from './types'
	import { provideNavigationMapContext } from './use-navigation-map.svelte'

	interface Props {
		/** The map environment. "debug" assumes the robot is on and connected. */
		environment?: 'debug' | 'configure'
		/** The waypoints to render on the map. */
		waypoints?: Waypoint[]
		/** The obstacles to render on the map. */
		obstacles?: Obstacle[]
		/** The paths to render on the map. */
		paths?: Path[]
		/** The initial tab to show. */
		tab?: NavigationTabType
		/** A reference to the maplibre map, once created. */
		map?: MapType
		/** The visible set of tabs. */
		tabs?: NavigationTabType[]
		/** The pose (Lng,Lat) and rotation of a base. */
		baseGeoPose?: GeoPose
		/** The map provider to use. */
		mapProvider?: MapProvider
		/** The API key for the map provider. */
		mapProviderKey?: string
		/** The current tab to show. */
		currentTab?: Snippet
		/** Fires when the obstacles are updated. */
		onupdate: (obstacles: Obstacle[]) => void
		/** Fires when a waypoint is added. */
		onaddwaypoint: (waypoint: LngLat) => void
		/** Fires when a waypoint is deleted. */
		ondeletewaypoint: (id: string) => void
	}

	let {
		environment = 'debug',
		waypoints = [],
		obstacles = [],
		paths = [],
		tab = NavigationTab.Waypoints,
		map = $bindable(),
		tabs = [NavigationTab.Waypoints, NavigationTab.Obstacles],
		baseGeoPose,
		mapProvider = MapProviders.openStreet,
		mapProviderKey,
		currentTab,
		onupdate,
		onaddwaypoint,
		ondeletewaypoint,
	}: Props = $props()

	const context = provideNavigationMapContext(
		() => tab,
		() => tabs,
		() => waypoints,
		() => paths,
		() => environment
	)

	$effect(() => {
		context.obstacles = obstacles
	})
</script>

<Map
	bind:map
	{baseGeoPose}
	{mapProvider}
	{mapProviderKey}
	{onupdate}
	{onaddwaypoint}
	{ondeletewaypoint}
>
	{#snippet tab()}
		{@render currentTab?.()}
	{/snippet}
</Map>
