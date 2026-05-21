const JPEG_SOI = 0xffd8
const JPEG_MARKER_PREFIX = 0xff
const JPEG_APP1_MARKER = 0xe1
const JPEG_EOI_MARKER = 0xd9

const XMP_IDENTIFIER = 'http://ns.adobe.com/xap/1.0/\0'

export type XmpJson = Record<string, unknown>

/** Extract XMP metadata from image bytes and return it as a plain object. */
export const getXmpJsonFromImageBytes = (
	image: Uint8Array,
	mimeType?: string
): XmpJson | null => {
	if (mimeType?.includes('png')) {
		return getXmpJsonFromPng(image)
	}

	return getXmpJsonFromJpeg(image)
}

const getXmpJsonFromJpeg = (image: Uint8Array): XmpJson | null => {
	if (image.length < 4 || readUint16(image, 0) !== JPEG_SOI) {
		return null
	}

	const xmpXml = readXmpXmlFromJpeg(image)
	if (!xmpXml) {
		return null
	}

	return xmpXmlToJson(xmpXml)
}

const readXmpXmlFromJpeg = (image: Uint8Array): string | null => {
	const identifier = new TextEncoder().encode(XMP_IDENTIFIER)
	let offset = 2

	while (offset + 4 < image.length) {
		if (image[offset] !== JPEG_MARKER_PREFIX) {
			break
		}

		const marker = image[offset + 1]
		if (marker === undefined) {
			break
		}

		if (marker === JPEG_EOI_MARKER) {
			break
		}

		const segmentLength = readUint16(image, offset + 2)
		if (segmentLength < 2 || offset + 2 + segmentLength > image.length) {
			break
		}

		if (marker === JPEG_APP1_MARKER) {
			const segmentData = image.subarray(offset + 4, offset + 2 + segmentLength)
			if (startsWith(segmentData, identifier)) {
				const xmpBytes = segmentData.subarray(identifier.length)
				return new TextDecoder('utf-8').decode(xmpBytes)
			}
		}

		offset += 2 + segmentLength
	}

	return null
}

const getXmpJsonFromPng = (image: Uint8Array): XmpJson | null => {
	const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
	if (image.length < signature.length || !startsWith(image, new Uint8Array(signature))) {
		return null
	}

	let offset = signature.length

	while (offset + 12 <= image.length) {
		const chunkLength = readUint32(image, offset)
		const chunkType = new TextDecoder('ascii').decode(image.subarray(offset + 4, offset + 8))

		if (chunkType === 'iTXt') {
			const chunkData = image.subarray(offset + 8, offset + 8 + chunkLength)
			const xmpXml = readXmpXmlFromPngITXtChunk(chunkData)
			if (xmpXml) {
				return xmpXmlToJson(xmpXml)
			}
		}

		offset += 12 + chunkLength
	}

	return null
}

const readXmpXmlFromPngITXtChunk = (chunkData: Uint8Array): string | null => {
	let index = 0

	const readNullTerminated = (): string | null => {
		const start = index
		while (index < chunkData.length && chunkData[index] !== 0) {
			index += 1
		}
		if (index >= chunkData.length) {
			return null
		}
		const value = new TextDecoder('utf-8').decode(chunkData.subarray(start, index))
		index += 1
		return value
	}

	const keyword = readNullTerminated()
	if (keyword !== 'XML:com.adobe.xmp') {
		return null
	}

	readNullTerminated() // compression flag
	readNullTerminated() // compression method
	readNullTerminated() // language tag
	readNullTerminated() // translated keyword

	if (index >= chunkData.length) {
		return null
	}

	return new TextDecoder('utf-8').decode(chunkData.subarray(index))
}

const xmpXmlToJson = (xmpXml: string): XmpJson | null => {
	const doc = new DOMParser().parseFromString(xmpXml, 'application/xml')
	if (doc.querySelector('parsererror')) {
		return null
	}

	const json: XmpJson = {}

	for (const element of doc.querySelectorAll('*')) {
		for (const attribute of element.attributes) {
			if (attribute.localName === 'about' || attribute.name === 'rdf:about') {
				continue
			}

			json[attribute.name] = attribute.value
		}

		if (element.childElementCount === 0 && element.textContent?.trim()) {
			const key = element.prefix
				? `${element.prefix}:${element.localName}`
				: element.localName
			json[key] = element.textContent.trim()
		}
	}

	return Object.keys(json).length > 0 ? json : null
}

const readUint16 = (bytes: Uint8Array, offset: number): number =>
	(bytes[offset]! << 8) | bytes[offset + 1]!

const readUint32 = (bytes: Uint8Array, offset: number): number =>
	(bytes[offset]! << 24) |
	(bytes[offset + 1]! << 16) |
	(bytes[offset + 2]! << 8) |
	bytes[offset + 3]!

const startsWith = (bytes: Uint8Array, prefix: Uint8Array): boolean => {
	if (bytes.length < prefix.length) {
		return false
	}

	for (let index = 0; index < prefix.length; index += 1) {
		if (bytes[index] !== prefix[index]) {
			return false
		}
	}

	return true
}
