import type { RefetchInterval } from '#lib/components/refetch-interval-store.svelte.js'

import { HISTORY_SAMPLES } from './sample-history.svelte'

const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_THRESHOLD_SECONDS = 120

const formatSpanSeconds = (spanSeconds: number): string => {
	if (spanSeconds < MINUTES_THRESHOLD_SECONDS) return `Last ${Math.round(spanSeconds)} s`
	return `Last ${Math.round(spanSeconds / SECONDS_PER_MINUTE)} min`
}

/**
 * Names how much time the history lines cover at the given refresh interval.
 * A manual interval has no clock, so it names the sample count instead.
 */
export const formatHistorySpan = (interval: RefetchInterval): string => {
	if (interval === false) return `Last ${HISTORY_SAMPLES} samples`
	return formatSpanSeconds((HISTORY_SAMPLES * interval) / MS_PER_SECOND)
}
