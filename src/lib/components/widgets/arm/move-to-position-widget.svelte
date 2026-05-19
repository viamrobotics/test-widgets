<script lang="ts">
	import { ArmClient, MotionClient, type Pose } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import Query from '$lib/components/query.svelte'

	import MoveToPosition from './move-to-position.svelte'
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

	const motionClient = createResourceClient(
		MotionClient,
		() => partID,
		() => DEFAULT_MOTION_SERVICE_NAME
	)

	const endPositionQuery = createResourceQuery(client, 'getEndPosition', {
		refetchInterval: 500,
	})
	const moveToPosMutation = createResourceMutation(client, 'moveToPosition')
	const moveToPosition = (position: Pose) => {
		moveToPosMutation.mutate([position], {})
	}

	const validatePlan = (position: Pose) => {
		if (!motionClient.current) {
			return Promise.resolve()
		}
		return validateMoveToPositionPlan(
			motionClient.current!,
			DEFAULT_MOTION_SERVICE_NAME,
			resourceName,
			position
		)
	}
</script>

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
