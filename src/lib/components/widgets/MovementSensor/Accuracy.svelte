<script lang="ts">
	import type { MovementSensorAccuracy } from '@viamrobotics/sdk'

	import { mdiInformationOutline } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { formatNumeric } from '#lib/format.js'

	interface Props {
		data: MovementSensorAccuracy
	}

	const { data }: Props = $props()

	const MISSING_VALUE = '-'

	const PositionNmeaGgaFixes = {
		INVALID: 0,
		GPS: 1,
		DG: 2,
		RTK: 4,
		FRTK: 5,
	}

	const formatOrMissing = (value: number | undefined) =>
		value === undefined ? MISSING_VALUE : formatNumeric(value)

	const fixLabel = (fix: number | undefined) => {
		if (fix === PositionNmeaGgaFixes.INVALID) return 'Invalid'
		if (fix === PositionNmeaGgaFixes.GPS) return 'GPS'
		if (fix === PositionNmeaGgaFixes.DG) return 'DGPS/DGNSS'
		if (fix === PositionNmeaGgaFixes.RTK) return 'RTK'
		if (fix === PositionNmeaGgaFixes.FRTK) return 'FRTK'
		return MISSING_VALUE
	}

	const fixHint = (fix: number | undefined) => {
		if (fix === PositionNmeaGgaFixes.GPS || fix === PositionNmeaGgaFixes.DG) {
			return 'Expect 1-5m accuracy.'
		}
		if (fix === PositionNmeaGgaFixes.RTK || fix === PositionNmeaGgaFixes.FRTK) {
			return 'Expect 2-50cm accuracy.'
		}
		return undefined
	}

	const hint = $derived(fixHint(data.positionNmeaGgaFix))

	const id = $props.id()

	const mapEntries = $derived(Object.entries(data.accuracy))

	const rows = $derived([
		{ key: 'hdop', label: 'HDOP', value: formatOrMissing(data.positionHdop), suffix: '' },
		{ key: 'vdop', label: 'VDOP', value: formatOrMissing(data.positionVdop), suffix: '' },
		{
			key: 'compass',
			label: 'Compass error',
			value: formatOrMissing(data.compassDegreesError),
			suffix: '°',
		},
		...mapEntries.map(([name, value]) => ({
			key: `map-${name}`,
			label: name,
			value: formatOrMissing(value),
			suffix: '',
		})),
	])
</script>

<div class="flex min-w-0 flex-col gap-2">
	<div class="flex min-w-0 items-center gap-2">
		<span class="text-subtle-1 flex w-24 shrink-0 items-center gap-1 text-xs">
			<span id="{id}-fix">Fix quality</span>
			{#if hint}
				<Tooltip>
					<Tooltip.Trigger>
						<button
							type="button"
							class="icon-button size-6"
							aria-label="About fix quality"
						>
							<Icon
								icon={mdiInformationOutline}
								size="sm"
							/>
						</button>
					</Tooltip.Trigger>
					<Tooltip.Content>{hint}</Tooltip.Content>
				</Tooltip>
			{/if}
		</span>
		<span
			role="group"
			aria-labelledby="{id}-fix"
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{fixLabel(data.positionNmeaGgaFix)}</span>
		</span>
	</div>

	{#each rows as row (row.key)}
		<div class="flex min-w-0 items-center gap-2">
			<span
				id="{id}-{row.key}"
				class="text-subtle-1 w-24 shrink-0 truncate text-xs">{row.label}</span
			>
			<span
				role="group"
				aria-labelledby="{id}-{row.key}"
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{row.value}</span>
				{#if row.suffix}
					<span class="readout-suffix">{row.suffix}</span>
				{/if}
			</span>
		</div>
	{/each}
</div>
