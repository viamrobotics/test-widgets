import type { JsonValue } from '@viamrobotics/sdk'

import { CUSTOM_CONTROL_COMMAND, type CustomControlArtifact } from './custom-control-command'

interface DoCommandClient {
	doCommand(command: Record<string, JsonValue>): Promise<JsonValue>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const assertArtifact: (value: unknown) => asserts value is CustomControlArtifact = (value) => {
	if (!isRecord(value)) {
		throw new Error('Invalid custom control reply: expected an object')
	}
	if (typeof value.html !== 'string' || value.html.trim() === '') {
		throw new Error('Invalid custom control reply: "html" must be a non-blank string')
	}
	if (value.revision !== undefined && typeof value.revision !== 'string') {
		throw new Error('Invalid custom control reply: "revision" must be a string when present')
	}
	if (value.path !== undefined && typeof value.path !== 'string') {
		throw new Error('Invalid custom control reply: "path" must be a string when present')
	}
}

/**
 * Asks a resource for its custom control artifact over `doCommand` and validates the reply.
 *
 * @deprecated Bound to the transitional `doCommand` delivery path ({@link CUSTOM_CONTROL_COMMAND}).
 * The `CustomControlArtifact` it returns is the shape every delivery path will produce; the
 * function is replaced when the machine or registry can serve the manifest-declared file.
 */
export const loadCustomControl = async (
	client: DoCommandClient
): Promise<CustomControlArtifact> => {
	const reply = await client.doCommand({ command: CUSTOM_CONTROL_COMMAND })
	assertArtifact(reply)
	const artifact: CustomControlArtifact = { html: reply.html }
	if (reply.revision !== undefined) {
		artifact.revision = reply.revision
	}
	if (reply.path !== undefined) {
		artifact.path = reply.path
	}
	return artifact
}
