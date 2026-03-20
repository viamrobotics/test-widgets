<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';

	import { Icon } from '@viamrobotics/prime-core';
	import type { Classification } from '@viamrobotics/sdk';

	import { useDetections } from './context.svelte';

	interface Props {
		classifications?: Classification[];
		detectionsSupported: boolean;
		classificationsSupported: boolean;
	}

	const { classifications = [], detectionsSupported, classificationsSupported }: Props = $props();

	const context = useDetections();

	let hoveredLabel = $state<keyof typeof context.byLabel>();

	const expandedLabels = new SvelteSet<string>();

	let selectedTab = $state<'detections' | 'classifications'>(
		detectionsSupported ? 'detections' : 'classifications'
	);

	const toggleExpand = (label: string) => {
		if (expandedLabels.has(label)) {
			expandedLabels.delete(label);
		} else {
			expandedLabels.add(label);
		}
	};

	$effect.pre(() => {
		if (hoveredLabel === undefined) {
			context.hovered.clear();
		} else {
			const data = context.byLabel[hoveredLabel];

			if (data) {
				for (const detection of data.detections) {
					context.hovered.add(detection.id);
				}
			}
		}
	});

	const compareConfidence = (a: Classification, b: Classification) => {
		return b.confidence - a.confidence;
	};

	const sortedClassifications = $derived(classifications.toSorted(compareConfidence));
</script>

<div class="flex">
	{#if detectionsSupported}
		<button
			class="grow border-b {selectedTab === 'detections' ? 'border-black' : ''}"
			onclick={() => (selectedTab = 'detections')}>Labels</button
		>
	{/if}

	{#if classificationsSupported}
		<button
			class="grow border-b px-4 py-1 {selectedTab === 'classifications' ? 'border-black' : ''}"
			onclick={() => (selectedTab = 'classifications')}
		>
			Classifications
		</button>
	{/if}
</div>

<div class="overflow-x-hidden overflow-y-auto py-2 text-sm">
	{#if selectedTab === 'classifications'}
		<ul class="flex flex-col gap-2">
			{#each sortedClassifications.slice(0, 100) as classification (classification)}
				<li class="bg-light flex justify-between gap-2 rounded px-2 py-1">
					<span class="text-ellipsis">{classification.className}</span>
					<span>{(classification.confidence * 100).toFixed(2)}%</span>
				</li>
			{/each}
		</ul>
	{:else if selectedTab === 'detections'}
		<ul>
			{#each Object.entries(context.byLabel) as [label, { detections, color }] (label)}
				<li>
					<button
						aria-label={label}
						class="hover:bg-light flex w-full items-center justify-between gap-2 py-1 pr-1"
						onpointerover={() => (hoveredLabel = label)}
						onpointerleave={() => (hoveredLabel = undefined)}
						onclick={() => toggleExpand(label)}
					>
						<div class="flex items-center gap-2">
							<Icon
								name="chevron-right"
								cx="text-gray-6 {expandedLabels.has(label) ? 'rotate-90' : ''}"
							/>
							<div
								class="h-3 w-3"
								style:background-color={color}
							></div>
							{label}
						</div>

						<div class="bg-medium rounded px-2 py-1 text-xs">
							{detections.length}
						</div>
					</button>
				</li>
				{#if expandedLabels.has(label)}
					<ul>
						{#each detections as detection (detection.id)}
							<li>
								<button
									class="hover:bg-light w-full py-1 pl-11 text-left {context.hovered.has(
										detection.id
									)
										? 'bg-light'
										: ''}"
									onpointerenter={() => context.hovered.add(detection.id)}
									onpointerleave={() => context.hovered.delete(detection.id)}
								>
									{label}
									<span class="text-subtle-2 pl-1">{detection.confidence}%</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			{/each}
		</ul>
	{/if}
</div>
