<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Button, Switch } from '@viamrobotics/prime-core'
	import { MachineConnectionEvent } from '@viamrobotics/sdk'
	import { useConnectionStatus, useMachineStatus } from '@viamrobotics/svelte-sdk'
	import { PersistedState, useResizeObserver } from 'runed'
	import { Pane, Splitpanes } from 'svelte-splitpanes'

	import { providePip } from '$lib'
	import OperationsAndSessionsView from '$lib/components/widgets/operations-and-sessions/operations-and-sessions.svelte'
	import { getResourceAPI } from '$lib/get-resource-api'
	import { type NamedResourceStatus } from '$lib/resource'
	import { ResourceTriplets } from '$lib/resource-triplet'
	import { showResourceWidget } from '$lib/show-resource-widget'

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

	providePip(() => partID)

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

	// The machine's builtin motion service is hidden from the generic control view
	// (see hiddenResources in show-resource-widget.ts) because it always exists and
	// confused users. Pull it out before filtering so the playground always
	// surfaces its test widget.
	const motionResource = $derived(
		resources.find((resource) => getResourceAPI(resource.name) === ResourceTriplets.Motion)
	)

	const filteredResources = $derived([
		...(motionResource ? [motionResource] : []),
		...resources.filter((resource) => showResourceWidget(resource.name)),
	])

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

	let singleCardMode = $state(false)
	let selectedResourceKey = $state<string>()

	const displayedResources = $derived(
		singleCardMode && selectedResourceKey
			? filteredResources.filter(
					(r) =>
						`${r.name.namespace}:${r.name.type}:${r.name.subtype}/${r.name.name}` ===
						selectedResourceKey
				)
			: filteredResources
	)

	const minSidebarPct = 17
	const sidebarPct = new PersistedState('sideBarPct', minSidebarPct)
	const onPaneResized = (event: CustomEvent<{ size: number }[]>) => {
		sidebarPct.current = event.detail[0]?.size ?? minSidebarPct
	}
</script>

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

					<div class="flex items-center gap-2 px-4 py-2">
						<Switch
							on={singleCardMode}
							on:change={() => (singleCardMode = !singleCardMode)}
						/>
						<span class="text-xs">Single card mode</span>
					</div>

					<ResourceList
						{isLoading}
						{singleCardMode}
						{selectedResourceKey}
						error={machineStatus.query.error ?? null}
						resources={filteredResources}
						onselect={(key) => (selectedResourceKey = key)}
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
					{#if displayedResources.length > 0}
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
					resources={displayedResources}
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
