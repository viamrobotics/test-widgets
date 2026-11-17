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
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { initialMotorLayout } from './initial-motor-layout'
	import { layoutMinimum } from './layout-minimum'
	import { type MotorPane, motorPaneLabel } from './motor-pane'
	import MotorPaneFrame from './motor-pane-frame.svelte'
	import { motorPaneMinimum } from './motor-pane-minimums'
	import MotorResourceTree from './motor-resource-tree.svelte'
	import { floatEntryHolding, hasPane } from './pane-location'
	import { snapSplitRatios, splitRatiosKey } from './snap-split-ratios'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()

	const machineStatus = useMachineStatus(() => partID)

	const motors = $derived(
		(machineStatus.current?.resources ?? []).flatMap(({ name }) =>
			name && getResourceAPI(name) === ResourceTriplets.Motor ? [name] : []
		)
	)

	// Keyed on the name, so a status poll that returns equal resources keeps the same layout.
	const firstMotorName = $derived(motors.at(0)?.name)
	const openingLayout = $derived.by(() => {
		if (firstMotorName === undefined) return undefined
		return untrack(() => {
			const motor = motors.find(({ name }) => name === firstMotorName)
			return motor && initialMotorLayout(motor)
		})
	})

	// $state.raw: prime-panes compares layouts by reference to tell an accepted change from a veto.
	let editedLayout = $state.raw<LayoutNode<MotorPane>>()
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
	const setLayout = (next: LayoutNode<MotorPane> | undefined) => {
		const snapped =
			next && snapSplitRatios(next, { width: hostWidth, height: hostHeight }, motorPaneMinimum)
		if (snapped !== next && splitRatiosKey(snapped) === splitRatiosKey(layout)) return
		editedLayout = snapped
		isEdited = true
	}

	const showPane = (pane: PaneNode<MotorPane>) => {
		if (!hasPane(layout, pane.id)) {
			addedSplits += 1
			return addPaneToUpperRight(layout, pane, `added-split-${addedSplits}`)
		}
		const shown = selectPane(layout, pane.id)
		const floatEntryId = floatEntryHolding(shown, pane.id)
		return floatEntryId ? raiseFloat(shown, floatEntryId) : shown
	}

	const pick = async (pane: PaneNode<MotorPane>) => {
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
		{:else if motors.length === 0}
			<p class="text-subtle-2 p-2 text-sm">This machine has no motors.</p>
		{:else}
			<MotorResourceTree
				{motors}
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
			paneLabel={(node) => motorPaneLabel(node.data)}
			floatMinSize={(entry) => layoutMinimum(entry.content, motorPaneMinimum)}
			class="size-full"
		>
			{#snippet pane(node: PaneNode<MotorPane>, paneState: PaneState)}
				<MotorPaneFrame
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
					No panes. Pick a motor or one of its APIs to add one.
				</div>
			{/snippet}
		</Panes>
	</main>
</div>
