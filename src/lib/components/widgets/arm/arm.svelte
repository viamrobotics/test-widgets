<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GetJointPositions from './get-joint-positions.svelte'
	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import ManualModeWidget from './manual-mode-widget.svelte'
	import MoveToJointPositions from './move-to-joint-positions.svelte'
	import MoveToPositionControl from './move-to-position-control.svelte'
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
	const stopMutation = createResourceMutation(client, 'stop')

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
					<ApiSection
						class="grow flex-col gap-4"
						method="Stop"
						api={ResourceTriplets.Arm}
						mutations={[stopMutation]}
					>
						<StopButton
							onStop={() => {
								stopMutation.mutate([], {})
							}}
						/>
					</ApiSection>
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
