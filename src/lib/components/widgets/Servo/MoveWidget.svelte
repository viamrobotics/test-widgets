<script lang="ts">
	import { ServoClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import Move from './Move.svelte'
	import { effectiveServoMax, resolveServoRange } from './servo-angle-limits'
	import { recordServoMove, useServoState } from './servo-state.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The lowest angle Execute sends. A host fills it from the servo config's `min_angle_deg`.
		 * Outside 0 to 360, or not below `maxDegrees`, it is ignored. @default 0
		 */
		minDegrees?: number
		/**
		 * The highest angle Execute sends. A host fills it from the servo config's `max_angle_deg`.
		 * Outside 0 to 360, or not above `minDegrees`, it is ignored. Without it, the highest angle
		 * is the Max the user set in MoveTo. @default 180
		 */
		maxDegrees?: number
	}

	const { partID, resourceName, minDegrees, maxDegrees }: Props = $props()

	const client = createResourceClient(
		ServoClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: 500,
	})
	const moveMutation = createResourceMutation(client, 'move')

	const { motion, limits, commanded } = untrack(() => useServoState(partID, resourceName))

	const range = $derived(resolveServoRange(minDegrees, maxDegrees))
	const highest = $derived(effectiveServoMax(range, limits.userMaxDegrees))

	const moveTo = async (angle: number) => {
		const outcome = await motion.run(() => moveMutation.mutateAsync([angle]))
		if (outcome === undefined) return
		recordServoMove(commanded, angle, outcome)
	}
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="Move"
	api={ResourceTriplets.Servo}
	queries={[positionQuery]}
	mutations={[moveMutation]}
>
	{#if positionQuery.data !== undefined}
		<Move
			currentPosition={positionQuery.data}
			min={range.min}
			max={highest}
			{moveTo}
			isBusy={motion.isBusy}
		/>
	{/if}
</ApiSection>
