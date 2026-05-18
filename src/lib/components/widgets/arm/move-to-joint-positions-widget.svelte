<script lang="ts">
	import { ArmClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Queries from '$lib/components/queries.svelte'

	import { getJointPositionLimits, type KinematicsJSON } from './joint-position-limits'
	import MoveToJointPositions from './move-to-joint-positions.svelte'

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

	const jointPositionsQuery = createResourceQuery(client, 'getJointPositions', {
		refetchInterval: 500,
	})
	const kinematicsQuery = createResourceQuery(client, 'getKinematics', {
		refetchInterval: 500,
	})

	const moveToJointPosMutation = createResourceMutation(client, 'moveToJointPositions')

	const moveToJointPositions = (jointPositionsList: number[]) => {
		moveToJointPosMutation.mutate([jointPositionsList], {})
	}
</script>

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
