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
	import Query from '$lib/components/query.svelte'
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
			<!-- Stop and IsMoving band, so the control sections below get the card's full width -->
			<div class="flex w-full flex-col border-b @md:flex-row @md:divide-x">
				<ApiSection
					class="flex-row flex-wrap items-center gap-x-4 gap-y-2"
					title="Stop"
					api={ResourceTriplets.Arm}
				>
					<StopButton
						error={stopMutation.error}
						onStop={() => {
							stopMutation.mutate([], {})
						}}
					/>
				</ApiSection>
				<IsMoving
					class="flex-row flex-wrap items-center gap-x-4 gap-y-2"
					client={ArmClient}
					api={ResourceTriplets.Arm}
					{partID}
					{resourceName}
				/>
			</div>

			<!-- Full-width manual mode band, rendered only when the arm supports it -->
			<ManualModeWidget
				{partID}
				{resourceName}
				band
			/>

			<!-- Two columns with MoveToPosition on its own full-width row, so the pose editor lays out in rows. Three columns only once each clears 384 px. -->
			<div
				class="flex flex-col gap-4 @2xl:grid @2xl:grid-cols-2 @2xl:gap-0 @2xl:divide-x @7xl:grid-cols-3"
			>
				<ApiSection
					class="grow flex-col gap-4 @2xl:col-span-2 @2xl:border-b @7xl:col-span-1 @7xl:border-b-0"
					title="MoveToPosition"
					api={ResourceTriplets.Arm}
				>
					<MoveToPositionControl
						{partID}
						{resourceName}
					/>
				</ApiSection>
				<ApiSection
					class="grow flex-col gap-4"
					title="GetJointPositions"
					api={ResourceTriplets.Arm}
					bottomText="Updates automatically"
				>
					<Query query={jointPositionsQuery}>
						{#if jointPositionsQuery.data}
							<GetJointPositions positions={jointPositionsQuery.data.values} />
						{/if}
					</Query>
				</ApiSection>
				<ApiSection
					class="grow flex-col gap-4 @2xl:border-r-0 @7xl:border-r"
					title="MoveToJointPositions"
					api={ResourceTriplets.Arm}
				>
					<Query query={jointPositionsQuery}>
						{#if jointPositionsQuery.data}
							<MoveToJointPositions
								positions={jointPositionsQuery.data.values}
								{moveToJointPositions}
								lastError={moveToJointPosMutation.error}
								{jointLimitsDegrees}
								isMoving={motionTracking.isTracking}
							/>
						{/if}
					</Query>
				</ApiSection>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
