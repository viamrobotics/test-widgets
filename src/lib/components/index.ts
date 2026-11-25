export { default as ConnectionStatus } from './connection-status.svelte'
export { Section } from './section'

export { default as LiveOrPollingVideo } from './widgets/Camera/live-or-polling-video.svelte'

export type {
	ComponentPreview,
	ComponentPreviewSnippet,
} from './widgets/Discovery/component-preview.ts'

export { default as DoCommandWidget } from './widgets/do-command/do-command.svelte'
export { default as ResourceDoCommandWidget } from './widgets/do-command/resource-do-command.svelte'

export { default as GenericWidget } from './widgets/generic/generic.svelte'

export { default as SlamMap2D } from './slam/map2d/index.svelte'

export { default as StopWidget } from './stop.svelte'

export { labelToColor } from './widgets/Vision/color'
export { getImageSize, type Size } from './widgets/Vision/get-image-size'

export { default as RefetchController } from './refetch-controller.svelte'

export { default as CustomControlWidget } from './widgets/custom-control/custom-control.svelte'

export {
	CUSTOM_CONTROL_COMMAND,
	CUSTOM_CONTROL_CSP,
	type CustomControlArtifact,
	loadCustomControl,
	prepareArtifact,
} from './widgets/custom-control/custom-control.ts'
