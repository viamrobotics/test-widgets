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
// The composed lookups (`apiWidgetsForResource` / `availableAPIWidgets` / `widgetForResource`)
// reference both registries, so they live behind the `/registry` entry point rather than the
// root. Keeping them out of the root means importing a widget or helper here never drags in
// every widget (and the maplibre/three peers the service widgets need). See ./resource-widget.ts.
export type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetProps,
} from './resource-widget-types'
export { showResourceWidget } from './show-resource-widget'
