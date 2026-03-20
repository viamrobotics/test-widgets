<script lang="ts">
	import type { Vector3 } from '@viamrobotics/sdk';

	import { formatNumeric } from '$lib/format';

	interface Props {
		data: Vector3;
	}

	const { data }: Props = $props();
</script>

<dl class="flex flex-col gap-2">
	<div class="flex flex-wrap gap-x-4 gap-y-2 font-mono">
		<div>
			<dt class="text-subtle-2 inline-block uppercase">x</dt>
			<dd class="inline-block">
				{formatNumeric(data.x)}
			</dd>
		</div>

		<div>
			<dt class="text-subtle-2 inline-block uppercase">y</dt>
			<dd class="inline-block">
				{formatNumeric(data.y)}
			</dd>
		</div>

		<div>
			<dt class="text-subtle-2 inline-block uppercase">z</dt>
			<dd class="inline-block">
				{formatNumeric(data.z)}
			</dd>
		</div>
	</div>
</dl>
