<script lang="ts">
	import { Input, Label } from '@viamrobotics/prime-core'
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

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Queries from '$lib/components/queries.svelte'
	import Query from '$lib/components/query.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import {
		createRefetchIntervalStore,
		RefetchIntervals,
	} from '$lib/components/refetch-interval-store.svelte'
	import SlamMap2D from '$lib/components/slam/map2d/index.svelte'

	import type { PosePosition } from './pose'

	import MoveOnMap from './move-on-map.svelte'
	import Position from './position.svelte'

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

	// Although this is the SLAM widget, the motion client is heavily
	// used for calling MoveOnMap and for rendering plans.
	//
	// The user must specify the motion service to use, typically
	// "builtin".
	let motionName = $state('')

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => motionName || 'builtin'
	)

	const moveOnMapMutation = createResourceMutation(motionClient, 'moveOnMap')
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
						.flatMap((pose) => (pose ? [pose.x / 1000, pose.y / 1000] : []))
				)
			: undefined
	)

	// User chosen destination for MoveOnMap.
	let destination = $state<PosePosition>()
	const updateDestination = (next: Partial<PosePosition>) => {
		destination = {
			x: 0,
			y: 0,
			z: 0,
			...destination,
			...next,
		}
	}
	const handleClick = (value: Vector3) => {
		const roundedX = Number.parseFloat(value.x.toFixed(5))
		const roundedY = Number.parseFloat(value.y.toFixed(5))
		updateDestination({
			x: roundedX,
			y: roundedY,
		})
	}

	// MoveOnMap goes to the user chosen position, but it maintains
	// the current orientation of the base.
	const currentOrientation = $derived({
		oX: positionQuery.data?.pose?.oX ?? 0,
		oY: positionQuery.data?.pose?.oY ?? 0,
		oZ: positionQuery.data?.pose?.oZ ?? 1,
		theta: positionQuery.data?.pose?.theta ?? 0,
	})
	const moveOnMap = (planDeviationM: number | undefined) => {
		if (!destination) {
			return
		}

		const motionConfiguration: [MotionConfiguration] | [] =
			planDeviationM === undefined
				? []
				: [
						new MotionConfiguration({
							planDeviationM,
						}),
					]
		moveOnMapMutation.mutate([
			{
				// The motion client expects mm
				x: destination.x * 1000,
				y: destination.y * 1000,
				z: destination.z * 1000,
				...currentOrientation,
			},
			base.name,
			slamClient.current?.name ?? '',
			...motionConfiguration,
		])
	}
	const stopPlan = () => {
		stopPlanMutation.mutate([base.name])
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<Query
			query={propertiesQuery}
			contentCx="p-4 h-14"
		>
			{#if propertiesQuery.data?.cloudSlam}
				<div class="p-4 text-sm">
					This resource is using Cloud SLAM. <a
						href="https://docs.viam.com/operate/reference/services/slam/cloudslam/"
						target="_blank"
						class="text-link">Learn more</a
					>.
				</div>
			{:else}
				<div class="@container">
					<div class="flex flex-col @2xl:flex-row @2xl:divide-x">
						<div class="divide-y">
							<div class="m-4">
								<RefetchController
									{refetchInterval}
									queries={[positionQuery, pointCloudMapQuery]}
								/>
							</div>

							<ApiSection
								title="GetPosition"
								api="rdk:service:slam"
							>
								<Queries
									queries={[propertiesQuery, positionQuery]}
									contentCx="h-6"
								>
									{#if positionQuery.data !== undefined}
										<Position position={positionQuery.data} />
									{/if}
								</Queries>
							</ApiSection>

							<ApiSection title="Motion">
								<Label>
									Base name

									<Input
										slot="input"
										bind:value={baseName}
									/>
								</Label>
								<Label>
									Motion name

									<Input
										slot="input"
										placeholder="builtin"
										bind:value={motionName}
									/>
								</Label>
							</ApiSection>

							<MoveOnMap
								{destination}
								{updateDestination}
								{moveOnMap}
								{stopPlan}
								lastError={moveOnMapMutation.error ?? stopPlanMutation.error}
							/>
						</div>

						<div class="flex w-full">
							<Queries
								queries={[propertiesQuery, positionQuery, pointCloudMapQuery]}
								contentCx="p-4 h-auto"
							>
								{#if positionQuery.data?.pose !== undefined && pointCloudMapQuery.data !== undefined}
									<div class="h-80 w-full @2xl:h-full">
										<SlamMap2D
											pointcloud={pointCloudMapQuery.data}
											basePose={{
												// Position is returned in millimeters, but the map uses meters
												x: positionQuery.data.pose.x / 1000,
												y: positionQuery.data.pose.y / 1000,
												theta: positionQuery.data.pose.theta,
											}}
											{motionPath}
											destination={destination
												? new Vector2(destination.x, destination.y)
												: undefined}
											helpers={true}
											onClick={handleClick}
										/>
									</div>
								{/if}
							</Queries>
						</div>
					</div>
				</div>
			{/if}
		</Query>
	{/snippet}
</ConnectionStatus>
