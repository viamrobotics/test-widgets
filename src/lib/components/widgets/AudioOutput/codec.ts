export const MimeToCodec: Record<string, string> = {
	'audio/mpeg': 'mp3',
	'audio/mp3': 'mp3',
	'audio/wav': 'wav',
	'audio/x-wav': 'wav',
	'audio/aac': 'aac',
	'audio/ogg': 'opus',
	'audio/flac': 'flac',
	'audio/x-flac': 'flac',
}

// Raw PCM formats have no standard MIME type; map by file extension directly.
export const ExtToCodec: Record<string, string> = {
	pcm16: 'pcm16',
	pcm32: 'pcm32',
	pcm32_float: 'pcm32_float',
}
