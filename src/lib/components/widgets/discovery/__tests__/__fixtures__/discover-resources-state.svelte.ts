import type { appRobotApi } from '@viamrobotics/sdk'

export const discoverState = $state<{
	data: appRobotApi.ComponentConfig[] | undefined
	response: appRobotApi.ComponentConfig[]
	isFetching: boolean
	fetched: number
}>({ data: undefined, response: [], isFetching: false, fetched: 0 })

export const resetDiscoverState = () => {
	discoverState.data = undefined
	discoverState.response = []
	discoverState.isFetching = false
	discoverState.fetched = 0
}
