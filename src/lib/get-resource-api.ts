import type { ResourceName } from '@viamrobotics/sdk'

export const getResourceAPI = ({ namespace, type, subtype }: ResourceName) =>
	`${namespace}:${type}:${subtype}`
