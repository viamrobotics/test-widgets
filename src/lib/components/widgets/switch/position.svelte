<script lang="ts">
	import type { Attachment } from 'svelte/attachments'

	import { Select, ToggleButtons } from '@viamrobotics/prime-controls'

	import { choosePositionLayout, type PositionLayout, type PositionWidths } from './position-layout'

	interface Props {
		numPositions: number
		labels: string[]
		currentPosition: number
		onSelect: (position: number) => void
		/** True while a pick is in flight: the group is drawn busy and disabled. @default false */
		isBusy?: boolean
	}

	const LABEL = 'Position'
	// ToggleButtons renders its items inside one `role="radiogroup"` element, which is the row to measure.
	const TOGGLE_GROUP_SELECTOR = '[role="radiogroup"]'

	const { numPositions, labels, currentPosition, onSelect, isBusy = false }: Props = $props()

	// Values are indices, so two positions with the same label stay two options.
	const items = $derived(
		Array.from({ length: numPositions }, (_, index) => ({
			value: String(index),
			label: labels[index] ?? String(index),
		}))
	)

	const selectedValue = $derived(String(currentPosition))

	// The selection follows GetPosition only, so a pick sends SetPosition and leaves the value alone.
	const getSelectedValue = () => selectedValue
	const selectPosition = (next: string | undefined) => {
		if (next === undefined || next === '' || next === selectedValue) return
		onSelect(Number(next))
	}

	let layout = $state<PositionLayout>('select')
	let measuredWidths: PositionWidths | undefined
	let availableWidth: number | undefined

	const applyLayout = () => {
		if (measuredWidths === undefined || availableWidth === undefined) return
		layout = choosePositionLayout(measuredWidths, availableWidth, layout)
	}

	const observeSize = (node: HTMLElement, onResize: () => void) => {
		const observer = new ResizeObserver(onResize)
		observer.observe(node)
		return () => {
			observer.disconnect()
		}
	}

	// A new item list or a late web font resizes the copy, so its own size is the signal to re-measure.
	const measureProbe: Attachment<HTMLElement> = (probe) =>
		observeSize(probe, () => {
			const group = probe.querySelector(TOGGLE_GROUP_SELECTOR)
			if (!group) return
			measuredWidths = {
				beside: probe.getBoundingClientRect().width,
				under: group.getBoundingClientRect().width,
			}
			applyLayout()
		})

	// Observes a zero-height row, not the root, so a layout swap that changes the root's height
	// cannot trigger a second resize in the same frame, which the browser reports as a loop error.
	const measureRoom: Attachment<HTMLElement> = (rowSizer) =>
		observeSize(rowSizer, () => {
			availableWidth = rowSizer.getBoundingClientRect().width
			applyLayout()
		})

	const labelId = $props.id()
</script>

{#snippet toggleItems(itemClass: string)}
	{#each items as item (item.value)}
		<ToggleButtons.Item
			value={item.value}
			class={itemClass}
		>
			{item.label}
		</ToggleButtons.Item>
	{/each}
{/snippet}

<div
	class="relative min-w-0"
	aria-busy={isBusy}
>
	<div
		{@attach measureRoom}
		class="h-0"
	></div>
	<!-- The unwrapped copy the layout is measured from. Every item is semibold, the widest any selection draws. -->
	<div
		aria-hidden="true"
		class="pointer-events-none invisible absolute top-0 left-0 size-0 overflow-hidden whitespace-nowrap"
	>
		<div
			{@attach measureProbe}
			class="w-max"
		>
			<ToggleButtons
				label={LABEL}
				class="flex-nowrap"
			>
				{@render toggleItems('min-w-6 font-semibold')}
			</ToggleButtons>
		</div>
	</div>

	{#if layout === 'select'}
		<div class="flex items-center gap-2">
			<span
				id={labelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				{LABEL}
			</span>
			<div class="min-w-0 flex-1">
				<Select
					{items}
					bind:value={getSelectedValue, selectPosition}
					aria-labelledby={labelId}
					disabled={isBusy}
				/>
			</div>
		</div>
	{:else}
		<ToggleButtons
			label={LABEL}
			bind:value={getSelectedValue, selectPosition}
			disabled={isBusy}
			class={layout === 'under' ? 'flex-wrap' : 'flex-nowrap'}
		>
			{@render toggleItems('min-w-6')}
		</ToggleButtons>
	{/if}
</div>
