<script lang="ts">
	import type { Orientation } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		data: Orientation
	}

	const { data }: Props = $props()
</script>

<dl class="flex flex-col gap-2">
	<div class="flex flex-wrap gap-x-4 gap-y-2 font-mono">
		<div>
			<dt class="text-subtle-2 inline-block uppercase">x</dt>
			<dd class="inline-block">
				{formatNumeric(data.oX)}
			</dd>
		</div>

		<div>
			<dt class="text-subtle-2 inline-block uppercase">y</dt>
			<dd class="inline-block">
				{formatNumeric(data.oY)}
			</dd>
		</div>

		<div>
			<dt class="text-subtle-2 inline-block uppercase">z</dt>
			<dd class="inline-block">
				{formatNumeric(data.oZ)}
			</dd>
		</div>

		<div>
			<dt class="text-subtle-2 inline-block italic">θ</dt>
			<dd class="inline-block">
				{formatNumeric(data.theta)}
			</dd>
		</div>
	</div>
</dl>
