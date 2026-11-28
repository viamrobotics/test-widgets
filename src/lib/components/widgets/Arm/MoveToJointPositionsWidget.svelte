<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useArmState } from './arm-state.svelte'
	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import MoveToJointPositions from './MoveToJointPositions.svelte'
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
	const { motion: motionGuard } = untrack(() => useArmState(partID, resourceName))

	// A move from any widget in the motion group locks the editor, the same as this widget's own.
	const motionTracking = useArmMotionTracking(client, {
		isMovePending: () => motionGuard.isBusy,
		refetchPosition: () => jointPositionsQuery.refetch(),
	})

	const jointPositionsQuery = createResourceQuery(client, 'getJointPositions', () => ({
		refetchInterval: motionTracking.refetchInterval,
	}))

	const kinematicsQuery = createResourceQuery(client, 'getKinematics', {
		refetchInterval: 500,
	})

	// The editors read a rejection as a failed move. A press dropped while the group is busy moved nothing either.
	const moveToJointPositions = async (jointPositionsList: number[]) => {
		const outcome = await motionGuard.run(() =>
			moveToJointPosMutation.mutateAsync([jointPositionsList])
		)
		if (outcome !== 'succeeded') {
			throw new Error('The arm did not move to the joint positions.')
		}
	}

	const jointLimitsDegrees = $derived(
		kinematicsQuery.data ? getJointPositionLimits(kinematicsQuery.data as KinematicsJSON) : []
	)
</script>

<ApiSection
	method="MoveToJointPositions"
	api={ResourceTriplets.Arm}
	queries={[jointPositionsQuery, kinematicsQuery]}
	mutations={[moveToJointPosMutation]}
	class="grow flex-col gap-4"
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
