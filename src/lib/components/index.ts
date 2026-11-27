export { default as ConnectionStatus } from './ConnectionStatus.svelte'
export { Section } from './Section'

export type {
	ComponentPreview,
	ComponentPreviewSnippet,
} from './widgets/Discovery/component-preview.ts'

export { default as DoCommandWidget } from './widgets/DoCommand/DoCommand.svelte'
export { default as ResourceDoCommandWidget } from './widgets/DoCommand/ResourceDoCommand.svelte'

export { default as GenericWidget } from './widgets/Generic/Generic.svelte'

export { default as SlamMap2D } from './Slam/map2d/index.svelte'

export { default as StopWidget } from './Stop.svelte'

export { default as RefetchController } from './RefetchController.svelte'

export { default as CustomControlWidget } from './widgets/CustomControl/CustomControl.svelte'

export {
	CUSTOM_CONTROL_COMMAND,
	CUSTOM_CONTROL_CSP,
	type CustomControlArtifact,
	loadCustomControl,
	prepareArtifact,
} from './widgets/CustomControl/custom-control.ts'
