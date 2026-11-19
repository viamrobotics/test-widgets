/** A caught value as an `Error`, keeping a non-`Error` value as its `cause`. */
export const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error(String(error), { cause: error })
