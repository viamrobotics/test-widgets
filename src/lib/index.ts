export {
	createAddImageToDatasetContext,
	type ImageData,
	useAddImageToDataset,
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
export { providePip, usePip } from './pip/context.svelte'
export { ResourceTriplets } from './resource-triplet'
export type { ResourceTriplet } from './resource-triplet'
export type {
	ResourceAPIWidget,
	ResourceWidget,
	ResourceWidgetProps,
} from './resource-widget-types'
export { showResourceWidget } from './show-resource-widget'
export { loadCustomControl } from './custom-control/load-custom-control.ts'
export {
	CUSTOM_CONTROL_COMMAND,
	type CustomControlArtifact,
} from './custom-control/custom-control-command.ts'
export { prepareArtifact } from './custom-control/prepare-artifact.ts'
export { CUSTOM_CONTROL_CSP } from './custom-control/content-security-policy.ts'
