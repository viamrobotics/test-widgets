<script lang="ts">
	import type { MovementSensorAccuracy } from '@viamrobotics/sdk'

	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	import { formatNumeric } from '$lib/format'

	interface Props {
		data: MovementSensorAccuracy
	}

	const { data }: Props = $props()

	const PositionNmeaGgaFixes = {
		INVALID: 0,
		GPS: 1,
		DG: 2,
		RTK: 4,
		FRTK: 5,
	}

	const nmeaFix = $derived(data.positionNmeaGgaFix)
</script>

<dl class="flex flex-col gap-2">
	<div class="flex w-3/4 justify-between gap-2 font-mono">
		<dt class="text-subtle-1 flex flex-row gap-2">
			<span class="uppercase">fix quality</span>
			{#if nmeaFix === PositionNmeaGgaFixes.GPS || nmeaFix === PositionNmeaGgaFixes.DG}
				<Tooltip location="bottom">
					<p slot="description">Expect 1-5m accuracy.</p>

					<Icon
						name="information-outline"
						cx="text-subtle-2"
					/>
				</Tooltip>
			{:else if nmeaFix === PositionNmeaGgaFixes.RTK || nmeaFix === PositionNmeaGgaFixes.FRTK}
				<Tooltip location="bottom">
					<p>Expect 2-50cm accuracy.</p>

					<Icon
						name="information-outline"
						cx="text-subtle-2"
					/>
				</Tooltip>
			{/if}
		</dt>
		<dd>
			{#if nmeaFix === PositionNmeaGgaFixes.INVALID}
				Invalid
			{:else if nmeaFix === PositionNmeaGgaFixes.GPS}
				GPS
			{:else if nmeaFix === PositionNmeaGgaFixes.DG}
				DGPS/DGNSS
			{:else if nmeaFix === PositionNmeaGgaFixes.RTK}
				RTK
			{:else if nmeaFix === PositionNmeaGgaFixes.FRTK}
				FRTK
			{/if}
		</dd>
	</div>
	<div class="flex w-3/4 justify-between gap-2 font-mono">
		<dt class="text-subtle-1 uppercase">HDOP</dt>
		<dd>{formatNumeric(data.positionHdop)}</dd>
	</div>
	<div class="flex w-3/4 justify-between gap-2 font-mono">
		<dt class="text-subtle-1 uppercase">VDOP</dt>
		<dd>{formatNumeric(data.positionVdop)}</dd>
	</div>
</dl>
