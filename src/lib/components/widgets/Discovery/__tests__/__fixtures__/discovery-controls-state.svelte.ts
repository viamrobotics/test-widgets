import type { appRobotApi, JsonValue } from '@viamrobotics/sdk'

type PreviewArgs = () => [{ command: string; attributes: JsonValue }]

export const discoveryControlsState = $state<{
	data: appRobotApi.ComponentConfig[] | undefined
	isFetching: boolean
	error: Error | null
	previewResult: JsonValue | undefined
	isPreviewFetching: boolean
}>({
	data: undefined,
	isFetching: false,
	error: null,
	previewResult: undefined,
	isPreviewFetching: false,
})

/** The args getter of every `doCommand` query the control created, in creation order. */
export const previewArgs: PreviewArgs[] = []

export const resetDiscoveryControlsState = () => {
	discoveryControlsState.data = undefined
	discoveryControlsState.isFetching = false
	discoveryControlsState.error = null
	discoveryControlsState.previewResult = undefined
	discoveryControlsState.isPreviewFetching = false
	previewArgs.length = 0
}
