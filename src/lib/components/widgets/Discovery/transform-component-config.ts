import type { appRobotApi } from '@viamrobotics/sdk'

// The below code was copied from `ui/src/lib/resource-type.ts`
const TRIPLET_SEPARATOR = ':'
const TRIPLET_PARTS = 3

/** Check if a string is a valid API or model triplet. */
const isResourceTriplet = (value: string): boolean => {
	const parts = value.split(TRIPLET_SEPARATOR)

	return parts.length === TRIPLET_PARTS && parts.every((part) => part !== '')
}

/**
 * Returns a copy of the component config that is safe to add to a machine part's config. With a
 * qualified API and model, the deprecated `namespace` and `type` fields are cleared.
 *
 * @param resource The resource config to validate
 */
export const transformComponentConfig = (
	resource: appRobotApi.ComponentConfig
): appRobotApi.ComponentConfig => {
	const next = resource.clone()

	if (isResourceTriplet(next.api) && isResourceTriplet(next.model)) {
		next.namespace = ''
		next.type = ''
	}

	return next
}
