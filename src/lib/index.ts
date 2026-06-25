export {
	createAddImageToDatasetContext,
	type ImageData,
	useAddImageToDataset,
} from './add-image-to-dataset'

export { clientForResource } from './client-map'
export * from './components'

export { getResourceAPI } from './get-resource-api'

export { providePip, usePip } from './pip/context.svelte'
export { ResourceTriplets } from './resource-triplet'
export {
	availableResourceWidgets,
	createResourceWidget,
	isKnownResource,
	// TODO: Delete `hasWidget`
	/** @deprecated use `isKnownResource` instead. Will be deleted in the next release  */
	isKnownResource as hasWidget,
	showResourceWidget,
	widgetForResource,
} from './resource-widget'
