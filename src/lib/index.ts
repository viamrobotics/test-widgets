export {
	createAddImageToDatasetContext,
	type ImageData,
	useAddImageToDataset,
} from './add-image-to-dataset'

export { apiDocsHref } from './api-docs-href'

export { clientForResource } from './client-map'
export * from './components'

export { getResourceAPI } from './get-resource-api'
export {
	isKnownResource,
	// TODO: Delete `hasWidget`
	/** @deprecated use `isKnownResource` instead. Will be deleted in the next release  */
	isKnownResource as hasWidget,
} from './is-known-resource'
export { providePip, usePip } from './pip/context.svelte'
export { ResourceTriplets } from './resource-triplet'
export type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetProps,
} from './resource-widget-types'
export { showResourceWidget } from './show-resource-widget'
