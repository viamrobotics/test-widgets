import type { ValueOf } from 'type-fest'

import { PersistedState } from 'runed'

/** How often a read refetches. Each label finishes the sentence "Updates …" in `RefetchController`. */
export const RefetchRates = {
	LIVE: 'live',
	HALF_SEC: 'every 500 ms',
	ONE_SEC: 'every second',
	FIVE_SEC: 'every 5 seconds',
	MANUAL: 'Manual refresh',
} as const

export const RefetchIntervals = {
	LIVE: 33.3333,
	HALF_SEC: 500,
	ONE_SEC: 1000,
	FIVE_SEC: 5000,
	MANUAL: false,
} as const

export type RefetchRate = ValueOf<typeof RefetchRates>
export type RefetchInterval = ValueOf<typeof RefetchIntervals>

export const RefetchRateToInterval = Object.entries(RefetchRates).map(([rateKey, rate]) => [
	rate,
	RefetchIntervals[rateKey as keyof typeof RefetchIntervals],
]) satisfies [RefetchRate, RefetchInterval][]

// create a persisted store for the specified partID + resourceName +
// scope. Scope is useful to differentiate multiple refresh rates per card
export const createRefetchIntervalStore = (
	partID: () => string,
	resourceName: () => string,
	scope: string,
	defaultInterval: RefetchInterval = RefetchIntervals.ONE_SEC
): PersistedState<RefetchInterval> => {
	const key = $derived(`control-card-refresh/${partID()}/${resourceName()}/${scope}`)

	const persisted = $derived(new PersistedState<RefetchInterval>(key, defaultInterval))

	$effect(() => {
		// Reset to default if the stored option is not a valid interval
		if (!Object.values(RefetchIntervals).includes(persisted.current)) {
			persisted.current = defaultInterval
		}
	})

	return {
		get current() {
			return persisted.current
		},
		set current(value: RefetchInterval) {
			persisted.current = value
		},
	} as PersistedState<RefetchInterval>
}
