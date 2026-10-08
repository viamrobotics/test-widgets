/**
 * The `doCommand` that asks a resource for its custom control artifact.
 *
 * @deprecated Transitional delivery path. A module declares its control per model in
 * `meta.json` (`models[].custom_control`); serving the bytes over `doCommand` exists only until the
 * machine or registry can serve the declared file. Do not build new integrations on it. Module
 * authors keep their manifests and drop the handler when delivery moves.
 */
export const CUSTOM_CONTROL_COMMAND = 'get-custom-control'

export interface CustomControlArtifact {
	html: string
	revision?: string
	/** The `custom_control` path the module declared for this model in its `meta.json`, when reported. */
	path?: string
}
