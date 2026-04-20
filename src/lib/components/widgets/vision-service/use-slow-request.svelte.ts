const SLOW_REQUEST_THRESHOLD_MS = 5000

export const useSlowRequest = (isFetching: () => boolean) => {
	let isSlow = $state(false)

	$effect(() => {
		if (!isFetching()) {
			isSlow = false
			return
		}

		isSlow = false
		const timeout = setTimeout(() => {
			isSlow = true
		}, SLOW_REQUEST_THRESHOLD_MS)

		return () => {
			clearTimeout(timeout)
		}
	})

	return {
		get isSlow() {
			return isSlow
		},
	}
}
