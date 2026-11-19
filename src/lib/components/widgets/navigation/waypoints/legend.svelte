<script lang="ts">
	import type { Waypoint } from '@viamrobotics/sdk'
	import type { Map } from 'maplibre-gl'

	import { mdiImageFilterCenterFocus, mdiTrashCanOutline } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	interface Props {
		map?: Map | undefined
		waypoints: Waypoint[]
		hovered: string | null
		onEnter: (id: string) => void
		onLeave: () => void
		onRemove: (id: string) => void
	}

	const { map, waypoints, hovered, onEnter, onLeave, onRemove }: Props = $props()

	const FOCUS_ZOOM = 20
	const FOCUS_SPEED = 2

	const rows = $derived(
		waypoints.flatMap((waypoint) => {
			const { location } = waypoint
			if (!location) return []
			return [{ id: waypoint.id, location }]
		})
	)

	const flyTo = (location: { latitude: number; longitude: number }) => {
		map?.flyTo({
			center: [location.longitude, location.latitude],
			zoom: FOCUS_ZOOM,
			speed: FOCUS_SPEED,
		})
	}
</script>

<ul
	aria-label="Waypoints"
	class="flex flex-col"
>
	{#each rows as { id, location }, index (id)}
		<li
			class={[
				'border-light flex items-center gap-1 border-b px-1 py-0.5 last:border-b-0',
				hovered === id && 'bg-light',
			]}
			onpointerenter={() => onEnter(id)}
			onpointerleave={() => onLeave()}
		>
			<div class="flex min-w-0 flex-1 flex-col">
				<span class="truncate text-xs font-semibold">Waypoint {index + 1}</span>
				<span class="text-subtle-2 truncate text-xs">
					{location.latitude}, {location.longitude}
				</span>
			</div>

			<Tooltip>
				<Tooltip.Trigger>
					<button
						type="button"
						class="icon-button size-6"
						aria-label="Focus waypoint {index + 1}"
						onclick={(event) => {
							event.stopPropagation()
							flyTo(location)
						}}
					>
						<Icon
							icon={mdiImageFilterCenterFocus}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Focus on the map</Tooltip.Content>
			</Tooltip>

			<Tooltip>
				<Tooltip.Trigger>
					<button
						type="button"
						class="icon-button size-6"
						aria-label="Remove waypoint {index + 1}"
						onclick={() => onRemove(id)}
					>
						<Icon
							icon={mdiTrashCanOutline}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Remove</Tooltip.Content>
			</Tooltip>
		</li>
	{/each}
</ul>
