interface MockNamedImage {
	sourceName: string
	mimeType: string
	image: Uint8Array
}

export interface MockImagesResponse {
	images: MockNamedImage[]
	metadata?: { capturedAt: { toDate: () => Date } }
}

export interface MockProperties {
	supportsPcd: boolean
	frameRate?: number
	mimeTypes: string[]
	intrinsicParameters?: {
		widthPx: number
		heightPx: number
		focalXPx: number
		focalYPx: number
		centerXPx: number
		centerYPx: number
	}
	distortionParameters?: { model: string; parameters: number[] }
}

interface CameraQueryState {
	imagesResponse: MockImagesResponse | undefined
	imagesData: MockImagesResponse | undefined
	imagesArgs: unknown[]
	pointCloudResponse: Uint8Array | undefined
	pointCloudData: Uint8Array | undefined
	properties: MockProperties | undefined
	fetched: string[]
}

/** Reactive, so a widget reading `query.data` redraws when a mocked refetch fills it. */
export const cameraQueryState = $state<CameraQueryState>({
	imagesResponse: undefined,
	imagesData: undefined,
	imagesArgs: [],
	pointCloudResponse: undefined,
	pointCloudData: undefined,
	properties: undefined,
	fetched: [],
})

export const resetCameraQueryState = () => {
	cameraQueryState.imagesResponse = undefined
	cameraQueryState.imagesData = undefined
	cameraQueryState.imagesArgs = []
	cameraQueryState.pointCloudResponse = undefined
	cameraQueryState.pointCloudData = undefined
	cameraQueryState.properties = undefined
	cameraQueryState.fetched = []
}
