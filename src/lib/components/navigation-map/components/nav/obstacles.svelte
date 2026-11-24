<script lang="ts">
	import { mdiImageFilterCenterFocus, mdiTrashCanOutline } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { LngLat, LngLatBounds } from 'maplibre-gl'
	import { fromStore } from 'svelte/store'

	import type { Geometry, Obstacle } from '../../types'

	import { LngLatInput, useMapLibre } from '../../../maplibre'
	import { useNavigationMap } from '../../use-navigation-map.svelte'
	import GeometryInputs from '../input/geometry.svelte'
	import OrientationInput from '../input/orientation.svelte'
	import ObstaclesLegend from './obstacles-legend.svelte'

	interface Props {
		onupdate: (obstacles: Obstacle[]) => void
	}

	const { onupdate }: Props = $props()

	const context = useMapLibre()
	const map = fromStore(context.map)
	const nav = useNavigationMap()

	const handleSelect = (selection: { name: string; location: LngLat }) => {
		const radius = nav.boundingRadius[selection.name]
		const lngLat = new LngLat(selection.location.lng, selection.location.lat)
		const bounds = LngLatBounds.fromLngLat(lngLat, radius)
		map.current.fitBounds(bounds, {
			padding: 100,
			duration: 800,
			curve: 0.1,
		})
	}

	const handleLngLatInput = (name: string) => (lngLat: LngLat) => {
		const index = nav.obstacles.findIndex((obstacle) => obstacle.name === name)
		const obstacle = nav.obstacles[index]
		if (obstacle) {
			obstacle.location = lngLat
			nav.obstacles[index] = obstacle
			onupdate(nav.obstacles)
		}
	}

	const handleDeleteObstacle = (name: string) => () => {
		nav.obstacles = nav.obstacles.filter((obstacle) => obstacle.name !== name)
		nav.hovered = undefined
		nav.selected = undefined
		onupdate(nav.obstacles)
	}

	const handleGeometryInput = (name: string, geoIndex: number) => (geometry: Geometry) => {
		const index = nav.obstacles.findIndex((obstacle) => obstacle.name === name)
		const obstacle = nav.obstacles[index]
		if (obstacle) {
			obstacle.geometries[geoIndex] = geometry
			nav.obstacles[index] = obstacle
			onupdate(nav.obstacles)
		}
	}

	const handleOrientationInput = (name: string, geoIndex: number) => (value: number) => {
		const index = nav.obstacles.findIndex((obstacle) => obstacle.name === name)
		const obstacle = nav.obstacles[index]
		const geometry = obstacle?.geometries[geoIndex]
		if (geometry) {
			geometry.pose.orientationVector.th = value
			obstacle.geometries[geoIndex] = geometry
			nav.obstacles[index] = obstacle
			onupdate(nav.obstacles)
		}
	}

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Backspace' && nav.selected && document.activeElement?.tagName !== 'INPUT') {
			nav.obstacles = nav.obstacles.filter((obstacle) => obstacle.name !== nav.selected)
			nav.hovered = undefined
			nav.selected = undefined
			onupdate(nav.obstacles)
		}
	}

	const selectedObstacle = $derived(
		nav.obstacles.find((obstacle) => obstacle.name === nav.selected)
	)
	const debugMode = $derived(nav.environment === 'debug')
</script>

<svelte:window onkeydown={handleKeydown} />

{#if nav.obstacles.length === 0}
	<li class="text-subtle-2 py-2 font-sans text-xs">
		{#if debugMode}
			Add static obstacles in your navigation service config.
		{:else}
			<ObstaclesLegend />
		{/if}
	</li>
{/if}

{#each nav.obstacles as { name, location, geometries, color, label }, index (index)}
	<li
		class="group border-b-medium flex min-h-7.5 items-center border-b pl-2 leading-none last:border-b-0"
		class:pb-3={debugMode}
		class:pt-1={debugMode}
		class:bg-light={nav.selected === name}
		onmouseenter={() => (nav.hovered = name)}
	>
		<button
			class="min-w-0 flex-1 text-left"
			onclick={() => {
				nav.selected = nav.selected === name ? undefined : name
			}}
		>
			<small>{name}</small>
			{#if debugMode}
				{#each geometries as geometry, i (i)}
					<small class="text-subtle-2 block">
						{#if geometry.type === 'box'}
							Length: {geometry.length}m, Width: {geometry.width}m, Height: {geometry.height}m
						{:else if geometry.type === 'sphere'}
							Radius: {geometry.radius}m
						{:else if geometry.type === 'capsule'}
							Radius: {geometry.radius}m, Length: {geometry.length}m
						{/if}
					</small>

					{#if geometry.pose.orientationVector.th !== 0}
						<small class="text-subtle-2 mt-2 block">
							Theta: {geometry.pose.orientationVector.th.toFixed(2)}
						</small>
					{/if}
				{/each}
			{/if}
		</button>
		<div class="flex items-center gap-1.5">
			{#if debugMode}
				<small class="text-subtle-2 opacity-60 group-hover:opacity-100">
					({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
				</small>
			{:else}
				<button
					type="button"
					class="icon-button"
					aria-label="Delete {name}"
					onclick={handleDeleteObstacle(name)}
				>
					<Icon icon={mdiTrashCanOutline} />
				</button>
			{/if}
			<button
				type="button"
				class="icon-button"
				aria-label="Focus {name}"
				onclick={(event) => {
					event.stopPropagation()
					handleSelect({ name, location })
				}}
			>
				<Icon icon={mdiImageFilterCenterFocus} />
			</button>
			<Tooltip>
				<Tooltip.Trigger>
					<!-- Keyboard focus is the only way to open the tooltip without a pointer. -->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<span
						class="m-2 block h-3.5 w-3.5"
						role="img"
						aria-label={label}
						tabindex="0"
						style:background-color={color}
					></span>
				</Tooltip.Trigger>
				<Tooltip.Content side="right">{label}</Tooltip.Content>
			</Tooltip>
		</div>
	</li>
{/each}

{#if !debugMode && selectedObstacle}
	<li
		class="group sticky bottom-0 z-10 bg-white pt-4"
		onmouseenter={() => {
			nav.hovered = selectedObstacle.name
		}}
	>
		<div class="flex items-end gap-1.5 pb-2">
			<!-- @todo(mp) obstacle API doesn't yet allow custom names. -->
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<span class="text-subtle-1 text-xs">Name</span>
				<span class="readout">{selectedObstacle.name}</span>
			</div>
		</div>
		<LngLatInput
			lng={selectedObstacle.location.lng}
			lat={selectedObstacle.location.lat}
			oninput={handleLngLatInput(selectedObstacle.name)}
		/>

		{#each selectedObstacle.geometries as geometry, geoIndex (geoIndex)}
			<GeometryInputs
				{geometry}
				oninput={handleGeometryInput(selectedObstacle.name, geoIndex)}
			/>
			<OrientationInput
				th={geometry.pose.orientationVector.th}
				oninput={handleOrientationInput(selectedObstacle.name, geoIndex)}
			/>
		{/each}
	</li>
{/if}
