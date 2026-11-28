export const matchArrayLength = (
	source: number[],
	target: number[],
	padValue: number
): number[] => {
	const sourceLength = source.length
	const targetLength = target.length
	// If the source array is longer, truncate it to the size of the target array
	if (sourceLength > targetLength) {
		return source.slice(0, targetLength)
	}
	// If the source array is shorter, calculate the number of elements to pad
	const paddingLength = targetLength - sourceLength
	const paddingArray = Array.from<number>({ length: paddingLength }).fill(padValue)
	// Concatenate the original array with the padding array
	return [...source, ...paddingArray]
}
