import type { MediaFramePreview } from '#lib/components/MediaFrame/media-frame-capture.js'

import { getBlobForViamDepth, VIAM_DEPTH_MIME_TYPE } from './decode-viam-depth'

/**
 * The PNG the Add to dataset dialog draws for a raw Viam depth frame, which no browser can draw.
 *
 * @returns `undefined` for any other mime type, whose bytes are their own preview.
 */
export const depthPreviewFor = async (
	bytes: Uint8Array,
	mimeType: string
): Promise<MediaFramePreview | undefined> => {
	if (mimeType !== VIAM_DEPTH_MIME_TYPE) return undefined
	const png = await getBlobForViamDepth(bytes)
	if (!png) throw new Error('Failed to decode depth image')
	return { binaryData: new Uint8Array(await png.arrayBuffer()), mimeType: png.type }
}
