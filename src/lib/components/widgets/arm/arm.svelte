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

	import GetJointPositions from './get-joint-positions.svelte'
	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import MoveToJointPositions from './move-to-joint-positions.svelte'
	import MoveToPositionControl from './move-to-position-control.svelte'

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

	const options = { refetchInterval: 500 }
	const jointPositionsQuery = createResourceQuery(client, 'getJointPositions', options)
	const kinematicsQuery = createResourceQuery(client, 'getKinematics', options)
	const isMovingQuery = createResourceQuery(client, 'isMoving', options)

	const moveToJointPosMutation = createResourceMutation(client, 'moveToJointPositions')
	const stopMutation = createResourceMutation(client, 'stop')

	const moveToJointPositions = (jointPositionsList: number[]) => {
		moveToJointPosMutation.mutate([jointPositionsList], {})
	}

	const jointLimitsDegrees = $derived(
		kinematicsQuery.data ? getJointPositionLimits(kinematicsQuery.data as KinematicsJSON) : []
	)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col gap-4 @2xl:flex-row @2xl:gap-0 @2xl:divide-x">
				<!-- Main control sections -->
				<div
					class="flex flex-col gap-4 @2xl:grid @2xl:grow @2xl:grid-cols-2 @2xl:gap-0 @2xl:divide-x @4xl:grid-cols-3"
				>
					<ApiSection
						title="GetJointPositions"
						api="rdk:component:arm"
						bottomText="Updates automatically"
					>
						<Query query={jointPositionsQuery}>
							{#if jointPositionsQuery.data}
								<GetJointPositions positions={jointPositionsQuery.data.values} />
							{/if}
						</Query>
					</ApiSection>
					<ApiSection
						title="MoveToJointPositions"
						api="rdk:component:arm"
					>
						<Query query={jointPositionsQuery}>
							{#if jointPositionsQuery.data}
								<MoveToJointPositions
									positions={jointPositionsQuery.data.values}
									{moveToJointPositions}
									lastError={moveToJointPosMutation.error}
									{jointLimitsDegrees}
									isMoving={isMovingQuery.data ?? false}
								/>
							{/if}
						</Query>
					</ApiSection>
					<ApiSection
						title="MoveToPosition"
						api="rdk:component:arm"
					>
						<MoveToPositionControl
							{partID}
							{resourceName}
						/>
					</ApiSection>
				</div>

				<!-- Control actions sidebar -->
				<div
					class="flex flex-row gap-4 @2xl:ml-auto @2xl:w-full @2xl:max-w-40 @2xl:flex-col @2xl:gap-0 @2xl:divide-y"
				>
					<ApiSection
						title="Stop"
						api="rdk:component:arm"
					>
						<StopButton
							error={stopMutation.error}
							onStop={() => {
								stopMutation.mutate([], {})
							}}
						/>
					</ApiSection>
					<IsMoving
						client={ArmClient}
						api="rdk:component:arm"
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
