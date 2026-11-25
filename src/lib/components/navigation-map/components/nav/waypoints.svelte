<script lang="ts">
	import type { LngLat } from 'maplibre-gl'

	import { mdiImageFilterCenterFocus, mdiTrashCanOutline } from '@mdi/js'
	import { useMapLibre, useMapLibreEvent } from '@viamrobotics/prime-map'
	import { Icon } from '@viamrobotics/prime-ui'

	import { useNavigationMap } from '../../use-navigation-map.svelte'
	import { Waypoint } from '../../waypoint'

	interface Props {
		onaddwaypoint: (waypoint: LngLat) => void
		ondeletewaypoint: (id: string) => void
	}

	const { onaddwaypoint, ondeletewaypoint }: Props = $props()

	const context = useMapLibre()
	const nav = useNavigationMap()

	const handleDeleteWaypoint = (id: string) => {
		nav.waypoints = nav.waypoints.filter((waypoint) => waypoint.id !== id)
		ondeletewaypoint(id)
	}

	useMapLibreEvent('click', (event) => {
		const waypoint = new Waypoint(event.lngLat.lng, event.lngLat.lat, crypto.randomUUID())

		nav.waypoints = [...nav.waypoints, waypoint]

		onaddwaypoint(waypoint)
	})
</script>

{#if nav.waypoints.length === 0}
	<li class="text-subtle-2 py-2 font-sans text-xs">Click on the map to add a waypoint.</li>
{/if}

{#each nav.waypoints as waypoint, index (waypoint.id)}
	<li class="group flex items-center justify-between gap-1.5 border-b py-2 sm:py-0">
		<small>Waypoint {index}</small>
		<small class="text-subtle-2 opacity-60 group-hover:opacity-100">
			({waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)})
		</small>
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				class="icon-button"
				aria-label="Remove waypoint {index}"
				onclick={() => handleDeleteWaypoint(waypoint.id)}
			>
				<Icon icon={mdiTrashCanOutline} />
			</button>
			<button
				type="button"
				class="icon-button"
				aria-label="Focus waypoint {index}"
				onclick={() =>
					context.map.flyTo({
						zoom: 15,
						duration: 800,
						curve: 0.1,
						center: [waypoint.lng, waypoint.lat],
					})}
			>
				<Icon icon={mdiImageFilterCenterFocus} />
			</button>
		</div>
	</li>
{/each}
