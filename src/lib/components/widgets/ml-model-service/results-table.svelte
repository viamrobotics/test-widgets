<script lang="ts">
	import type { Metadata } from '@viamrobotics/sdk'

	import TensorRow from './tensor-row.svelte'

	interface Props {
		metadata: Metadata
	}

	const { metadata }: Props = $props()

	const name = $derived(metadata.name)
	const description = $derived(metadata.description)
	const type = $derived(metadata.type)
	const inputInfo = $derived(metadata.inputInfo)
	const outputInfo = $derived(metadata.outputInfo)
</script>

<dl class="table-container grid min-w-0! grid-cols-2 text-xs">
	<dt class="table-header table-header-cell h-auto min-h-6">model name</dt>
	<dd class="border-l-light flex! table-cell min-h-6! border-l py-0!">
		{name || '-'}
	</dd>
	<dt class="table-header table-header-cell h-auto min-h-6">model description</dt>
	<dd class="border-l-light flex! table-cell min-h-6! border-l py-0!">
		{description || '-'}
	</dd>
	<dt class="table-header table-header-cell h-auto min-h-6 border-b-0">model type</dt>
	<dd class="border-l-light flex! table-cell min-h-6! border-b-0 border-l py-0!">
		{type || '-'}
	</dd>
</dl>

<dl class="table-container min-w-0! text-xs">
	{#each inputInfo as tensor, index (index)}
		<TensorRow
			type="input"
			{tensor}
			{index}
		/>
	{/each}
	{#each outputInfo as tensor, index (index)}
		<TensorRow
			type="output"
			{tensor}
			{index}
		/>
	{/each}
</dl>
