<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'

	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import MoveToJointPositions from './move-to-joint-positions.svelte'
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

	const kinematicsQuery = createResourceQuery(client, 'getKinematics', {
		refetchInterval: 500,
	})

	const moveToJointPositions = async (jointPositionsList: number[]) => {
		await moveToJointPosMutation.mutateAsync([jointPositionsList])
	}

	const jointLimitsDegrees = $derived(
		kinematicsQuery.data ? getJointPositionLimits(kinematicsQuery.data as KinematicsJSON) : []
	)
</script>

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
