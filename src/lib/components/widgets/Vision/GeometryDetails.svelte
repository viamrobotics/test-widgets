<script lang="ts">
	import type { GeometriesInFrame, Geometry } from '@viamrobotics/sdk'

	import { Expandable, Icon } from '@viamrobotics/prime-core'

	interface Props {
		geometries: GeometriesInFrame
	}

	const { geometries }: Props = $props()

	const formatNumber = (value: number | undefined): string => {
		if (value === undefined) return '—'
		return value.toFixed(3)
	}

	const getGeometryLabel = (geometry: Geometry, index: number): string => {
		const typeCase = geometry.geometryType.case ?? 'unknown'
		if (geometry.label) {
			return `${geometry.label} (${typeCase})`
		}
		return `${typeCase} ${index}`
	}

	const getDimensionsDisplay = (geometry: Geometry): { label: string; value: string[] }[] => {
		const { geometryType } = geometry

		switch (geometryType.case) {
			case 'box': {
				const box = geometryType.value
				return [
					{
						label: 'Dimensions',
						value: [
							`x: ${formatNumber(box.dimsMm?.x)}mm`,
							`y: ${formatNumber(box.dimsMm?.y)}mm`,
							`z: ${formatNumber(box.dimsMm?.z)}mm`,
						],
					},
				]
			}
			case 'sphere': {
				const sphere = geometryType.value
				return [{ label: 'Radius', value: [`${formatNumber(sphere.radiusMm)}mm`] }]
			}
			case 'capsule': {
				const capsule = geometryType.value
				return [
					{ label: 'Radius', value: [`${formatNumber(capsule.radiusMm)}mm`] },
					{ label: 'Length', value: [`${formatNumber(capsule.lengthMm)}mm`] },
				]
			}
			default: {
				return []
			}
		}
	}
</script>

<div class="flex flex-col gap-1 p-2">
	{#each geometries.geometries as geometry, index (`${index}:${geometry.label}`)}
		<Expandable
			class="border-light border"
			triggerClass="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-gray-50"
			contentClass="px-3 pb-3"
		>
			{#snippet trigger({ isOpen })}
				<Icon
					name={isOpen ? 'chevron-down' : 'chevron-right'}
					cx="h-4 w-4 shrink-0 text-gray-500"
				/>
				<span class="truncate">{getGeometryLabel(geometry, index)}</span>
			{/snippet}
			{#snippet content()}
				<dl class="text-subtle-1 flex flex-col gap-1 text-sm">
					{#each getDimensionsDisplay(geometry) as { label, value } (label)}
						<div class="flex flex-col gap-0.5">
							<dt class="font-bold">{label}</dt>
							<dd class="flex flex-col pl-2 font-mono">
								{#each value as v, i (i)}
									<span>{v}</span>
								{/each}
							</dd>
						</div>
					{/each}

					{#if geometry.center}
						<div class="flex flex-col gap-0.5">
							<dt class="font-bold">Position</dt>
							<dd class="flex flex-col pl-2 font-mono">
								<span>x: {formatNumber(geometry.center.x)}</span>
								<span>y: {formatNumber(geometry.center.y)}</span>
								<span>z: {formatNumber(geometry.center.z)}</span>
							</dd>
						</div>
					{/if}

					{#if geometry.center?.theta}
						<div class="flex flex-col gap-0.5">
							<dt class="font-bold">Rotation</dt>
							<dd class="pl-2 font-mono">
								θ: {formatNumber(geometry.center.theta)}°
							</dd>
						</div>
					{/if}
				</dl>
			{/snippet}
		</Expandable>
	{/each}

	{#if geometries.referenceFrame}
		<div class="text-subtle-2 mt-1 px-1 text-xs">
			Reference frame: <span class="font-mono">{geometries.referenceFrame}</span>
		</div>
	{/if}
</div>
