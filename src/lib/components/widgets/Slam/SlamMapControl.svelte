<script lang="ts">
	import { Progress } from '@viamrobotics/prime-ui'
	import { motionApi, MotionClient, slamApi, SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import SlamMap2D from '#lib/components/Slam/map2d/index.svelte'
	import { untrack } from 'svelte'
	import { Vector2, type Vector3 } from 'three'

	import CloudSlamNotice from './CloudSlamNotice.svelte'
	import { DEFAULT_MOTION_NAME, useSlamState } from './slam-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	// getPlan's second argument: fetch only the latest plan, not the whole replan history.
	const LAST_PLAN_ONLY = true

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

	const pointCloudMapQuery = createResourceQuery(slamClient, 'getPointCloudMap', () => ({
		enabled: propertiesQuery.data?.cloudSlam === false,
		refetchInterval:
			propertiesQuery.data?.mappingMode === slamApi.MappingMode.LOCALIZE_ONLY
				? false
				: refetchInterval.current,
	}))

	const MM_PER_M = 1000
	const CLICK_PRECISION_DIGITS = 5
	// The registry's 2xl container width. From here up the legend starts collapsed.
	const LEGEND_COLLAPSE_MIN_WIDTH_PX = 672

	// The base and motion service MoveOnMap names, and the destination a click sets for it.
	const { moveTarget } = untrack(() => useSlamState(partID, resourceName))

	// Read once when the map mounts, so a later resize never fights the person's toggle.
	let legendStartsOpen = $state<boolean>()
	const measureLegendStart = (element: HTMLElement) => {
		legendStartsOpen = element.clientWidth < LEGEND_COLLAPSE_MIN_WIDTH_PX
	}

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => moveTarget.motionName || DEFAULT_MOTION_NAME
	)

	// The map doesn't show an error or loading state for rendering the motion plan
	// so wire up the createResourceQuery here and thread down the plan if it exists
	const planQuery = createResourceQuery(
		motionClient,
		'getPlan',
		() => [moveTarget.baseName, LAST_PLAN_ONLY] as const,
		() => ({
			// No base is named until the person types one in MoveOnMap, and there is no plan to read.
			enabled: moveTarget.baseName !== '',
			refetchInterval: refetchInterval.current,
		})
	)

	const motionPath = $derived(
		planQuery.data?.currentPlanWithStatus?.status?.state === motionApi.PlanState.IN_PROGRESS
			? new Float32Array(
					(planQuery.data.currentPlanWithStatus.plan?.steps ?? [])
						.map((step) => step.step[1]?.pose)
						// Path is returned in millimeters, but the map uses meters
						.flatMap((pose) => (pose ? [pose.x / MM_PER_M, pose.y / MM_PER_M] : []))
				)
			: undefined
	)

	const handleClick = (value: Vector3) => {
		moveTarget.destinationX = Number.parseFloat(value.x.toFixed(CLICK_PRECISION_DIGITS))
		moveTarget.destinationY = Number.parseFloat(value.y.toFixed(CLICK_PRECISION_DIGITS))
	}

	const mapDestination = $derived(
		moveTarget.destinationX !== undefined && moveTarget.destinationY !== undefined
			? new Vector2(moveTarget.destinationX, moveTarget.destinationY)
			: undefined
	)

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery, positionQuery, pointCloudMapQuery],
	}))
</script>

{#snippet map()}
	<div
		role="group"
		aria-label="2D map"
		class="relative aspect-square w-full"
		{@attach measureLegendStart}
	>
		{#if positionQuery.data?.pose !== undefined && pointCloudMapQuery.data !== undefined && legendStartsOpen !== undefined}
			<SlamMap2D
				pointcloud={pointCloudMapQuery.data}
				basePose={{
					// Position is returned in millimeters, but the map uses meters
					x: positionQuery.data.pose.x / MM_PER_M,
					y: positionQuery.data.pose.y / MM_PER_M,
					theta: positionQuery.data.pose.theta,
				}}
				{motionPath}
				destination={mapDestination}
				helpers={true}
				onClick={handleClick}
				legendOpen={legendStartsOpen}
			/>
		{:else}
			<div class="bg-light grid size-full place-content-center">
				<Progress
					label="Loading map"
					class="w-48"
				/>
			</div>
		{/if}
	</div>
{/snippet}

<Section
	errorReporter={sectionErrors}
	class="@container w-full min-w-0 flex-col px-0 py-0"
>
	<Section.Heading class="px-2 pt-2 pb-1">
		Map
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>

	<Section.Body>
		<ConnectionStatus {partID}>
			{#snippet connected()}
				<div class="flex w-full min-w-0 flex-col">
					{#if propertiesQuery.data?.cloudSlam}
						<CloudSlamNotice />
					{:else}
						{@render map()}
					{/if}

					<div class="w-58 max-w-full p-2">
						<RefetchController
							{refetchInterval}
							queries={[positionQuery, pointCloudMapQuery]}
						/>
					</div>
				</div>
			{/snippet}
		</ConnectionStatus>
	</Section.Body>
</Section>
