<script lang="ts">
	import type { Snippet } from 'svelte'

	import { mdiChevronDown, mdiChevronUp } from '@mdi/js'
	import { Checkbox, Field, Icon, Label } from '@viamrobotics/prime-ui'
	import { MachineConnectionEvent } from '@viamrobotics/sdk'
	import { useConnectionStatus, useMachineStatus } from '@viamrobotics/svelte-sdk'
	import { PersistedState, useResizeObserver } from 'runed'
	import { Pane, Splitpanes } from 'svelte-splitpanes'

	import { providePip } from '$lib'
	import OperationsAndSessions from '$lib/components/widgets/operations-and-sessions/operations-and-sessions.svelte'
	import { getResourceAPI } from '$lib/get-resource-api'
	import { getResourceKey } from '$lib/get-resource-key'
	import { type NamedResourceStatus } from '$lib/resource'
	import { ResourceTriplets } from '$lib/resource-triplet'
	import { showResourceWidget } from '$lib/show-resource-widget'

	import { collapseAll, expandAll } from './card-list-item.svelte'
	import CardList from './card-list.svelte'
	import ResourceList from './resource-list.svelte'

	interface Props {
		partID: string
		urlHash: string
		children: Snippet
	}

	const { partID, urlHash, children }: Props = $props()

	providePip(() => partID)

	let isDrawerOpen = $state(false)

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
	const motionResources = $derived(
		resources.filter((resource) => getResourceAPI(resource.name) === ResourceTriplets.Motion)
	)

	const filteredResources = $derived([
		...motionResources,
		...resources.filter(
			(resource) =>
				showResourceWidget(resource.name) &&
				getResourceAPI(resource.name) !== ResourceTriplets.Motion
		),
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
	let selection = $state<{ partID: string; key: string }>()
	const selectedResourceKey = $derived(selection?.partID === partID ? selection.key : undefined)

	const displayedResources = $derived(
		singleCardMode && selectedResourceKey
			? filteredResources.filter((r) => getResourceKey(r.name) === selectedResourceKey)
			: filteredResources
	)

	const instanceId = $props.id()
	const drawerBodyId = `${instanceId}-ops-sessions-drawer`

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

					<Field
						label="Single card mode"
						class="flex items-center gap-2 px-4 py-2"
					>
						<Checkbox bind:checked={singleCardMode} />
						<Label class="text-xs" />
					</Field>

					<ResourceList
						{isLoading}
						{singleCardMode}
						{selectedResourceKey}
						error={machineStatus.query.error ?? null}
						resources={filteredResources}
						onselect={(key) => (selection = { partID, key })}
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
				{#if displayedResources.length > 0}
					<div class="mx-6 mt-6 flex flex-row items-start justify-start gap-3">
						<button
							type="button"
							class="button"
							onclick={collapseAll}
						>
							Collapse all
						</button>
						<button
							type="button"
							class="button"
							onclick={expandAll}
						>
							Expand all
						</button>
					</div>
				{/if}
				<CardList
					{partID}
					{urlHash}
					{isLoading}
					error={machineStatus.query.error ?? undefined}
					resources={displayedResources}
				/>

				<!-- z-10 keeps the drawer above the maplibre Google Maps floating element. -->
				<section
					class="bg-light border-light fixed bottom-0 z-10 w-full border-t"
					aria-label="Operations and sessions drawer"
				>
					<h2 class="m-0">
						<button
							type="button"
							class="text-default flex h-8 w-full items-center gap-2 px-2 text-xs"
							aria-controls={drawerBodyId}
							aria-expanded={isDrawerOpen}
							onclick={() => (isDrawerOpen = !isDrawerOpen)}
						>
							<Icon icon={isDrawerOpen ? mdiChevronDown : mdiChevronUp} />
							Operations and sessions
						</button>
					</h2>
					<div
						id={drawerBodyId}
						class="h-[calc(30vh-2rem)] overflow-y-auto px-4 pt-3 pb-4"
						hidden={!isDrawerOpen}
					>
						{#if isDrawerOpen}
							<OperationsAndSessions {partID} />
						{/if}
					</div>
				</section>
			</main>
		</Pane>
	</Splitpanes>
</div>

<style>
	:global(.hide-splitter .splitpanes__splitter) {
		display: none;
	}
</style>
