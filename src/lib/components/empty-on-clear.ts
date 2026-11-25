/**
 * Attributes for a prime-controls `NumberField` whose bound value may be `undefined`. The field
 * writes each typed number and never `undefined`, so a cleared field would keep its last number.
 * Spread these on it to call `setEmpty` when the input is emptied. A number input also reads empty
 * for text that is not a number yet, such as a lone `-`.
 *
 * @example
 * <NumberField {...emptyOnClear(() => (power = undefined))} bind:value={power} />
 */
export const emptyOnClear = (setEmpty: () => void) => ({
	oninput: (event: Event & { currentTarget: HTMLInputElement }) => {
		if (event.currentTarget.value === '') setEmpty()
	},
})
