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

{#snippet row(term: string, def: string)}
	<dt
		class="bg-light border-light text-subtle-1 wrap-break-words content-center items-center border-r border-b px-1 whitespace-normal nth-last-[2]:border-b-0"
	>
		model {term}
	</dt>
	<dd
		class="border-light wrap-break-words content-center items-center border-r border-b p-1 whitespace-normal last:border-b-0"
	>
		{def || '-'}
	</dd>
{/snippet}

<dl class="border-light grid grid-cols-2 flex-col border border-b-0 text-xs">
	{@render row('name', name)}
	{@render row('description', description)}
	{@render row('type', type)}
</dl>

<dl class="border-light border border-b-0 text-xs">
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
