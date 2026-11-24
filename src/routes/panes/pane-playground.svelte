<script lang="ts">
	import {
		addPaneToUpperRight,
		type FloatEntry,
		type FloatRect,
		type LayoutNode,
		type PaneNode,
		Panes,
		type PaneState,
		raiseFloat,
		removeFloat,
		removePane,
		selectPane,
	} from '@viamrobotics/prime-panes'
	import { useMachineStatus } from '@viamrobotics/svelte-sdk'
	import { tick, untrack } from 'svelte'
	import { SvelteMap } from 'svelte/reactivity'

	import {
		type PopOutRequest,
		providePopOutHost,
	} from '$lib/components/pop-out/pop-out-host-context'
	import { ArmScene } from '$lib/components/widgets/arm/arm-scene'
	import { provideArmScene } from '$lib/components/widgets/arm/arm-scene-context'
	import { getResourceAPI } from '$lib/get-resource-api'
	import { providePip } from '$lib/pip/context.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { initialMotorLayout } from './initial-motor-layout'
	import { layoutMinimum } from './layout-minimum'
	import { floatEntryHolding, hasPane } from './pane-location'
	import {
		isResourcePaneNode,
		type PlaygroundPane,
		playgroundPaneLabel,
		playgroundPaneMinimum,
		type PopOutPane,
		popOutPaneId,
	} from './playground-pane'
	import { addFloatEntry, hasLoosePopOut, withRootFloat } from './pop-out-layout'
	import PopOutPaneFrame from './pop-out-pane-frame.svelte'
	import { compositePane, type ResourcePane } from './resource-pane'
	import ResourcePaneFrame from './resource-pane-frame.svelte'
	import ResourceTree from './resource-tree.svelte'
	import { snapSplitRatios, splitRatiosKey } from './snap-split-ratios'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()

	const machineStatus = useMachineStatus(() => partID)

	// The camera widget reads picture-in-picture from context, as the widgets view provides it.
	providePip(() => partID)

	// The playground route is the only importer of the arm scene, so the library's main entry never loads visualization.
	provideArmScene(ArmScene)

	// Motors first so the first motor still opens the layout, then arms, motion services, bases,
	// gantries, servos, grippers, boards, switches, buttons, sensors, movement sensors, power sensors,
	// encoders, input controllers, cameras, vision services, navigation services, SLAM services, audio
	// inputs, audio outputs, discovery services, and ML model services.
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
		ResourceTriplets.AudioInput,
		ResourceTriplets.AudioOutput,
		ResourceTriplets.Discovery,
		ResourceTriplets.MLModel,
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
	let editedLayout = $state.raw<LayoutNode<PlaygroundPane>>()
	let isEdited = $state(false)
	const layout: LayoutNode<PlaygroundPane> | undefined = $derived(
		withRootFloat(isEdited ? editedLayout : openingLayout)
	)

	let hostWidth = $state(0)
	let hostHeight = $state(0)
	let host = $state<HTMLElement>()
	let selectedPaneId = $state<string>()
	let addedSplits = 0

	/**
	 * Every layout change passes through here, so each split snaps to its panes' minimums. A
	 * resize the snap would only put back where it was is refused, so prime-panes resets the split.
	 * So is a drop that would leave a pop-out anywhere but alone in its own window.
	 */
	const setLayout = (next: LayoutNode<PlaygroundPane> | undefined) => {
		if (hasLoosePopOut(next)) return
		const rooted = withRootFloat(next)
		const snapped =
			rooted &&
			snapSplitRatios(rooted, { width: hostWidth, height: hostHeight }, playgroundPaneMinimum)
		if (snapped !== rooted && splitRatiosKey(snapped) === splitRatiosKey(layout)) return
		editedLayout = snapped
		isEdited = true
	}

	const showPane = (pane: PaneNode<ResourcePane>) => {
		if (!hasPane(layout, pane.id)) {
			addedSplits += 1
			return addPaneToUpperRight<PlaygroundPane>(layout, pane, `added-split-${addedSplits}`)
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

	// A pop-out opens this far in from the playground's top-right corner, beside the docked panes.
	const POP_OUT_INSET = 24

	// The layout holds plain data, so each open request's content and onClose stay here, keyed by pop-out id.
	const popOutRequests = new SvelteMap<string, PopOutRequest>()
	let openedPopOuts = 0

	const popOutRect = (pane: PopOutPane): FloatRect => {
		const { width, height } = playgroundPaneMinimum(pane)
		return { x: Math.max(0, hostWidth - width - POP_OUT_INSET), y: POP_OUT_INSET, width, height }
	}

	/** Removes the pop-out's window and forgets its request, or returns undefined when it was already closed. */
	const dismissPopOut = (popOutId: string): PopOutRequest | undefined => {
		const request = popOutRequests.get(popOutId)
		if (!request) return undefined
		popOutRequests.delete(popOutId)
		setLayout(removePane(layout, popOutPaneId(popOutId)))
		return request
	}

	const closePopOutFromChrome = (popOutId: string) => dismissPopOut(popOutId)?.onClose()

	providePopOutHost({
		open: (request) => {
			openedPopOuts += 1
			const popOutId = `${openedPopOuts}`
			const paneId = popOutPaneId(popOutId)
			const pane: PopOutPane = {
				kind: 'pop-out',
				popOutId,
				title: request.title,
				minSize: request.minSize,
			}
			const floatEntry: FloatEntry<PlaygroundPane> = {
				id: `${paneId}::window`,
				rect: popOutRect(pane),
				content: { type: 'pane', id: paneId, data: pane },
			}
			popOutRequests.set(popOutId, request)
			setLayout(addFloatEntry(layout, floatEntry, `${paneId}::float`))
			return () => {
				dismissPopOut(popOutId)
			}
		},
	})
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
			paneLabel={(node) => playgroundPaneLabel(node.data)}
			floatMinSize={(entry) => layoutMinimum(entry.content, playgroundPaneMinimum)}
			class="size-full"
		>
			{#snippet pane(node: PaneNode<PlaygroundPane>, paneState: PaneState)}
				{#if isResourcePaneNode(node)}
					<ResourcePaneFrame
						{node}
						{paneState}
						{partID}
						onclose={closeFloat}
						onremove={() => setLayout(removePane(layout, node.id))}
					/>
				{:else if node.data.kind === 'pop-out'}
					{@const popOut = node.data}
					<PopOutPaneFrame
						paneId={node.id}
						title={popOut.title}
						content={popOutRequests.get(popOut.popOutId)?.content}
						onclose={() => closePopOutFromChrome(popOut.popOutId)}
					/>
				{/if}
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
