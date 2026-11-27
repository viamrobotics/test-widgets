interface CodecFormat {
	/** File extensions, without the dot, that hold this codec. */
	extensions: string[]
	/** MIME types a browser reports for files that hold this codec. */
	mimeTypes: string[]
}

const CODEC_FORMATS: Record<string, CodecFormat> = {
	mp3: { extensions: ['mp3'], mimeTypes: ['audio/mpeg', 'audio/mp3'] },
	wav: { extensions: ['wav'], mimeTypes: ['audio/wav', 'audio/x-wav'] },
	aac: { extensions: ['aac'], mimeTypes: ['audio/aac'] },
	opus: { extensions: ['ogg'], mimeTypes: ['audio/ogg'] },
	flac: { extensions: ['flac'], mimeTypes: ['audio/flac', 'audio/x-flac'] },
	// Raw PCM formats have no standard MIME type; they map by file extension directly.
	pcm16: { extensions: ['pcm16'], mimeTypes: [] },
	pcm32: { extensions: ['pcm32'], mimeTypes: [] },
	pcm32_float: { extensions: ['pcm32_float'], mimeTypes: [] },
}

const entries = Object.entries(CODEC_FORMATS)

const MIME_TO_CODEC: Record<string, string> = Object.fromEntries(
	entries.flatMap(([codec, format]) => format.mimeTypes.map((mime) => [mime, codec]))
)

const EXTENSION_TO_CODEC: Record<string, string> = Object.fromEntries(
	entries
		.filter(([, format]) => format.mimeTypes.length === 0)
		.flatMap(([codec, format]) => format.extensions.map((extension) => [extension, codec]))
)

/**
 * The codec an audio file holds, read from its MIME type, then an `audio/<extension>` type,
 * then its extension.
 *
 * @returns The codec, or `undefined` when the file is not a format Play accepts.
 */
export const codecFromFile = (file: File): string | undefined => {
	const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
	// Own keys only: an extension such as `constructor` would otherwise match the object's prototype.
	const own = (table: Record<string, string>, key: string) =>
		Object.hasOwn(table, key) ? table[key] : undefined
	return (
		own(MIME_TO_CODEC, file.type) ??
		own(MIME_TO_CODEC, `audio/${extension}`) ??
		own(EXTENSION_TO_CODEC, extension)
	)
}

/**
 * The `accept` value of a file input that offers `codecs`: each codec's extensions and MIME
 * types. Codecs this module does not know add nothing.
 *
 * @returns The comma-separated list, or `undefined` when no offered codec is known, so the
 *   input accepts any file.
 */
export const acceptForCodecs = (codecs: string[]): string | undefined => {
	const tokens = codecs.flatMap((codec) => {
		const format = CODEC_FORMATS[codec]
		if (format === undefined) return []
		return [...format.extensions.map((extension) => `.${extension}`), ...format.mimeTypes]
	})
	return tokens.length === 0 ? undefined : tokens.join(',')
}
