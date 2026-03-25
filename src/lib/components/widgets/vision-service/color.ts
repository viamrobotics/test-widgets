export const colors = [
	'#EF8733',
	'#52B4E6',
	'#E9335A',
	'#75FBD0',
	'#FFFF54',
	'#EA33F7',
	'#3778F5',
	'#F3AFAD',
	'#0000F5',
	'#965635',
	'#808026',
	'#463D86',
	'#7F1786',
	'#EB5528',
	'#CA3142',
	'#75FBFD',
	'#D4C0D6',
	'#EA3891',
	'#FBE5BB',
	'#CD7693',
	'#D8B98D',
	'#6F94E6',
	'#D2FB50',
	'#7B2AF5',
] as const

/**
 * A subset of the above background colors have lightness values high
 * enough to require dark text for accessible contrast.
 */
export const lightTextColors = ['#0000F5', '#965635', '#463D86', '#7F1786', '#CA3142', '#7B2AF5']

const cache: Record<string, string> = {}

const uniqueIndexFromString = (str: string): number => {
	let hash = 0
	for (let i = 0; i < str.length; i += 1) {
		const char = str.codePointAt(i)
		if (char) {
			hash = (hash << 5) - hash + char
		}
		hash = Math.trunc(hash)
	}
	return Math.abs(hash) % colors.length
}

export const labelToColor = (label: string): string => {
	const result = cache[label]

	if (result) {
		return result
	}

	const index = uniqueIndexFromString(label)
	const color = colors[index] as string

	cache[label] = color

	return color
}
