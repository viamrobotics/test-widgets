<script lang="ts">
	import type { TensorInfo } from '@viamrobotics/sdk'

	interface Props {
		type: 'input' | 'output'
		tensor: TensorInfo
		index: number
	}

	const { type, tensor, index }: Props = $props()
</script>

<div class="border-b-light grid grid-cols-2 border-b">
	<dt class="table-header table-header-cell">
		{type} tensor {index}
	</dt>
	<dd>
		<dl class="grid grid-cols-2">
			<dt class="border-l-light flex! table-cell min-h-6! border-l py-0!">name</dt>
			<dd class="border-l-light flex! table-cell min-h-6! border-l py-0!">
				{tensor.name || '-'}
			</dd>
			<dt class="border-l-light flex! table-cell min-h-6! border-l py-0!">shape</dt>
			<dd class="border-l-light flex! table-cell min-h-6! border-l py-0!">
				{tensor.shape || '-'}
			</dd>
			<dt class="border-l-light flex! table-cell min-h-6! border-b-0 border-l py-0!">type</dt>
			<dd class="border-l-light flex! table-cell min-h-6! border-b-0 border-l py-0!">
				{tensor.dataType || '-'}
			</dd>
		</dl>
	</dd>
</div>
