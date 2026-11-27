<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { MotionClient, MotionConfiguration, SlamClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '#lib/components/refetch-interval-store.svelte.js'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import { untrack } from 'svelte'

	import MoveOnMap from './MoveOnMap.svelte'
	import { DEFAULT_MOTION_NAME, useSlamState } from './slam-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MM_PER_M = 1000

	const { moveOnMap: moveOnMapGuard, moveTarget } = untrack(() =>
		useSlamState(partID, resourceName)
	)

	// The Map's refetch setting, so pausing the Map pauses the pose MoveOnMap keeps the base facing.
	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'slam',
		RefetchIntervals.FIVE_SEC
	)

	const slamClient = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(slamClient, 'getProperties', {
		refetchInterval: false,
	})

	const positionQuery = createResourceQuery(slamClient, 'getPosition', () => ({
		enabled: propertiesQuery.data?.cloudSlam === false,
		refetchInterval: refetchInterval.current,
	}))

	// Although this is a SLAM widget, MoveOnMap is a motion service call. The user names the
	// motion service, typically "builtin".
	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => moveTarget.motionName || DEFAULT_MOTION_NAME
	)

	const moveOnMapMutation = createResourceMutation(motionClient, 'moveOnMap')
	const stopPlanMutation = createResourceMutation(motionClient, 'stopPlan')

	const base = $derived({
		name: moveTarget.baseName,
		namespace: 'rdk',
		type: 'component',
		subtype: 'base',
		localName: '',
		remotePath: [],
	})

	// MoveOnMap goes to the user chosen position, but it maintains
	// the current orientation of the base.
	const currentOrientation = $derived({
		oX: positionQuery.data?.pose?.oX ?? 0,
		oY: positionQuery.data?.pose?.oY ?? 0,
		oZ: positionQuery.data?.pose?.oZ ?? 1,
		theta: positionQuery.data?.pose?.theta ?? 0,
	})

	let lastFailedAction = $state<'Move on map' | 'Stop'>()

	const moveOnMap = (destination: { x: number; y: number }, planDeviationM: number | undefined) => {
		const motionConfiguration: [MotionConfiguration] | [] =
			planDeviationM === undefined
				? []
				: [
						new MotionConfiguration({
							planDeviationM,
						}),
					]
		// A press while a move is in flight is dropped, and must not clear that move's status.
		if (moveOnMapGuard.isBusy) return
		lastFailedAction = undefined
		const call = moveOnMapGuard.run(() =>
			moveOnMapMutation.mutateAsync([
				{
					// The motion client expects mm
					x: destination.x * MM_PER_M,
					y: destination.y * MM_PER_M,
					z: 0,
					...currentOrientation,
				},
				base.name,
				slamClient.current?.name ?? '',
				...motionConfiguration,
			])
		)
		void call?.then((outcome) => {
			if (outcome === 'failed') lastFailedAction = 'Move on map'
		})
	}

	const stopPlan = () => {
		lastFailedAction = undefined
		stopPlanMutation.mutate([base.name], {
			onError: () => {
				lastFailedAction = 'Stop'
			},
		})
	}

	const statusText = $derived.by(() => {
		if (lastFailedAction !== undefined) return `${lastFailedAction} failed`
		return moveOnMapGuard.isBusy ? 'Moving on map.' : ''
	})

	const sectionErrors = useSectionErrors(() => ({
		queries: [positionQuery],
		mutations: [moveOnMapMutation, stopPlanMutation],
	}))
</script>

<Section
	errorReporter={sectionErrors}
	class="flex-col gap-2"
>
	<Section.Heading>
		Move on map
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>

	<Section.Body>
		<div class="flex w-full max-w-80 flex-col gap-2">
			<TextField
				label="Base name"
				bind:value={moveTarget.baseName}
			/>
			<TextField
				label="Motion name"
				placeholder={DEFAULT_MOTION_NAME}
				bind:value={moveTarget.motionName}
			/>
			<MoveOnMap
				bind:x={moveTarget.destinationX}
				bind:y={moveTarget.destinationY}
				{moveOnMap}
				{stopPlan}
				isMoving={moveOnMapGuard.isBusy}
				{statusText}
			/>
		</div>
	</Section.Body>
</Section>
