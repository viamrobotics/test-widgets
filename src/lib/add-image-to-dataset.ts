import { getContext, setContext, type Snippet } from 'svelte'

import type {
	DatasetFormProps,
	MediaFrameAddToDataset,
	MediaFrameCapture,
} from '$lib/components/media-frame/media-frame-capture'

const key = Symbol('add-image-to-dataset-context')

export interface ImageData {
	binaryData: Uint8Array
	partID: string
	componentType: 'camera'
	componentName: string
	methodName: string
	mimeType: string
	dataRequestTimes: [Date, Date]
}

/**
 * The host app's own Add to dataset form and the save it performs.
 * `onConfirm` resolves to close the dialog and rejects to keep it open with the error shown.
 */
export interface AddImageToDatasetForm {
	form: Snippet<[DatasetFormProps]>
	onConfirm: (capture: MediaFrameCapture) => Promise<void>
}

type AddImageToDatasetHandler = ((imageData: ImageData) => void) | AddImageToDatasetForm

interface AddImageToDatasetContext {
	addImageToDataset: (imageData: ImageData) => void
	handler: AddImageToDatasetHandler | undefined
}

/**
 * Provides Add to dataset to the widgets below the calling component.
 * A function is the legacy `onAddImage` and receives a complete `ImageData`.
 * A `{ form, onConfirm }` object shows the host's form in the dialog, and
 * `addImageToDataset` does nothing for it.
 */
export const createAddImageToDatasetContext = (handler?: AddImageToDatasetHandler) => {
	const addImageToDataset = (imageData: ImageData) => {
		if (typeof handler === 'function') {
			handler(imageData)
		}
	}

	const context: AddImageToDatasetContext = {
		addImageToDataset,
		handler,
	}

	setContext<AddImageToDatasetContext>(key, context)

	return context
}

/**
 * Noop fallback is created because the context is provided in userland outside the SDK.
 */
export const useAddImageToDataset = (): AddImageToDatasetContext => {
	return getContext<AddImageToDatasetContext | undefined>(key) ?? createAddImageToDatasetContext()
}

interface AddToDatasetActionArgs {
	partID: string
	cameraName: string
	methodName: string
}

/**
 * Reads the dataset context for a frame's Add to dataset action. The host supplies `capture`.
 * The getter returns `undefined` when the app provided no context, which hides the action.
 * It does not create a noop context.
 * With a legacy `onAddImage`, confirming builds an `ImageData` and calls it, and `form` is `undefined`.
 */
export const useAddToDatasetAction = (
	getArgs: () => AddToDatasetActionArgs
): (() => Omit<MediaFrameAddToDataset, 'capture'> | undefined) => {
	const context = getContext<AddImageToDatasetContext | undefined>(key)

	return () => {
		if (context === undefined) {
			return undefined
		}

		const { partID, cameraName, methodName } = getArgs()
		const { handler } = context

		if (handler !== undefined && typeof handler !== 'function') {
			return {
				form: handler.form,
				onConfirm: handler.onConfirm,
				resourceName: cameraName,
				methodName,
			}
		}

		return {
			form: undefined,
			onConfirm: async ({ binaryData, mimeType }) => {
				const confirmedAt = new Date()
				context.addImageToDataset({
					binaryData,
					mimeType,
					partID,
					componentType: 'camera',
					componentName: cameraName,
					methodName,
					dataRequestTimes: [confirmedAt, confirmedAt],
				})
			},
			resourceName: cameraName,
			methodName,
		}
	}
}
