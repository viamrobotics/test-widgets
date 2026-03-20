import isPlainObject from 'lodash-es/isPlainObject'

export const compareAlphaNum = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

type SortObject = Record<string, unknown>

/**
 * Sorts the keys of a given object in alphanumeric order.
 *
 * This function takes an object with unordered keys and returns a new object
 * with the same keys sorted in alphanumeric order. If the object contains nested
 * objects or arrays with objects, it recursively sorts their keys as well.
 *
 * Note: The sorting is case-sensitive and treats numbers as part of the strings.
 *
 * @param {T} unorderedObj - The object with unordered keys to be sorted.
 * @param compareFn - A optional custom compare function for sorting, which will override the default alphanumeric sort function.
 *
 * @returns {T} A new object with keys sorted in alphanumeric order.
 *
 *
 * (Originally from ui/src/lib/sort.ts)
 */
export const sortObjectKeys = <T extends SortObject>(
	unorderedObj: T,
	compareFn?: (a: string, b: string) => number
): T => {
	const sortedObj: SortObject = {}

	for (const key of Object.keys(unorderedObj).toSorted(compareFn ?? compareAlphaNum)) {
		const value = unorderedObj[key]
		if (Array.isArray(value)) {
			sortedObj[key] = value.map((element) =>
				isPlainObject(element) ? sortObjectKeys(element, compareFn) : element
			)
			continue
		}

		sortedObj[key] = isPlainObject(value) ? sortObjectKeys(value as T, compareFn) : value
	}

	return sortedObj as T
}
