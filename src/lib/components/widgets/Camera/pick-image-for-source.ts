/**
 * Pick the image whose `sourceName` matches the given source, falling back to
 * the first image.
 */
export const pickImageForSource = <T extends { sourceName: string }>(
	images: T[] | undefined,
	sourceName: string
): T | undefined => {
	if (!images || images.length === 0) {
		return undefined
	}
	if (!sourceName) {
		return images[0]
	}
	return images.find((img) => img.sourceName === sourceName) ?? images[0]
}
