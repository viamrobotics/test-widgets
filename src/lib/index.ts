export {
	type AddImageToDatasetForm,
	createAddImageToDatasetContext,
	type ImageData,
	useAddImageToDataset,
	useAddToDatasetAction,
} from './add-image-to-dataset'

export { clientForResource, supportsDoCommand } from './client-map'
export * from './components'

export { getResourceAPI } from './get-resource-api'
export {
	isKnownResource,
	// TODO: Delete `hasWidget`
	/** @deprecated use `isKnownResource` instead. Will be deleted in the next release  */
	isKnownResource as hasWidget,
} from './is-known-resource'
export { hasPip, providePip, usePip } from './pip/context.svelte'
export { ResourceTriplets } from './resource-triplet'
export type { ResourceTriplet } from './resource-triplet'
export type {
	ResourceWidget,
	ResourceWidgetDefinition,
	ResourceWidgetKind,
	ResourceWidgetProps,
	ResourceWidgetsEntry,
} from './resource-widget-types'
export { showResourceWidget } from './show-resource-widget'
export { default as WidgetsProvider } from './WidgetsProvider.svelte'

export * as Arm from './components/widgets/Arm/index.ts'
export * as Motion from './components/widgets/Motion/index.ts'
export * as Motor from './components/widgets/Motor/index.ts'
