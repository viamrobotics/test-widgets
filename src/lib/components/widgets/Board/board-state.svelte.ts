import { createInFlightGuard, type InFlightGuard } from '$lib/components/in-flight-guard.svelte'
import { defineResourceState } from '$lib/resource-widget-state'

/** What every widget for one board shares below one `WidgetsProvider`. */
interface BoardState {
	/**
	 * The guard for every write to one GPIO pin: SetGpio, SetPwm, SetPwmFrequency, and the Pins
	 * control's three GPIO Sets. A write to another pin uses that pin's guard, so it stays live.
	 * Reads join no group.
	 */
	pinGuard: (pin: string) => InFlightGuard
	/**
	 * The guard for every write to one analog writer: WriteAnalog and the Pins control's analog
	 * Set. Another writer uses its own guard.
	 */
	analogWriterGuard: (name: string) => InFlightGuard
	/** SetPowerMode's Execute. */
	powerMode: InFlightGuard
}

/**
 * Returns one target's guard, made on its first use. A pin or writer name is matched after
 * trimming, the same way the widgets send it.
 */
const createGuardsByTarget = (): ((target: string) => InFlightGuard) => {
	const guards = new Map<string, InFlightGuard>()
	return (target) => {
		const key = target.trim()
		let guard = guards.get(key)
		if (!guard) {
			guard = createInFlightGuard()
			guards.set(key, guard)
		}
		return guard
	}
}

/** Returns the state the board widgets naming one `partID` and `resourceName` share. */
export const useBoardState = defineResourceState<BoardState>('board', () => ({
	pinGuard: createGuardsByTarget(),
	analogWriterGuard: createGuardsByTarget(),
	powerMode: createInFlightGuard(),
}))
