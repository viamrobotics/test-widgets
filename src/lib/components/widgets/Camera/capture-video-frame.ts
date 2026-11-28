import type { MediaFrameCapture } from '#lib/components/MediaFrame/media-frame-capture.js'

/**
 * Copies the frame a video is showing into a PNG, at the video's own resolution.
 *
 * @throws When the video has no frame yet.
 */
export const captureVideoFrame = async (video: HTMLVideoElement): Promise<MediaFrameCapture> => {
	const { videoWidth, videoHeight } = video
	if (videoWidth === 0 || videoHeight === 0) throw new Error('The feed has no frame to capture yet')

	const canvas = new OffscreenCanvas(videoWidth, videoHeight)
	const context = canvas.getContext('2d')
	if (!context) throw new Error('No 2D context to copy the video frame into')
	context.drawImage(video, 0, 0)

	const blob = await canvas.convertToBlob({ type: 'image/png' })
	return { binaryData: new Uint8Array(await blob.arrayBuffer()), mimeType: blob.type }
}
