const EXTENSION_BY_MIME_SUBTYPE = new Map([
	['jpeg', 'jpg'],
	['png', 'png'],
	['pcd', 'pcd'],
])

const FALLBACK_EXTENSION = 'bin'

/**
 * The download name for a saved frame: `<label>-<ISO time>.<extension>`.
 * The time's colons become dashes, because some file systems reject a colon in a file name.
 */
export const screenshotFileName = (label: string, mimeType: string, date: Date): string => {
	const subtype = mimeType.split('/').at(1)?.toLowerCase() ?? ''
	const extension = EXTENSION_BY_MIME_SUBTYPE.get(subtype) ?? FALLBACK_EXTENSION
	const time = date.toISOString().replaceAll(':', '-')
	return `${label}-${time}.${extension}`
}
