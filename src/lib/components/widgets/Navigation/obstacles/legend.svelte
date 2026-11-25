<script lang="ts">
	import type { GeoGeometry, Geometry } from '@viamrobotics/sdk'

	import { mdiImageFilterCenterFocus } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { LngLat, LngLatBounds, Map } from 'maplibre-gl'

	import { getCssColor } from './color'

	interface Props {
		map?: Map | undefined
		/** False when the service has no map, so Focus has nothing to pan. */
		hasMap?: boolean
		obstacles: GeoGeometry[]
		hovered: string | null
		onEnter: (id: string) => void
		onLeave: () => void
	}

	const { map, hasMap = true, obstacles, hovered, onEnter, onLeave }: Props = $props()

	const MILLIMETERS_PER_METER = 1000
	// Pads the focused bounds so the whole obstacle stays in view.
	const BOUNDS_MARGIN = 1.1

	const toMeters = (millimeters: number) => millimeters / MILLIMETERS_PER_METER
	const BOX_DECIMALS = 1
	const toBoxMeters = (millimeters: number) => toMeters(millimeters).toFixed(BOX_DECIMALS)

	const getBoundingRadius = (geometry: Geometry) => {
		switch (geometry.geometryType.case) {
			case 'box': {
				const dimensions = geometry.geometryType.value.dimsMm
				if (!dimensions) return 0
				return toMeters(Math.max(dimensions.x, dimensions.y, dimensions.z)) * BOUNDS_MARGIN
			}
			case 'sphere': {
				return toMeters(geometry.geometryType.value.radiusMm) * BOUNDS_MARGIN
			}
			case 'capsule': {
				return toMeters(geometry.geometryType.value.lengthMm) * BOUNDS_MARGIN
			}
		}

		return 0
	}

	const describeShape = (geometry: Geometry) => {
		const theta = geometry.center?.theta ?? 0

		switch (geometry.geometryType.case) {
			case 'box': {
				const dimensions = geometry.geometryType.value.dimsMm
				if (!dimensions) return 'Box'
				const { x, y, z } = dimensions
				return `Box · ${toBoxMeters(x)} × ${toBoxMeters(y)} × ${toBoxMeters(z)} m · θ ${theta}°`
			}
			case 'sphere': {
				return `Sphere · radius ${toMeters(geometry.geometryType.value.radiusMm)} m`
			}
			case 'capsule': {
				const { radiusMm, lengthMm } = geometry.geometryType.value
				return `Capsule · radius ${toMeters(radiusMm)} m · length ${toMeters(lengthMm)} m · θ ${theta}°`
			}
		}

		return ''
	}

	// Matches the map's coloring in ./color, so the text and the swatch always agree.
	const describeKind = (label: string) => (label.includes('transient') ? 'Transient' : 'Static')

	const rows = $derived(
		obstacles.flatMap((obstacle) => {
			const { location } = obstacle
			if (!location) return []
			return obstacle.geometries.map((geometry) => ({ location, geometry }))
		})
	)

	const panToGeometry = (location: { latitude: number; longitude: number }, geometry: Geometry) => {
		const lngLat = new LngLat(location.longitude, location.latitude)
		const bounds = LngLatBounds.fromLngLat(lngLat, getBoundingRadius(geometry))

		map?.fitBounds(bounds, {
			padding: 100,
			duration: 800,
			curve: 0.1,
		})
	}
</script>

<ul
	aria-label="Obstacles"
	class="flex flex-col"
>
	{#each rows as { location, geometry }, index (index)}
		<li
			class={[
				'border-light flex items-center gap-1 border-b px-1 py-0.5 last:border-b-0',
				hovered === geometry.label && 'bg-light',
			]}
			onmouseenter={() => onEnter(geometry.label)}
			onmouseleave={() => onLeave()}
		>
			<span
				aria-hidden="true"
				class="mx-0.5 size-3 shrink-0"
				style:background-color={getCssColor(null, geometry.label)}
			></span>

			<div class="flex min-w-0 flex-1 flex-col">
				<div class="flex items-center gap-1">
					<span class="min-w-0 flex-1 truncate text-xs font-semibold">{geometry.label}</span>
					<span class="text-subtle-2 shrink-0 text-xs">{describeKind(geometry.label)}</span>
				</div>
				<span class="text-subtle-2 truncate text-xs">{describeShape(geometry)}</span>
			</div>

			<Tooltip>
				<Tooltip.Trigger>
					<button
						type="button"
						class="icon-button size-6"
						aria-label="Focus {geometry.label}"
						disabled={!hasMap}
						onclick={(event) => {
							event.stopPropagation()
							panToGeometry(location, geometry)
						}}
					>
						<Icon
							icon={mdiImageFilterCenterFocus}
							size="sm"
						/>
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>{location.latitude}, {location.longitude}</Tooltip.Content>
			</Tooltip>
		</li>
	{/each}
</ul>
