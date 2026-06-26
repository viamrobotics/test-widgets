const NO_LINK_METHODS = new Set(['getStatus', 'getSourceNames'])

/**
 * Returns the docs URL for a given resource API + method, or undefined
 * when the method has no dedicated anchor (e.g. GetStatus, GetSourceNames).
 *
 * @param api  - RDK API string, e.g. "rdk:component:movement_sensor"
 * @param method - camelCase method name, e.g. "getPosition"
 */
export const apiDocsHref = (api: string, method: string): string | undefined => {
	if (NO_LINK_METHODS.has(method)) return undefined

	const isService = api.includes(':service:')
	// RDK API strings use underscores (movement_sensor); docs URLs use hyphens (movement-sensor)
	const subtype = api.split(':').at(-1)!.replaceAll('_', '-')
	const kind = isService ? 'services' : 'components'

	return `https://docs.viam.com/reference/apis/${kind}/${subtype}/#${method.toLowerCase()}`
}
