export const useCountdown = (onComplete: () => void) => {
	let secondsRemaining = $state<number | undefined>(undefined)
	let intervalID = 0

	const cancel = () => {
		globalThis.clearInterval(intervalID)
		secondsRemaining = undefined
	}

	const start = (seconds: number) => {
		cancel()
		if (seconds <= 0) {
			onComplete()
			return
		}
		secondsRemaining = seconds
		intervalID = window.setInterval(() => {
			if (secondsRemaining === undefined) {
				return
			}
			secondsRemaining -= 1
			if (secondsRemaining <= 0) {
				cancel()
				onComplete()
			}
		}, 1000)
	}

	$effect(() => cancel)

	return {
		get isCounting() {
			return secondsRemaining !== undefined
		},
		get secondsRemaining() {
			return secondsRemaining
		},
		start,
		cancel,
	}
}
