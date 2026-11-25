import type { JsonValue } from '@viamrobotics/sdk'

/** A JSON object, the shape of a config's attributes. */
export interface JsonObject {
	[key: string]: JsonValue
}

const isJsonObject = (value: JsonValue): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Flattens nested objects to dotted keys. Arrays stay whole as one value, and an empty nested
 * object stays as an empty object under its key.
 */
export const flattenAttributes = (attributes: JsonObject): Record<string, JsonValue> => {
	const flat: Record<string, JsonValue> = {}

	const visit = (object: JsonObject, prefix: string) => {
		for (const [key, value] of Object.entries(object)) {
			const path = prefix === '' ? key : `${prefix}.${key}`
			if (isJsonObject(value) && Object.keys(value).length > 0) {
				visit(value, path)
			} else {
				flat[path] = value
			}
		}
	}

	visit(attributes, '')
	return flat
}
