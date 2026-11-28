import type { ArmClient } from '@viamrobotics/sdk'

import { createResourceQuery, type ResourceClientContext } from '@viamrobotics/svelte-sdk'
import { untrack } from 'svelte'

const IDLE_REFETCH_INTERVAL_MS = 500
const MOVING_REFETCH_INTERVAL_MS = 250

interface ArmMotionTrackingOptions {
	/** A move this widget sent is still in flight. */
	isMovePending: () => boolean
	/** Re-reads the arm's position. Called once each time the arm stops. */
	refetchPosition: () => Promise<unknown>
}

/** Allows an editor to track the arm's live position.  */
export const useArmMotionTracking = (
	client: ResourceClientContext<ArmClient>,
	{ isMovePending, refetchPosition }: ArmMotionTrackingOptions
) => {
	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: IDLE_REFETCH_INTERVAL_MS,
	})

	const isMoving = $derived(isMovingQuery.data === true || isMovePending())

	let isSettling = $state(false)
	let wasMoving = false

	$effect(() => {
		if (isMoving) {
			wasMoving = true
			return
		}

		if (!wasMoving) return

		wasMoving = false
		isSettling = true
		void untrack(refetchPosition).finally(() => {
			isSettling = false
		})
	})

	const isTracking = $derived(isMoving || isSettling)

	return {
		/** The arm is moving or has just stopped, so the editor follows the live position. */
		get isTracking() {
			return isTracking
		},
		/** How often to poll the arm's position. Faster while tracking. */
		get refetchInterval() {
			return isTracking ? MOVING_REFETCH_INTERVAL_MS : IDLE_REFETCH_INTERVAL_MS
		},
	}
}
