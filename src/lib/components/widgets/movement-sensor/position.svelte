<script lang="ts">
	import type { MovementSensorPosition } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		data: MovementSensorPosition
	}

	const { data }: Props = $props()

	const MISSING_VALUE = '-'

	const COORDINATE_DECIMALS = 6
	const DEFAULT_DECIMALS = 2

	const formatOrMissing = (value: number | undefined, decimals = DEFAULT_DECIMALS) =>
		value === undefined ? MISSING_VALUE : formatNumeric(value, decimals)

	const showsUnit = (value: number | undefined) => value !== undefined

	const latitudeId = $props.id()
	const longitudeId = `${latitudeId}-longitude`
	const altitudeId = `${latitudeId}-altitude`
</script>

<div class="flex min-w-0 flex-col gap-2">
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={latitudeId}
			class="text-subtle-1 w-16 shrink-0 text-xs">Latitude</span
		>
		<span
			role="group"
			aria-labelledby={latitudeId}
			class="readout font-roboto-mono"
		>
			<span class="readout-value"
				>{formatOrMissing(data.coordinate?.latitude, COORDINATE_DECIMALS)}</span
			>
			{#if showsUnit(data.coordinate?.latitude)}
				<span class="readout-suffix">°</span>
			{/if}
		</span>
	</div>

	<div class="flex min-w-0 items-center gap-2">
		<span
			id={longitudeId}
			class="text-subtle-1 w-16 shrink-0 text-xs">Longitude</span
		>
		<span
			role="group"
			aria-labelledby={longitudeId}
			class="readout font-roboto-mono"
		>
			<span class="readout-value"
				>{formatOrMissing(data.coordinate?.longitude, COORDINATE_DECIMALS)}</span
			>
			{#if showsUnit(data.coordinate?.longitude)}
				<span class="readout-suffix">°</span>
			{/if}
		</span>
	</div>

	<div class="flex min-w-0 items-center gap-2">
		<span
			id={altitudeId}
			class="text-subtle-1 w-16 shrink-0 text-xs">Altitude</span
		>
		<span
			role="group"
			aria-labelledby={altitudeId}
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{formatOrMissing(data.altitudeM)}</span>
			{#if showsUnit(data.altitudeM)}
				<span class="readout-suffix">m</span>
			{/if}
		</span>
	</div>
</div>
