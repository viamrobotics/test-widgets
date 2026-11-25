import type { Attachment } from 'svelte/attachments'

export interface PressAndHoldOptions {
	onPress: () => void
	onRelease: () => void
}

const HOLD_KEYS = new Set([' ', 'Enter'])
const PRIMARY_POINTER_BUTTON = 0

/**
 * Turns a button into a hold control. `onPress` fires once when the pointer or Space or Enter goes
 * down, and `onRelease` fires once when it comes up or the hold is interrupted (pointer cancel,
 * lost capture, blur, the tab hiding, or the button leaving the page). `onRelease` never fires
 * without a prior `onPress`.
 */
export const pressAndHold = ({
	onPress,
	onRelease,
}: PressAndHoldOptions): Attachment<HTMLButtonElement> => {
	return (button) => {
		let isHeld = false

		const press = () => {
			if (isHeld) {
				return
			}
			isHeld = true
			onPress()
		}

		const release = () => {
			if (!isHeld) {
				return
			}
			isHeld = false
			onRelease()
		}

		const onPointerDown = (event: PointerEvent) => {
			if (event.button !== PRIMARY_POINTER_BUTTON) {
				return
			}
			button.setPointerCapture(event.pointerId)
			press()
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (!HOLD_KEYS.has(event.key)) {
				return
			}
			event.preventDefault()
			if (!event.repeat) {
				press()
			}
		}

		const onKeyUp = (event: KeyboardEvent) => {
			if (HOLD_KEYS.has(event.key)) {
				release()
			}
		}

		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') {
				release()
			}
		}

		button.addEventListener('pointerdown', onPointerDown)
		button.addEventListener('pointerup', release)
		button.addEventListener('pointercancel', release)
		button.addEventListener('lostpointercapture', release)
		button.addEventListener('keydown', onKeyDown)
		button.addEventListener('keyup', onKeyUp)
		button.addEventListener('blur', release)
		document.addEventListener('visibilitychange', onVisibilityChange)

		return () => {
			// A held button that unmounts gets no pointerup, so the device would keep moving.
			release()
			button.removeEventListener('pointerdown', onPointerDown)
			button.removeEventListener('pointerup', release)
			button.removeEventListener('pointercancel', release)
			button.removeEventListener('lostpointercapture', release)
			button.removeEventListener('keydown', onKeyDown)
			button.removeEventListener('keyup', onKeyUp)
			button.removeEventListener('blur', release)
			document.removeEventListener('visibilitychange', onVisibilityChange)
		}
	}
}
