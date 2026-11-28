<script lang="ts">
	import type { Classification } from '@viamrobotics/sdk'

	import { mdiChevronRight } from '@mdi/js'
	import { ToggleButtons } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { SvelteSet } from 'svelte/reactivity'

	import { useDetections } from './context.svelte'
	import DetectionRow from './DetectionRow.svelte'

	interface Props {
		classifications?: Classification[]
		detectionsSupported: boolean
		classificationsSupported: boolean
	}

	const { classifications = [], detectionsSupported, classificationsSupported }: Props = $props()

	type LegendView = 'detections' | 'classifications'

	const VIEW_ITEMS = [
		{ value: 'detections', label: 'Labels' },
		{ value: 'classifications', label: 'Classifications' },
	]

	const MAX_CLASSIFICATIONS = 100

	const context = useDetections()

	let hoveredLabel = $state<keyof typeof context.byLabel>()

	const expandedLabels = new SvelteSet<string>()

	let selectedView = $derived<LegendView>(detectionsSupported ? 'detections' : 'classifications')

	const isLegendView = (value: string | undefined): value is LegendView =>
		value === 'detections' || value === 'classifications'

	const getSelectedView = () => selectedView
	const selectView = (next: string | undefined) => {
		if (isLegendView(next)) selectedView = next
	}

	const toggleExpand = (label: string) => {
		if (expandedLabels.has(label)) {
			expandedLabels.delete(label)
		} else {
			expandedLabels.add(label)
		}
	}

	$effect.pre(() => {
		if (hoveredLabel === undefined) {
			context.hovered.clear()
		} else {
			const data = context.byLabel[hoveredLabel]

			if (data) {
				for (const detection of data.detections) {
					context.hovered.add(detection.id)
				}
			}
		}
	})

	$effect.pre(() => {
		if (context.selected === undefined) return
		for (const [label, { detections }] of Object.entries(context.byLabel)) {
			if (detections.some((d) => d.id === context.selected)) {
				expandedLabels.add(label)
				break
			}
		}
	})

	const compareConfidence = (a: Classification, b: Classification) => {
		return b.confidence - a.confidence
	}

	const sortedClassifications = $derived(classifications.toSorted(compareConfidence))
</script>

<div class="flex flex-col gap-1 text-xs">
	{#if detectionsSupported && classificationsSupported}
		<ToggleButtons
			aria-label="Legend view"
			items={VIEW_ITEMS}
			bind:value={getSelectedView, selectView}
		/>
	{/if}

	{#if selectedView === 'classifications'}
		<ul
			aria-label="Classifications"
			class="flex flex-col gap-0.5"
		>
			{#each sortedClassifications.slice(0, MAX_CLASSIFICATIONS) as classification (classification)}
				<li class="flex min-w-0 items-center justify-between gap-2">
					<span class="text-subtle-1 min-w-0 truncate">{classification.className}</span>
					<span class="readout font-roboto-mono shrink-0">
						<span class="readout-value">{(classification.confidence * 100).toFixed(2)}</span>
						<span class="readout-suffix">%</span>
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<ul
			aria-label="Labels"
			class="flex flex-col"
		>
			{#each Object.entries(context.byLabel) as [label, { detections, color }] (label)}
				{@const isExpanded = expandedLabels.has(label)}
				<li>
					<button
						type="button"
						aria-label={label}
						aria-expanded={isExpanded}
						class="button button-ghost button-compact w-full justify-start"
						onpointerover={() => (hoveredLabel = label)}
						onpointerleave={() => (hoveredLabel = undefined)}
						onclick={() => {
							toggleExpand(label)
						}}
					>
						<Icon
							icon={mdiChevronRight}
							size="sm"
							class={['text-subtle-2 shrink-0', isExpanded && 'rotate-90']}
						/>
						<span
							aria-hidden="true"
							class="size-3 shrink-0"
							style:background-color={color}
						></span>
						<span class="min-w-0 truncate">{label}</span>
						<span class="pill ml-auto">{detections.length}</span>
					</button>
					{#if isExpanded}
						<ul
							aria-label="{label} detections"
							class="flex flex-col pl-6"
						>
							{#each detections as detection (detection.id)}
								<li>
									<DetectionRow {detection}>
										{#snippet label()}{detection.className}{/snippet}
									</DetectionRow>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
