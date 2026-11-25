/** Extract unique, non-empty source names from a GetImages response. */
export const getSourceNames = (images: { sourceName: string }[]): string[] => {
	return [...new Set(images.map((img) => img.sourceName).filter(Boolean))]
}
