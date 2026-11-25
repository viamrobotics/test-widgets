<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'
	import IsMoving from '#lib/components/IsMoving.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import GetJointPositions from './GetJointPositions.svelte'
	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import ManualModeWidget from './ManualModeWidget.svelte'
	import MoveToJointPositions from './MoveToJointPositions.svelte'
	import MoveToPositionControl from './MoveToPositionControl.svelte'
	import StopWidget from './StopWidget.svelte'
	import { useArmMotionTracking } from './use-arm-motion-tracking.svelte'

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

	const moveToJointPosMutation = createResourceMutation(client, 'moveToJointPositions')

	const motionTracking = useArmMotionTracking(client, {
		isMovePending: () => moveToJointPosMutation.isPending,
		refetchPosition: () => jointPositionsQuery.refetch(),
	})

	const jointPositionsQuery = createResourceQuery(client, 'getJointPositions', () => ({
		refetchInterval: motionTracking.refetchInterval,
	}))
	const kinematicsQuery = createResourceQuery(client, 'getKinematics', { refetchInterval: 500 })

	const moveToJointPositions = async (jointPositionsList: number[]) => {
		await moveToJointPosMutation.mutateAsync([jointPositionsList])
	}

	const jointLimitsDegrees = $derived(
		kinematicsQuery.data ? getJointPositionLimits(kinematicsQuery.data as KinematicsJSON) : []
	)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<!-- Full-width manual mode band, rendered only when the arm supports it -->
			<ManualModeWidget
				{partID}
				{resourceName}
				band
			/>

			<div class="flex flex-col gap-4 @2xl:flex-row @2xl:gap-0 @2xl:divide-x">
				<!-- Main control sections -->
				<div
					class="flex flex-col gap-4 @2xl:grid @2xl:grow @2xl:grid-cols-2 @2xl:gap-0 @2xl:divide-x @4xl:grid-cols-3"
				>
					<ApiSection
						class="grow flex-col gap-4"
						method="GetJointPositions"
						api={ResourceTriplets.Arm}
						queries={[jointPositionsQuery]}
					>
						{#if jointPositionsQuery.data}
							<GetJointPositions positions={jointPositionsQuery.data.values} />
						{/if}
						<Section.Text class="mt-auto">Updates automatically</Section.Text>
					</ApiSection>
					<ApiSection
						class="grow flex-col gap-4"
						method="MoveToJointPositions"
						api={ResourceTriplets.Arm}
						queries={[jointPositionsQuery, kinematicsQuery]}
						mutations={[moveToJointPosMutation]}
					>
						{#if jointPositionsQuery.data}
							<MoveToJointPositions
								positions={jointPositionsQuery.data.values}
								{moveToJointPositions}
								{jointLimitsDegrees}
								isMoving={motionTracking.isTracking}
							/>
						{/if}
					</ApiSection>
					<MoveToPositionControl
						{partID}
						{resourceName}
					/>
				</div>

				<!-- Control actions sidebar -->
				<div
					class="flex flex-row gap-4 @2xl:ml-auto @2xl:w-full @2xl:max-w-40 @2xl:flex-col @2xl:gap-0 @2xl:divide-y"
				>
					<StopWidget
						{partID}
						{resourceName}
					/>
					<IsMoving
						client={ArmClient}
						api={ResourceTriplets.Arm}
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
