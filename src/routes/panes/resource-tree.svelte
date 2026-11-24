<script lang="ts">
	import type { PaneNode } from '@viamrobotics/prime-panes'
	import type { ResourceName } from '@viamrobotics/sdk'

	import { mdiChevronRight } from '@mdi/js'
	import { Tree, type TreeNodeState } from '@viamrobotics/prime-tree'
	import { Icon } from '@viamrobotics/prime-ui'

	import ResourceIcon from '$lib/components/resource-icon.svelte'

	import {
		compositePane,
		entryPanes,
		type ResourcePane,
		resourcePaneTreeLabel,
	} from './resource-pane'

	interface Props {
		resources: ResourceName[]
		/** The pane id of the last pick, shown as the selected row. */
		selected: string | undefined
		onpick: (pane: PaneNode<ResourcePane>) => void
	}

	const { resources, selected, onpick }: Props = $props()

	interface ResourceTreeNode {
		pane: PaneNode<ResourcePane>
		children?: ResourceTreeNode[]
	}

	const nodes = $derived(
		resources.flatMap((resource): ResourceTreeNode[] => {
			const composite = compositePane(resource)
			if (!composite) return []
			return [{ pane: composite, children: entryPanes(resource).map((pane) => ({ pane })) }]
		})
	)

	const panesById = $derived(
		new Map(
			nodes.flatMap((node) => [node, ...(node.children ?? [])]).map(({ pane }) => [pane.id, pane])
		)
	)

	// Every resource starts open. The first toggle takes over from that default.
	let toggledExpanded = $state<string[]>()
	const expanded = $derived(toggledExpanded ?? nodes.map(({ pane }) => pane.id))

	const pick = (values: string[]) => {
		const pane = panesById.get(values.at(0) ?? '')
		if (pane) onpick(pane)
	}

	const ROW_CLASSES =
		'focus-ring flex min-w-0 cursor-pointer items-center gap-1 rounded-sm py-1 pr-2 text-sm hover:bg-light data-[selected]:bg-medium data-[disabled]:cursor-not-allowed data-[disabled]:text-disabled'
</script>

<Tree
	{nodes}
	nodeToValue={({ pane }) => pane.id}
	nodeToString={({ pane }) => resourcePaneTreeLabel(pane.data)}
	nodeToChildren={({ children }) => children}
	bind:expanded={() => expanded, (next) => (toggledExpanded = next)}
	bind:selected={() => (selected ? [selected] : []), pick}
	branchClick="select"
	aria-label="Resources"
	class="flex flex-col"
>
	{#snippet node(item: ResourceTreeNode, state: TreeNodeState)}
		{#if state.isBranch}
			<Tree.Branch>
				<Tree.BranchControl
					class={ROW_CLASSES}
					style="padding-inline-start: calc((var(--depth) - 1) * 1rem + 0.25rem)"
				>
					<Tree.BranchTrigger
						class="flex items-center"
						aria-label={state.expanded ? 'Collapse' : 'Expand'}
					>
						<Tree.Indicator
							class="text-subtle-1 flex transition-transform data-[state=open]:rotate-90 motion-reduce:transition-none"
						>
							<Icon
								icon={mdiChevronRight}
								size="sm"
							/>
						</Tree.Indicator>
					</Tree.BranchTrigger>
					<span
						aria-hidden="true"
						class="flex shrink-0"
					>
						<ResourceIcon type="component" />
					</span>
					<span class="truncate">{resourcePaneTreeLabel(item.pane.data)}</span>
				</Tree.BranchControl>
				<Tree.BranchContent />
			</Tree.Branch>
		{:else}
			<Tree.Item
				class={ROW_CLASSES}
				style="padding-inline-start: calc(var(--depth) * 1rem + 0.25rem)"
			>
				<span class="truncate">{resourcePaneTreeLabel(item.pane.data)}</span>
			</Tree.Item>
		{/if}
	{/snippet}
</Tree>
