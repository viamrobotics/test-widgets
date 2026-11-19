<script lang="ts">
	import {
		addPaneToUpperRight,
		type LayoutNode,
		type PaneNode,
		Panes,
		type PaneState,
		raiseFloat,
		removeFloat,
		selectPane,
	} from '@viamrobotics/prime-panes'
	import { useMachineStatus } from '@viamrobotics/svelte-sdk'
	import { tick, untrack } from 'svelte'

	import { getResourceAPI } from '$lib/get-resource-api'
	import { providePip } from '$lib/pip/context.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { initialMotorLayout } from './initial-motor-layout'
	import { layoutMinimum } from './layout-minimum'
	import { floatEntryHolding, hasPane } from './pane-location'
	import { compositePane, type ResourcePane, resourcePaneLabel } from './resource-pane'
	import ResourcePaneFrame from './resource-pane-frame.svelte'
	import { resourcePaneMinimum } from './resource-pane-minimums'
	import ResourceTree from './resource-tree.svelte'
	import { snapSplitRatios, splitRatiosKey } from './snap-split-ratios'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()

	const machineStatus = useMachineStatus(() => partID)

	// The camera widget reads picture-in-picture from context, as the widgets view provides it.
	providePip(() => partID)

	// Motors first so the first motor still opens the layout, then arms, motion services, bases,
	// gantries, servos, grippers, boards, switches, buttons, sensors, movement sensors, power sensors,
	// encoders, input controllers, cameras, vision services, navigation services, and SLAM services.
	const HOSTED_APIS = [
		ResourceTriplets.Motor,
		ResourceTriplets.Arm,
		ResourceTriplets.Motion,
		ResourceTriplets.Base,
		ResourceTriplets.Gantry,
		ResourceTriplets.Servo,
		ResourceTriplets.Gripper,
		ResourceTriplets.Board,
		ResourceTriplets.Switch,
		ResourceTriplets.Button,
		ResourceTriplets.Sensor,
		ResourceTriplets.MovementSensor,
		ResourceTriplets.PowerSensor,
		ResourceTriplets.Encoder,
		ResourceTriplets.InputController,
		ResourceTriplets.Camera,
		ResourceTriplets.Vision,
		ResourceTriplets.Navigation,
		ResourceTriplets.Slam,
	]
	const resources = $derived(
		HOSTED_APIS.flatMap((api) =>
			(machineStatus.current?.resources ?? []).flatMap(({ name }) =>
				name && getResourceAPI(name) === api ? [name] : []
			)
		)
	)

	// Keyed on the name, so a status poll that returns equal resources keeps the same layout.
	const firstResourceName = $derived(resources.at(0)?.name)
	const openingLayout = $derived.by(() => {
		if (firstResourceName === undefined) return undefined
		return untrack(() => {
			const first = resources.find(({ name }) => name === firstResourceName)
			if (!first) return undefined
			return getResourceAPI(first) === ResourceTriplets.Motor
				? initialMotorLayout(first)
				: compositePane(first)
		})
	})

	// $state.raw: prime-panes compares layouts by reference to tell an accepted change from a veto.
	let editedLayout = $state.raw<LayoutNode<ResourcePane>>()
	let isEdited = $state(false)
	const layout = $derived(isEdited ? editedLayout : openingLayout)

	let hostWidth = $state(0)
	let hostHeight = $state(0)
	let host = $state<HTMLElement>()
	let selectedPaneId = $state<string>()
	let addedSplits = 0

	/**
	 * Every layout change passes through here, so each split snaps to its panes' minimums. A
	 * resize the snap would only put back where it was is refused, so prime-panes resets the split.
	 */
	const setLayout = (next: LayoutNode<ResourcePane> | undefined) => {
		const snapped =
			next && snapSplitRatios(next, { width: hostWidth, height: hostHeight }, resourcePaneMinimum)
		if (snapped !== next && splitRatiosKey(snapped) === splitRatiosKey(layout)) return
		editedLayout = snapped
		isEdited = true
	}

	const showPane = (pane: PaneNode<ResourcePane>) => {
		if (!hasPane(layout, pane.id)) {
			addedSplits += 1
			return addPaneToUpperRight(layout, pane, `added-split-${addedSplits}`)
		}
		const shown = selectPane(layout, pane.id)
		const floatEntryId = floatEntryHolding(shown, pane.id)
		return floatEntryId ? raiseFloat(shown, floatEntryId) : shown
	}

	const pick = async (pane: PaneNode<ResourcePane>) => {
		selectedPaneId = pane.id
		const next = showPane(pane)
		if (next !== layout) setLayout(next)
		await tick()
		host
			?.querySelector<HTMLElement>(`[data-pane-id="${CSS.escape(pane.id)}"] [data-pane-focus]`)
			?.focus()
	}

	const closeFloat = (floatEntryId: string) => setLayout(removeFloat(layout, floatEntryId))
</script>

<div class="flex min-h-0 flex-1">
	<nav
		aria-label="Resources"
		class="border-light w-60 shrink-0 overflow-auto border-r bg-white p-1"
	>
		{#if machineStatus.query.error}
			<p class="text-danger-dark p-2 text-sm">Could not load this machine's resources.</p>
		{:else if machineStatus.current === undefined}
			<p class="text-subtle-2 p-2 text-sm">Loading resources...</p>
		{:else if resources.length === 0}
			<p class="text-subtle-2 p-2 text-sm">This machine has no resources the playground hosts.</p>
		{:else}
			<ResourceTree
				{resources}
				selected={selectedPaneId}
				onpick={pick}
			/>
		{/if}
	</nav>
	<main
		bind:this={host}
		bind:clientWidth={hostWidth}
		bind:clientHeight={hostHeight}
		class="min-h-0 min-w-0 flex-1 p-2"
	>
		<Panes
			bind:layout={() => layout, setLayout}
			paneLabel={(node) => resourcePaneLabel(node.data)}
			floatMinSize={(entry) => layoutMinimum(entry.content, resourcePaneMinimum)}
			class="size-full"
		>
			{#snippet pane(node: PaneNode<ResourcePane>, paneState: PaneState)}
				<ResourcePaneFrame
					{node}
					{paneState}
					{partID}
					onclose={closeFloat}
				/>
			{/snippet}
			{#snippet empty()}
				<div
					class="border-light text-subtle-2 flex size-full items-center justify-center border text-sm"
				>
					No panes. Pick a resource or one of its APIs to add one.
				</div>
			{/snippet}
		</Panes>
	</main>
</div>
