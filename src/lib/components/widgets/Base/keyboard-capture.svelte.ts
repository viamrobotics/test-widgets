interface KeyboardCaptureHolder {
	release: () => void
}

// One holder for the whole page, so engaging capture in one base quick move releases any other.
let currentHolder: KeyboardCaptureHolder | undefined

export interface KeyboardCapture {
	readonly isCaptured: boolean
	/** Takes the keys, releasing whichever control on the page held them. */
	engage: () => void
	/** Returns the keys. Calls `onRelease` only when this control held them. */
	release: () => void
	toggle: () => void
}

/**
 * Explicit keyboard capture for one control. At most one control on the page holds the keys at a
 * time, and every way capture ends, including another control engaging, goes through `onRelease`.
 */
export const createKeyboardCapture = (onRelease: () => void): KeyboardCapture => {
	let isCaptured = $state(false)

	const release = () => {
		if (currentHolder === holder) {
			currentHolder = undefined
		}
		if (!isCaptured) {
			return
		}
		isCaptured = false
		onRelease()
	}

	const holder: KeyboardCaptureHolder = { release }

	const engage = () => {
		if (currentHolder === holder) {
			return
		}
		currentHolder?.release()
		currentHolder = holder
		isCaptured = true
	}

	return {
		get isCaptured() {
			return isCaptured
		},
		engage,
		release,
		toggle: () => {
			if (isCaptured) {
				release()
			} else {
				engage()
			}
		},
	}
}
