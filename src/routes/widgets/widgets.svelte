<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Button } from '@viamrobotics/prime-core'
	import { MachineConnectionEvent } from '@viamrobotics/sdk'
	import { useConnectionStatus, useMachineStatus } from '@viamrobotics/svelte-sdk'
	import { PersistedState, useResizeObserver } from 'runed'
	import { Pane, Splitpanes } from 'svelte-splitpanes'

	import type { NamedResourceStatus } from '$lib/resource'

	import { showResourceInControlView } from '$lib/builtin'
	import OperationsAndSessionsView from '$lib/components/widgets/operations-and-sessions/operations-and-sessions.svelte'

	import { collapseAll, expandAll } from './card-list-item.svelte'
	import CardList from './card-list.svelte'
	import ResourceList from './resource-list.svelte'

	interface Props {
		partID: string
		urlHash: string
		hasUnsavedChanges?: boolean
		children: Snippet
	}

	const { partID, urlHash, hasUnsavedChanges = false, children }: Props = $props()

	const machineStatus = useMachineStatus(() => partID)
	const connectionStatus = useConnectionStatus(() => partID)

	const isLoading = $derived(
		connectionStatus.current !== MachineConnectionEvent.CONNECTED || machineStatus.query.isPending
	)

	const resources = $derived.by(() => {
		if (machineStatus.query.error || !machineStatus.current) {
			return []
		}

		const namedResources: NamedResourceStatus[] = []
		for (const resource of machineStatus.current.resources) {
			if (resource.name) {
				namedResources.push({ ...resource, name: resource.name })
			}
		}

		return namedResources
	})

	const filteredResources = $derived(
		resources.filter((resource) => showResourceInControlView(resource.name))
	)

	let splitpanesDiv = $state.raw<HTMLDivElement>()
	let horizontal = $state(false)
	useResizeObserver(
		() => splitpanesDiv,
		([entry]) => {
			if (entry) {
				const width = entry.contentRect.width
				horizontal = width < 640
			}
		}
	)

	const minSidebarPct = 17
	const sidebarPct = new PersistedState('sideBarPct', minSidebarPct)
	const onPaneResized = (event: CustomEvent<{ size: number }[]>) => {
		sidebarPct.current = event.detail[0]?.size ?? minSidebarPct
	}
</script>

<!-- NOTE: `position: relative` ensure absolute children don't overflow -->
<div
	bind:this={splitpanesDiv}
	class="h-full overflow-hidden"
>
	<Splitpanes
		{horizontal}
		on:resized={onPaneResized}
		class="flex w-full flex-col sm:relative sm:flex-row
  {horizontal ? 'hide-splitter' : ''}"
	>
		<Pane
			size={sidebarPct.current}
			minSize={minSidebarPct}
			class="bg-inherit!"
		>
			<div class="contents w-full sm:h-full sm:shrink-0 sm:overflow-auto sm:overscroll-contain">
				<nav class="border-light bg-extralight flex h-full flex-col divide-y border-b sm:border-r">
					{@render children()}

					<ResourceList
						{isLoading}
						error={machineStatus.query.error ?? null}
						resources={filteredResources}
					/>
				</nav>
			</div>
		</Pane>
		<Pane
			minSize={60}
			class="bg-inherit!"
		>
			<main
				class="flex h-full w-full grow flex-col sm:relative sm:overflow-y-auto sm:overscroll-contain sm:scroll-smooth sm:motion-reduce:scroll-auto"
			>
				<div class="mt-6 ml-6 flex w-full flex-row items-start justify-start gap-3">
					{#if filteredResources.length > 0}
						<Button
							onclick={collapseAll}
							class="btn btn-default"
							>Collapse all
						</Button>
						<Button
							onclick={expandAll}
							class="btn btn-default"
							>Expand all
						</Button>
					{/if}
				</div>
				<CardList
					{partID}
					{urlHash}
					{isLoading}
					{hasUnsavedChanges}
					error={machineStatus.query.error ?? undefined}
					resources={filteredResources}
				/>

				<OperationsAndSessionsView {partID} />
			</main>
		</Pane>
	</Splitpanes>
</div>

<style>
	:global(.hide-splitter .splitpanes__splitter) {
		display: none;
	}
</style>
