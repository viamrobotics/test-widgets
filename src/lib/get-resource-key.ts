import type { ResourceName } from '@viamrobotics/sdk'

import { getResourceAPI } from './get-resource-api.ts'

export const getResourceKey = (name: ResourceName) => `${getResourceAPI(name)}/${name.name}`
