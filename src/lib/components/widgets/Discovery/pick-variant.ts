import type { JsonValue } from '@viamrobotics/sdk'

import { isEqual } from 'lodash-es'

import type { DiscoveredResource } from './group-discoveries'

import { variantAttributes } from './variant-fields'

/**
 * Returns the variant a pick lands on. The pick sets `key` to `value`. The result is the first
 * variant, in input order, that holds the pick and keeps the most of the current variant's other
 * values. When no variant holds the pick, the current index stays.
 */
export const pickVariant = (
	resource: DiscoveredResource,
	current: number,
	key: string,
	value: JsonValue
): number => {
	const attributes = resource.variants.map((variant) => variantAttributes(variant))
	const currentAttributes = attributes[current] ?? {}

	let best: number | undefined
	let bestKept = -1
	for (const [index, candidate] of attributes.entries()) {
		if (!Object.hasOwn(candidate, key) || !isEqual(candidate[key], value)) continue

		const kept = Object.entries(currentAttributes).filter(
			([otherKey, otherValue]) => otherKey !== key && isEqual(candidate[otherKey], otherValue)
		).length
		if (kept > bestKept) {
			best = index
			bestKept = kept
		}
	}

	return best ?? current
}
