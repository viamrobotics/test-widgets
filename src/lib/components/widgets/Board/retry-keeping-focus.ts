import { tick } from 'svelte'

/**
 * Runs a retry from its Retry button. A retry that succeeds unmounts the button, and focus would
 * drop to the page, so focus moves to `nextFocusTarget()` when the button held it.
 */
export const retryKeepingFocus = async (
	button: HTMLElement,
	retry: () => Promise<void>,
	nextFocusTarget: () => HTMLElement | null | undefined
): Promise<void> => {
	const hadFocus = document.activeElement === button
	await retry()
	await tick()
	const isFocusDropped = document.activeElement === null || document.activeElement === document.body
	if (hadFocus && !button.isConnected && isFocusDropped) nextFocusTarget()?.focus()
}
