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
	const stopMutation = createResourceMutation(client, 'stop')

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
			<div class="flex flex-col divide-y">
				<div
					role="group"
					aria-label="At a glance"
					class="flex flex-wrap items-center gap-x-3 gap-y-2 p-2"
				>
					<!-- Under a host scope, IsMoving's section draws no heading row and its errors reach this indicator. -->
					<Section.Scope
						method="IsMoving"
						api={ResourceTriplets.Arm}
					>
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold"><Section.Method /></span>
							<IsMoving
								client={ArmClient}
								api={ResourceTriplets.Arm}
								{partID}
								{resourceName}
								isCompact
								class="grow-0! p-0!"
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
					<Section.Scope
						method="Stop"
						api={ResourceTriplets.Arm}
						mutations={[stopMutation]}
					>
						<div class="ml-auto flex items-center gap-1.5">
							<StopButton
								onStop={() => {
									stopMutation.mutate([])
								}}
							/>
							<Section.Errors />
						</div>
					</Section.Scope>
				</div>

				<div class="flex flex-col">
					<!-- The band draws its own bottom border, and renders nothing when the arm lacks manual mode. -->
					<ManualModeWidget
						{partID}
						{resourceName}
						band
					/>
					<!-- At 1328 px each column is 664 px, which gives the pose editor room for its two-column form. -->
					<div class="grid grid-cols-1 divide-y @2xl:grid-cols-2 @2xl:divide-x @2xl:divide-y-0">
						<ApiSection
							class="min-w-0 grow flex-col gap-4"
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
				</div>

				<div class="grid grid-cols-1 @2xl:grid-cols-2">
					<ApiSection
						class="min-w-0 grow flex-col gap-4"
						method="GetJointPositions"
						api={ResourceTriplets.Arm}
						queries={[jointPositionsQuery]}
					>
						{#if jointPositionsQuery.data}
							<GetJointPositions positions={jointPositionsQuery.data.values} />
						{/if}
						<Section.Text class="mt-auto">Updates automatically</Section.Text>
					</ApiSection>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
