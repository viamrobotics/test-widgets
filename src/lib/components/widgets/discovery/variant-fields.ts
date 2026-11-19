import type { JsonValue } from '@viamrobotics/sdk'

import { isEqual } from 'lodash-es'

import type { DiscoveredResource } from './group-discoveries'

import { flattenAttributes, type JsonObject } from './flatten-attributes'

export interface VariantField {
	key: string
	values: JsonValue[]
	/** True when the flattened values differ across variants. */
	isControl: boolean
}

const isJsonObject = (value: JsonValue | undefined): value is JsonObject =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

/** The flattened attributes of one variant. */
export const variantAttributes = (variant: DiscoveredResource['variants'][number]) => {
	const attributes = variant.attributes?.toJson()
	return flattenAttributes(isJsonObject(attributes) ? attributes : {})
}

/** One field per flattened attribute key, with its distinct values in first-seen order. */
export const variantFields = (resource: DiscoveredResource): VariantField[] => {
	const fields = new Map<string, JsonValue[]>()
	const flattened = resource.variants.map((variant) => variantAttributes(variant))

	for (const attributes of flattened) {
		for (const [key, value] of Object.entries(attributes)) {
			const values = fields.get(key) ?? []
			if (!values.some((seen) => isEqual(seen, value))) values.push(value)
			fields.set(key, values)
		}
	}

	return [...fields].map(([key, values]) => ({
		key,
		values,
		isControl: values.length > 1 || flattened.some((attributes) => !Object.hasOwn(attributes, key)),
	}))
}
