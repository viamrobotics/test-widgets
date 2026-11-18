<script lang="ts">
	import {
		mdiChevronRight,
		mdiClose,
		mdiCursorMove,
		mdiDockLeft,
		mdiLayersTripleOutline,
	} from '@mdi/js'
	import { type PaneNode, Panes, type PaneState } from '@viamrobotics/prime-panes'
	import { Icon } from '@viamrobotics/prime-ui'

	import ResourceIcon from '$lib/components/resource-icon.svelte'
	import { Section } from '$lib/components/section'

	import {
		type ResourcePane,
		resourcePaneAPI,
		resourcePaneLabel,
		resourcePaneMethod,
	} from './resource-pane'
	import { resourcePaneBodyMinWidth } from './resource-pane-minimums'

	interface Props {
		node: PaneNode<ResourcePane>
		paneState: PaneState
		partID: string
		/** Removes the floating window with this entry id. */
		onclose: (floatEntryId: string) => void
	}

	const { node, paneState, partID, onclose }: Props = $props()

	const pane = $derived(node.data)
	const method = $derived(resourcePaneMethod(pane))
	const label = $derived(resourcePaneLabel(pane))
	const widgets = $derived(pane.kind === 'composite' ? [pane.widget] : pane.entry.widgets)
	const bodyMinWidth = $derived(resourcePaneBodyMinWidth(pane))
</script>

{#snippet tab(tabNode: PaneNode<ResourcePane>)}
	{@const tabMethod = resourcePaneMethod(tabNode.data)}
	<span class="flex min-w-0 items-center gap-1">
		<span class="truncate">{tabNode.data.resource.name}</span>
		{#if tabMethod}
			<Icon
				icon={mdiChevronRight}
				size="sm"
				class="text-subtle-2 shrink-0"
			/>
			<span class="shrink-0">{tabMethod}</span>
		{/if}
	</span>
{/snippet}

{#snippet frame()}
	<div
		data-pane-id={node.id}
		class="border-light text-default flex size-full flex-col border bg-white text-xs"
	>
		<!-- The whole header drags the pane. Every field stays in the body, outside the trigger. -->
		<Panes.DragTrigger target={paneState.isFloating ? 'float' : 'pane'}>
			<div
				data-pane-header
				class="border-light bg-light flex min-w-0 cursor-grab items-center gap-1 border-b px-2 py-1 active:cursor-grabbing"
			>
				<span
					aria-hidden="true"
					class="flex shrink-0"
				>
					<ResourceIcon type="component" />
				</span>
				{#if method}
					<h2
						class="flex min-w-0 flex-1 items-center gap-1 px-1 font-semibold in-data-stacked:hidden"
					>
						<span class="text-subtle-1 truncate">{pane.resource.name}</span>
						<Icon
							icon={mdiChevronRight}
							size="sm"
							class="text-subtle-2 shrink-0"
						/>
						<span class="shrink-0"><Section.Method /></span>
					</h2>
				{:else}
					<h2 class="min-w-0 flex-1 truncate px-1 font-semibold in-data-stacked:hidden">
						{pane.resource.name}
					</h2>
				{/if}
				<Panes.TabList
					{tab}
					aria-label="Stacked panes"
					class="flex min-w-0 gap-1 in-data-stacked:flex-1"
				>
					<Panes.TabListDropRegion
						class="border-info-medium absolute inset-x-0 top-0 hidden h-4 border-t-2 border-dashed in-data-dragging:block in-data-move-mode:block"
					/>
				</Panes.TabList>
				<div class="flex shrink-0 items-center gap-1">
					{#if method}
						<Section.Docs />
						<Section.Errors />
					{/if}
					{#if paneState.isFloating}
						<Panes.MoveTrigger
							target="float"
							aria-label="Dock {label}"
							class="icon-button size-6"
							data-pane-focus
						>
							<Icon
								icon={mdiDockLeft}
								size="sm"
							/>
						</Panes.MoveTrigger>
						<button
							type="button"
							aria-label="Close {label}"
							class="icon-button size-6"
							onclick={() => {
								if (paneState.floatEntryId) onclose(paneState.floatEntryId)
							}}
						>
							<Icon
								icon={mdiClose}
								size="sm"
							/>
						</button>
					{:else}
						{#if paneState.isStacked}
							<Panes.MoveTrigger
								target="stack"
								aria-label="Move stack"
								class="icon-button size-6"
							>
								<Icon
									icon={mdiLayersTripleOutline}
									size="sm"
								/>
							</Panes.MoveTrigger>
						{/if}
						<Panes.MoveTrigger
							aria-label="Move {label}"
							class="icon-button size-6"
							data-pane-focus
						>
							<Icon
								icon={mdiCursorMove}
								size="sm"
							/>
						</Panes.MoveTrigger>
					{/if}
				</div>
			</div>
		</Panes.DragTrigger>
		<Panes.PaneBody class="flex min-h-0 flex-1 flex-col overflow-auto">
			{#if method}
				<Section.Loading />
			{/if}
			<div style:min-width="{bodyMinWidth}px">
				{#each widgets as Widget, index (index)}
					<Widget
						{partID}
						resourceName={pane.resource.name}
					/>
				{/each}
			</div>
		</Panes.PaneBody>
	</div>
{/snippet}

<!-- One scope per single-API pane, so its header reads the method, docs, and errors of its body. -->
{#if method}
	<Section.Scope
		{method}
		api={resourcePaneAPI(pane)}
	>
		{@render frame()}
	</Section.Scope>
{:else}
	{@render frame()}
{/if}
