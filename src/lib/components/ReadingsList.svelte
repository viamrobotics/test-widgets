<script lang="ts">
	import CopyButton from '#lib/components/CopyButton.svelte'
	import { sortObjectKeys } from '#lib/sort.js'
	import { truncate } from 'lodash-es'

	interface Props {
		data: Record<string, unknown>
		/** Draws the Copy JSON corner button. A host that draws its own turns this off. */
		showCopy?: boolean
	}

	const { data, showCopy = true }: Props = $props()

	const MISSING_VALUE = '-'

	const sortedData = $derived(Object.entries(sortObjectKeys(data)))

	const dataJSON = $derived(JSON.stringify(data, null, 2))
</script>

{#if sortedData.length === 0}
	<p class="text-subtle-2 text-xs">{MISSING_VALUE}</p>
{:else}
	<div class="text-xs">
		{#if showCopy}
			<div class="text-gray-6 absolute top-1.5 right-1.5">
				<CopyButton
					data={dataJSON}
					ariaLabel="Copy JSON"
				/>
			</div>
		{/if}
		<div class="@container">
			<dl class="font-roboto-mono flex flex-col gap-y-2">
				{#each sortedData as [key, value] (key)}
					{@const valueString = JSON.stringify(value, null, 2)}
					<div class="flex flex-col gap-1 @min-[228px]:flex-row @min-[228px]:gap-0">
						<dt
							class="text-default w-26 shrink-0 truncate py-1 pr-2 font-medium"
							title={key}
						>
							{key}
						</dt>
						{#if value !== null && typeof value === 'object'}
							<dd
								class="border-light bg-extralight min-w-0 flex-1 border px-3 py-2 wrap-break-word"
							>
								<pre class="whitespace-pre-wrap"><code>{valueString}</code></pre>
							</dd>
						{:else if typeof value === 'string' && value.startsWith('data:image/')}
							<dd class="min-w-0 flex-1">
								<img
									class="max-h-80 max-w-full"
									src={value}
									alt={key}
								/>
							</dd>
						{:else if typeof value === 'string'}
							<dd class="text-default min-w-0 flex-1 py-1 wrap-break-word">
								{truncate(valueString, { length: 300 })}
							</dd>
						{:else}
							<dd class="readout">
								{truncate(valueString, { length: 300 })}
							</dd>
						{/if}
					</div>
				{/each}
			</dl>
		</div>
	</div>
{/if}
