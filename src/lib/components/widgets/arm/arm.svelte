<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import { ArmClient, MotionClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
		useResourceNames,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import Queries from '$lib/components/queries.svelte'
	import Query from '$lib/components/query.svelte'
	import StopButton from '$lib/components/stop-button.svelte'

	import GetJointPositions from './get-joint-positions.svelte'
	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import MoveToJointPositions from './move-to-joint-positions.svelte'
	import MoveToPosition from './move-to-position.svelte'
	import QuickMove from './quick-move.svelte'
	import {
		DEFAULT_MOTION_SERVICE_NAME,
		validateMoveToPositionPlan,
	} from './validate-move-to-position-plan'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ArmClient,
		() => partID,
		() => resourceName
	)

	const resourceNames = useResourceNames(() => partID)
	const motionServiceName = $derived(
		resourceNames.current?.find((name) => name.type === 'motion')?.name
	)

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => motionServiceName || DEFAULT_MOTION_SERVICE_NAME
	)

	const options = { refetchInterval: 500 }
	const jointPositionsQuery = createResourceQuery(client, 'getJointPositions', options)
	const endPositionQuery = createResourceQuery(client, 'getEndPosition', options)
	const kinematicsQuery = createResourceQuery(client, 'getKinematics', options)

	const moveToJointPosMutation = createResourceMutation(client, 'moveToJointPositions')
	const quickMoveToJointPosMutation = createResourceMutation(client, 'moveToJointPositions')
	const stopMutation = createResourceMutation(client, 'stop')
	const moveToPosMutation = createResourceMutation(client, 'moveToPosition')

	const moveToJointPositions = (jointPositionsList: number[]) => {
		moveToJointPosMutation.mutate([jointPositionsList], {})
	}

	const quickMoveToJointPositions = (jointPositionsList: number[]) => {
		quickMoveToJointPosMutation.mutate([jointPositionsList], {})
	}

	const moveToPosition = (position: Pose) => {
		moveToPosMutation.mutate([position], {})
	}

	const validatePlan = (position: Pose) =>
		validateMoveToPositionPlan(
			motionClient.current!,
			DEFAULT_MOTION_SERVICE_NAME,
			resourceName,
			position
		)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex flex-col gap-4 lg:flex-row lg:gap-0 lg:divide-x">
			<!-- Main control sections -->
			<div
				class="flex flex-col gap-4 lg:grid lg:grow lg:grid-cols-2 lg:gap-0 lg:divide-x xl:grid-cols-4"
			>
				<ApiSection
					title="GetJointPositions"
					bottomText="Updates automatically"
				>
					<Query query={jointPositionsQuery}>
						{#if jointPositionsQuery.data}
							<GetJointPositions positions={jointPositionsQuery.data.values} />
						{/if}
					</Query>
				</ApiSection>
				<ApiSection title="MoveToJointPositions">
					<Queries queries={[jointPositionsQuery, kinematicsQuery]}>
						{#if jointPositionsQuery.data && kinematicsQuery.data}
							<MoveToJointPositions
								positions={jointPositionsQuery.data.values}
								{moveToJointPositions}
								lastError={moveToJointPosMutation.error}
								jointLimitsDegrees={getJointPositionLimits(kinematicsQuery.data as KinematicsJSON)}
							/>
						{/if}
					</Queries>
				</ApiSection>
				<ApiSection title="MoveToPosition">
					<Query query={endPositionQuery}>
						{#if endPositionQuery.data}
							<MoveToPosition
								endPosition={endPositionQuery.data}
								{moveToPosition}
								{validatePlan}
								lastError={moveToPosMutation.error}
							/>
						{/if}
					</Query>
				</ApiSection>
				<ApiSection
					title="Quick move"
					bottomText="Press a button to execute"
				>
					<Query query={jointPositionsQuery}>
						{#if jointPositionsQuery.data}
							<QuickMove
								positions={jointPositionsQuery.data.values}
								moveToJointPositions={quickMoveToJointPositions}
								lastError={quickMoveToJointPosMutation.error}
							/>
						{/if}
					</Query>
				</ApiSection>
			</div>

			<!-- Control actions sidebar -->
			<div
				class="flex flex-row gap-4 lg:ml-auto lg:w-full lg:max-w-40 lg:flex-col lg:gap-0 lg:divide-y"
			>
				<ApiSection title="Stop">
					<StopButton
						error={stopMutation.error}
						onStop={() => {
							stopMutation.mutate([], {})
						}}
					/>
				</ApiSection>
				<IsMoving
					client={ArmClient}
					{partID}
					{resourceName}
				/>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
