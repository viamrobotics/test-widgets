import { createInFlightGuard, type InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** The motion service MoveOnMap calls, and Map reads the plan from, while its field is empty. */
export const DEFAULT_MOTION_NAME = 'builtin'

/** The MoveOnMap call one SLAM service's Map and MoveOnMap widgets both read. */
interface SlamMoveTarget {
	/** The base MoveOnMap moves. Map draws this base's plan. */
	baseName: string
	/** The motion service MoveOnMap calls. Empty means `builtin`. */
	motionName: string
	/** The end position X in meters. A Map click and MoveOnMap's X field both set it. */
	destinationX: number | undefined
	/** The end position Y in meters. A Map click and MoveOnMap's Y field both set it. */
	destinationY: number | undefined
}

/** What every widget for one SLAM service shares below one `WidgetsProvider`. */
interface SlamState {
	/** Every MoveOnMap call. A second Execute while one is in flight is dropped. Stop is in no group. */
	moveOnMap: InFlightGuard
	moveTarget: SlamMoveTarget
}

const createMoveTarget = (): SlamMoveTarget => {
	const target = $state<SlamMoveTarget>({
		baseName: '',
		motionName: '',
		destinationX: undefined,
		destinationY: undefined,
	})
	return target
}

/** Returns the state the SLAM widgets naming one `partID` and `resourceName` share. */
export const useSlamState = defineResourceState<SlamState>('SLAM', () => ({
	moveOnMap: createInFlightGuard(),
	moveTarget: createMoveTarget(),
}))
