import type { Snippet } from 'svelte'

/** One frame taken from a media host, as bytes in their own format. */
export interface MediaFrameCapture {
	binaryData: Uint8Array
	mimeType: string
	/** An image of the capture, for bytes a browser cannot draw, such as a point cloud. The dialog draws it, and `onConfirm` receives it beside the bytes. */
	preview?: MediaFramePreview
}

/** An image the Add to dataset dialog draws in place of the captured bytes. */
export interface MediaFramePreview {
	binaryData: Uint8Array
	mimeType: string
}

/** What the host app's dataset form receives about the captured frame. */
export interface DatasetFormProps {
	binaryData: Uint8Array
	mimeType: string
	resourceName: string
	methodName: string
}

/**
 * Turns on the frame's Add to dataset action and its dialog.
 * `form` is the host app's own form. Without it, the dialog shows the preview and Confirm alone.
 */
export interface MediaFrameAddToDataset {
	form?: Snippet<[DatasetFormProps]>
	capture: () => Promise<MediaFrameCapture>
	/** Resolve closes the dialog. Reject keeps it open and shows the error in it. */
	onConfirm: (capture: MediaFrameCapture) => Promise<void>
	/** The camera's name, also when a vision service produced the frame. */
	resourceName: string
	methodName: string
}

/**
 * Turns on the frame's Picture-in-picture action through `#lib/pip`.
 * `key` names the stream in the pip context. Without `stream`, pip plays its own feed for `key`.
 */
export interface MediaFramePictureInPicture {
	key: string
	stream?: () => MediaStream | undefined
}
