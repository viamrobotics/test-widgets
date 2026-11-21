<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { Progress } from '@viamrobotics/prime-ui'
	import {
		motionApi,
		MotionClient,
		MotionConfiguration,
		slamApi,
		SlamClient,
	} from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { Vector2, type Vector3 } from 'three'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import SlamMap2D from '$lib/components/slam/map2d/index.svelte'

	import CloudSlamNotice from './cloud-slam-notice.svelte'
	import MoveOnMap from './move-on-map.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

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
	const DEFAULT_MOTION_NAME = 'builtin'
	const CLICK_PRECISION_DIGITS = 5
	// The registry's 2xl container width. From here up the legend starts collapsed.
	const LEGEND_COLLAPSE_MIN_WIDTH_PX = 672

	// Read once when the map mounts, so a later resize never fights the person's toggle.
	let legendStartsOpen = $state<boolean>()
	const measureLegendStart = (element: HTMLElement) => {
		legendStartsOpen = element.clientWidth < LEGEND_COLLAPSE_MIN_WIDTH_PX
	}

	// Although this is the SLAM widget, the motion client is heavily
	// used for calling MoveOnMap and for rendering plans.
	//
	// The user must specify the motion service to use, typically
	// "builtin".
	let motionName = $state('')

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => motionName || DEFAULT_MOTION_NAME
	)

	const moveOnMapMutation = createResourceMutation(motionClient, 'moveOnMap')
	const moveOnMapGuard = createInFlightGuard()
	const stopPlanMutation = createResourceMutation(motionClient, 'stopPlan')

	let baseName = $state('')

	const base = $derived({
		name: baseName,
		namespace: 'rdk',
		type: 'component',
		subtype: 'base',
		localName: '',
		remotePath: [],
	})

	// The map doesn't show an error or loading state for rendering the motion plan
	// so wire up the createResourceQuery here and thread down the plan if it exists
	const planQuery = createResourceQuery(
		motionClient,
		'getPlan',
		() => [base.name, true] as const,
		() => ({
			enabled: baseName !== undefined,
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

	// User chosen destination for MoveOnMap, in meters. A map click or the X and Y fields set it.
	let destinationX = $state<number>()
	let destinationY = $state<number>()
	const handleClick = (value: Vector3) => {
		destinationX = Number.parseFloat(value.x.toFixed(CLICK_PRECISION_DIGITS))
		destinationY = Number.parseFloat(value.y.toFixed(CLICK_PRECISION_DIGITS))
	}
	const mapDestination = $derived(
		destinationX !== undefined && destinationY !== undefined
			? new Vector2(destinationX, destinationY)
			: undefined
	)

	// MoveOnMap goes to the user chosen position, but it maintains
	// the current orientation of the base.
	const currentOrientation = $derived({
		oX: positionQuery.data?.pose?.oX ?? 0,
		oY: positionQuery.data?.pose?.oY ?? 0,
		oZ: positionQuery.data?.pose?.oZ ?? 1,
		theta: positionQuery.data?.pose?.theta ?? 0,
	})
	const moveOnMap = (destination: { x: number; y: number }, planDeviationM: number | undefined) => {
		const motionConfiguration: [MotionConfiguration] | [] =
			planDeviationM === undefined
				? []
				: [
						new MotionConfiguration({
							planDeviationM,
						}),
					]
		void moveOnMapGuard.run(() =>
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
	}
	const stopPlan = () => {
		stopPlanMutation.mutate([base.name])
	}

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery, positionQuery, pointCloudMapQuery],
		mutations: [moveOnMapMutation, stopPlanMutation],
	}))

	const id = $props.id()
	const motionHeadingId = `${id}-motion`
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

<ConnectionStatus {partID}>
	{#snippet connected()}
		<Section
			errorReporter={sectionErrors}
			class="flex-col px-0 py-0"
		>
			{#if propertiesQuery.data?.cloudSlam}
				<CloudSlamNotice />
			{:else}
				{@render map()}
			{/if}

			<!-- 80 steps of 4 px is the board's 320 px column, which stays left aligned at @2xl. -->
			<div class="flex w-full max-w-80 flex-col gap-2 p-2">
				<div class="w-58 max-w-full">
					<RefetchController
						{refetchInterval}
						queries={[positionQuery, pointCloudMapQuery]}
					/>
				</div>

				<section
					aria-labelledby={motionHeadingId}
					class="flex flex-col gap-2"
				>
					<Section.Heading>
						<span id={motionHeadingId}>Motion</span>
						{#snippet aside()}
							<Section.Errors errors={sectionErrors.errors} />
						{/snippet}
					</Section.Heading>
					<TextField
						label="Base name"
						bind:value={baseName}
					/>
					<TextField
						label="Motion name"
						placeholder={DEFAULT_MOTION_NAME}
						bind:value={motionName}
					/>
					<MoveOnMap
						bind:x={destinationX}
						bind:y={destinationY}
						{moveOnMap}
						{stopPlan}
						isMoving={moveOnMapGuard.isBusy}
					/>
				</section>
			</div>
		</Section>
	{/snippet}
</ConnectionStatus>
