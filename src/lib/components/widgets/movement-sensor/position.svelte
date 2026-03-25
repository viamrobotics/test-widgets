<script lang="ts">
	import type { MovementSensorPosition } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		data: MovementSensorPosition
	}

	const { data }: Props = $props()
</script>

<dl class="flex flex-col gap-2 font-mono">
	<div class="flex justify-between gap-2">
		<dt class="text-subtle-1 uppercase">Lat</dt>
		<dd>
			{formatNumeric(data.coordinate?.latitude, 6)}
		</dd>
	</div>

	<div class="flex justify-between gap-2">
		<dt class="text-subtle-1 uppercase">Lng</dt>
		<dd>
			{formatNumeric(data.coordinate?.longitude, 6)}
		</dd>
	</div>

	<div class="flex justify-between gap-2">
		<dt class="text-subtle-1 uppercase">Alt (m)</dt>
		<dd>{formatNumeric(data.altitudeM)}</dd>
	</div>
</dl>
