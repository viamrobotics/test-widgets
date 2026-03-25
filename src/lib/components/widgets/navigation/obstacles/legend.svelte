<script lang="ts">
	import type { GeoGeometry, Geometry } from '@viamrobotics/sdk'

	import { IconButton, Tooltip } from '@viamrobotics/prime-core'
	import { LngLat, LngLatBounds, Map } from 'maplibre-gl'

	import { getColor } from './color'

	interface Props {
		map?: Map | undefined
		obstacles: GeoGeometry[]
		hovered: string | null
		onEnter: (id: string) => void
		onLeave: () => void
	}

	const { map, obstacles, hovered, onEnter, onLeave }: Props = $props()

	const getBoundingRadius = (geometry: Geometry) => {
		switch (geometry.geometryType.case) {
			case 'box': {
				if (geometry.geometryType.value.dimsMm) {
					const { x, y, z } = geometry.geometryType.value.dimsMm
					return (Math.max(x, y, z) / 1000) * 1.1
				}
				break
			}
			case 'sphere': {
				return (geometry.geometryType.value.radiusMm / 1000) * 1.1
			}
			case 'capsule': {
				return (geometry.geometryType.value.lengthMm / 1000) * 1.1
			}
		}

		return 0 as never
	}

	const panToGeometry = (obstacle: GeoGeometry, geometry: Geometry) => {
		if (!obstacle.location) {
			return
		}

		const lngLat = new LngLat(obstacle.location.longitude, obstacle.location.latitude)

		const radius = getBoundingRadius(geometry)
		const bounds = LngLatBounds.fromLngLat(lngLat, radius)

		map?.fitBounds(bounds, {
			padding: 100,
			duration: 800,
			curve: 0.1,
		})
	}
</script>

{#each obstacles as obstacle, i (i)}
	{#if obstacle.location}
		{#each obstacle.geometries as geometry, j (j)}
			{@const th = geometry.center?.theta ?? 0}
			<li
				class="group border-b-medium border-b py-2 pl-2 last:border-b-0"
				class:bg-light={hovered === geometry.label}
				onmouseenter={() => onEnter(geometry.label)}
				onmouseleave={() => onLeave()}
			>
				<div class="flex items-center justify-between gap-1.5">
					<small class="max-w-[66%] overflow-hidden text-sm text-ellipsis">
						{geometry.label}
					</small>

					<div class="flex gap-1">
						<Tooltip let:tooltipID>
							<IconButton
								aria-describedby={tooltipID}
								icon="image-filter-center-focus"
								label="Focus {geometry.label}"
								on:click={(event) => {
									event.stopPropagation()
									panToGeometry(obstacle, geometry)
								}}
							/>

							<p slot="description">
								{obstacle.location.latitude}, {obstacle.location.longitude}
							</p>
						</Tooltip>

						<Tooltip let:tooltipID>
							<div
								aria-describedby={tooltipID}
								class="m-2 h-3.5 w-3.5"
								style:background-color={getColor(null, geometry.label)}
							></div>

							<p slot="description">
								{geometry.label.includes('transient') ? 'transient' : 'static'}
							</p>
						</Tooltip>
					</div>
				</div>

				<small class="text-subtle-2">
					{#if geometry.geometryType.case === 'box' && geometry.geometryType.value.dimsMm}
						{@const { x, y, z } = geometry.geometryType.value.dimsMm}
						x: {x / 1000}m, y: {y / 1000}m, z: {z / 1000}m, θ: {th}deg
					{:else if geometry.geometryType.case === 'sphere'}
						r: {geometry.geometryType.value.radiusMm / 1000}m, θ: {th}deg
					{:else if geometry.geometryType.case === 'capsule'}
						r: {geometry.geometryType.value.radiusMm / 1000}m, l: {geometry.geometryType.value
							.lengthMm / 1000}m, θ: {th}deg
					{/if}
				</small>
			</li>
		{/each}
	{/if}
{/each}
