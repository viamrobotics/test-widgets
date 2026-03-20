<script lang="ts">
	import { truncate } from 'lodash-es';

	import { IconButton, Tooltip } from '@viamrobotics/prime-core';

	import { sortObjectKeys } from '$lib/sort';

	interface Props {
		data: Record<string, unknown>;
	}

	const { data }: Props = $props();

	const sortedData = $derived(Object.entries(sortObjectKeys(data)));

	// TODO(zp) Bring the CopyToClipboard component into the svelte sdk or prime-core so that we can use it here
	const copyToClipboard = async () => {
		try {
			const readingsStr = JSON.stringify(data, null, 2);
			await window.navigator.clipboard.writeText(readingsStr);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('failed to copy reading to clipboard', error);
		}
	};
</script>

{#if sortedData.length === 0}
	<p class="text-subtle-2 text-xs">No readings currently available</p>
{:else}
	<div class="text-xs">
		<div class="text-gray-6 absolute top-1.5 right-1.5">
			<Tooltip let:tooltipID>
				<IconButton
					aria-describedby={tooltipID}
					icon="content-copy"
					label="Copy JSON"
					on:click={copyToClipboard}
				/>

				<div slot="description">Copy JSON</div>
			</Tooltip>
		</div>
		<dl class="font-roboto-mono flex flex-col gap-y-2">
			{#each sortedData as [key, value] (key)}
				{@const valueString = JSON.stringify(value, null, 2)}
				<div class="flex flex-row">
					<dt
						class="text-default w-50 min-w-50 truncate pr-2 font-medium"
						title={key}
					>
						{key}
					</dt>
					<dd class="text-subtle-1 min-w-50">
						{#if typeof value === 'object'}
							<div class="border-light bg-extralight min-w-50 border px-3 py-2">
								<pre class="whitespace-pre-wrap">
                  <code>{valueString}</code>
                </pre>
							</div>
						{:else if typeof value === 'string' && value.startsWith('data:image/')}
							<img
								class="max-h-80"
								src={value}
								alt={key}
							/>
						{:else}
							{truncate(valueString, { length: 300 })}
						{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</div>
{/if}
