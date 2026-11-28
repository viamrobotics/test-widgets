export const MISSING_HOST_PIN_REASON = 'Enter a pin in the Pin field above.'

export const PIN_BUSY_REASON = 'Wait for the call in flight on this pin to finish.'

/** Why a pin widget's button is held back with no pin, by whether the widget draws its own `Pin` field. */
export const missingPinReason = (hasOwnPinField: boolean): string =>
	hasOwnPinField ? 'Enter a pin.' : MISSING_HOST_PIN_REASON
