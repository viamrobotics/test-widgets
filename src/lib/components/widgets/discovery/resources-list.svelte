<script lang="ts">
	import { Button, IconButton, Tooltip } from '@viamrobotics/prime-core';
	import type { appRobotApi } from '@viamrobotics/sdk';

	import { sortObjectKeys } from '$lib/sort';

	import type { ComponentPreviews, ComponentPreviewSnippet } from './component-preview';
	import { parseComponentConfig, transformComponentConfig } from './transform-component-config';

	interface Props {
		data: appRobotApi.ComponentConfig[];
		/** A map of generated component preview IDs to component previews. */
		previews: ComponentPreviews;
		/** A snippet for creating component previews. Requires a `preview` DoCommand to be implemented. */
		componentPreview?: ComponentPreviewSnippet | undefined;
		onAddComponent?: ((component: appRobotApi.ComponentConfig) => void) | undefined;
	}

	const {
		data,
		previews,
		onAddComponent = undefined,
		componentPreview = undefined
	}: Props = $props();

	const sortedData = $derived(
		data
			.toSorted(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB))
			.map((value) => sortObjectKeys(transformComponentConfig(value)))
	);

	const copyToClipboard = async () => {
		try {
			const resourcesStr = JSON.stringify(data, null, 2);
			await window.navigator.clipboard.writeText(resourcesStr);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('failed to copy resources to clipboard', error);
		}
	};

	const copyAttributes = async (value: Record<string, unknown>) => {
		try {
			const attributesStr = JSON.stringify(value.attributes ?? {}, null, 2);
			await window.navigator.clipboard.writeText(attributesStr);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('failed to copy attributes to clipboard', error);
		}
	};
</script>

{#if sortedData.length === 0}
	<p class="text-subtle-2 text-xs">No resources discovered</p>
{:else}
	<div class="text-xs">
		<div class="text-gray-6 absolute top-1.5 right-1.5">
			<Tooltip let:tooltipID>
				<IconButton
					aria-describedby={tooltipID}
					icon="content-copy"
					label="Copy all configs"
					on:click={copyToClipboard}
				/>

				<div slot="description">Copy JSON</div>
			</Tooltip>
		</div>
		<dl class="font-roboto-mono flex flex-col gap-y-4">
			{#each sortedData as value (value)}
				{@const valueString = JSON.stringify(value, null, 2)}
				{@const preview = previews[value.name]}
				<div class="flex flex-col gap-y-2">
					<div class="flex flex-row">
						<dt class="text-default flex w-50 min-w-50 flex-col gap-2 pr-2 font-medium">
							<span class="truncate">{value.name}</span>
							{#if onAddComponent}
								<Button
									class="w-fit"
									icon="plus"
									onclick={() => onAddComponent(parseComponentConfig(value))}
								>
									Add component
								</Button>
							{/if}
							<Button
								class="w-fit"
								icon="content-copy"
								onclick={async () => copyAttributes(value)}
							>
								Copy attributes
							</Button>
						</dt>
						<dd class="text-subtle-1 min-w-50">
							<div class="border-light bg-extralight relative min-w-50 border px-3 py-2">
								<pre class="whitespace-pre-wrap"><code>{valueString}</code></pre>
							</div>
						</dd>
					</div>
					{#if preview}
						<div class="flex w-full pl-50">
							{@render componentPreview?.(preview)}
						</div>
					{/if}
				</div>
			{/each}
		</dl>
	</div>
{/if}
