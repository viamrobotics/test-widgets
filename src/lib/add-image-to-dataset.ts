import { getContext, setContext } from 'svelte';

const key = Symbol('add-image-to-dataset-context');

export interface ImageData {
	binaryData: Uint8Array;
	partID: string;
	componentType: 'camera';
	componentName: string;
	methodName: string;
	mimeType: string;
	dataRequestTimes: [Date, Date];
}

interface AddImageToDatasetContext {
	addImageToDataset: (imageData: ImageData) => void;
}

export const createAddImageToDatasetContext = (onAddImage?: (imageData: ImageData) => void) => {
	const addImageToDataset = (imageData: ImageData) => {
		onAddImage?.(imageData);
	};

	const context: AddImageToDatasetContext = {
		addImageToDataset
	};

	setContext<AddImageToDatasetContext>(key, context);

	return context;
};

/**
 * Noop fallback is created because the context is provided in userland outside the SDK.
 */
export const useAddImageToDataset = (): AddImageToDatasetContext => {
	return getContext<AddImageToDatasetContext | undefined>(key) ?? createAddImageToDatasetContext();
};
