/** A caught value as an `Error`, so a rejection that is not one still reaches the indicator. */
export const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error(String(error))
