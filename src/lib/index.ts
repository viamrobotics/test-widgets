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
export * as Base from './components/widgets/Base/index.ts'
export * as Board from './components/widgets/Board/index.ts'
export * as Button from './components/widgets/Button/index.ts'
export * as Gantry from './components/widgets/Gantry/index.ts'
export * as Gripper from './components/widgets/Gripper/index.ts'
export * as Motion from './components/widgets/Motion/index.ts'
export * as Motor from './components/widgets/Motor/index.ts'
export * as Sensor from './components/widgets/Sensor/index.ts'
export * as Servo from './components/widgets/Servo/index.ts'
export * as Switch from './components/widgets/Switch/index.ts'
