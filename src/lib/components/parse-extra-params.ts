export interface ParsedExtraParams {
	/** Parsed params, or undefined when the text is empty or invalid. */
	params: Record<string, unknown> | undefined
	/** Why the text failed to parse, if it did. */
	error: Error | undefined
}

/**
 * Parses the "additional parameters" JSON typed into a test card into the
 * `extra` argument accepted by resource API methods.
 * @param text - Raw JSON text from the editor
 * @returns Parsed params, or an error when the text is not a JSON object
 * @example parseExtraParams('{"quality": 75}') // { params: { quality: 75 }, error: undefined }
 */
export const parseExtraParams = (text: string): ParsedExtraParams => {
	if (text.trim() === '') {
		return { params: undefined, error: undefined }
	}

	let value: unknown
	try {
		value = JSON.parse(text)
	} catch (error) {
		return { params: undefined, error: error as Error }
	}

	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return { params: undefined, error: new Error('Additional parameters must be a JSON object') }
	}

	return { params: value as Record<string, unknown>, error: undefined }
}
