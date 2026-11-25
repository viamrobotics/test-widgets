/** How many samples each power sensor history line keeps. */
export const HISTORY_SAMPLES = 72

/**
 * Keeps the last `HISTORY_SAMPLES` values of one query. A sample is taken when `updatedAt` moves,
 * so a failed tick adds nothing. A change of `resetKey` clears the history.
 */
export const createSampleHistory = (
	updatedAt: () => number,
	value: () => number | undefined,
	resetKey: () => unknown
) => {
	let samples = $state.raw<readonly number[]>([])
	let previousKey = resetKey()
	let previousUpdatedAt = 0

	$effect(() => {
		const key = resetKey()
		const updatedAtMs = updatedAt()
		const latestValue = value()

		if (key !== previousKey) {
			previousKey = key
			samples = []
		}
		if (updatedAtMs === previousUpdatedAt) return
		previousUpdatedAt = updatedAtMs
		if (latestValue === undefined) return
		samples = [...samples, latestValue].slice(-HISTORY_SAMPLES)
	})

	return {
		get samples() {
			return samples
		},
	}
}
