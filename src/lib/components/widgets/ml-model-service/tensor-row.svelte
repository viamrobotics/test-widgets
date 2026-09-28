<script lang="ts">
	import type { TensorInfo } from '@viamrobotics/sdk'

	interface Props {
		type: 'input' | 'output'
		tensor: TensorInfo
		index: number
	}

	const { type, tensor, index }: Props = $props()
</script>

{#snippet row(term: string, def: string)}
	<dt
		class="border-light wrap-break-words content-center items-center border-r border-b p-1 whitespace-normal"
	>
		{term}
	</dt>
	<dd
		class="border-light wrap-break-words content-center items-center border-b p-1 pl-3 whitespace-normal"
	>
		{def || '-'}
	</dd>
{/snippet}

<figure class="border-light w-full border-b-0">
	<figcaption
		class="bg-light border-light text-subtle-1 wrap-break-words content-center items-center border-b p-1 whitespace-normal"
	>
		{type} tensor {index}
	</figcaption>
	<dl class="grid grid-cols-2">
		{@render row('name', tensor.name)}
		{@render row('shape', `${tensor.shape}`)}
		{@render row('type', tensor.dataType)}
	</dl>
</figure>
