import { get, type Writable } from 'svelte/store';
import type { ValueOf } from 'type-fest';

import { persisted } from '@viamrobotics/prime-core';

export const RefetchRates = {
	LIVE: 'Live',
	ONE_SEC: 'Refresh every second',
	FIVE_SEC: 'Refresh every 5 seconds',
	MANUAL: 'Manual refresh'
} as const;

export const RefetchIntervals = {
	LIVE: 33.3333,
	ONE_SEC: 1000,
	FIVE_SEC: 5000,
	MANUAL: false
} as const;

export type RefetchRate = ValueOf<typeof RefetchRates>;
export type RefetchInterval = ValueOf<typeof RefetchIntervals>;

export const RefetchRateToInterval = Object.entries(RefetchRates).map(([rateKey, rate]) => [
	rate,
	RefetchIntervals[rateKey as keyof typeof RefetchIntervals]
]) satisfies [RefetchRate, RefetchInterval][];

// create a persisted store for the specified partID + resourceName +
// scope. Scope is useful to differentiate multiple refresh rates per card
export const createRefetchIntervalStore = (
	partID: string,
	resourceName: string,
	scope: string,
	defaultInterval: RefetchInterval = RefetchIntervals.ONE_SEC
): Writable<RefetchInterval> => {
	const key = `control-card-refresh/${partID}/${resourceName}/${scope}`;
	const option = persisted<RefetchInterval>(key, defaultInterval);
	const storedOption = get(option);
	// Reset to default if the stored option is not a valid interval
	if (!Object.values(RefetchIntervals).includes(storedOption)) {
		option.set(defaultInterval);
	}
	return option;
};
