import type { JsonValue } from '@viamrobotics/sdk'

/**
 * The `doCommand` that asks a resource for its custom control artifact.
 *
 * @deprecated Transitional delivery path. A module declares its control per model in
 * `meta.json` (`models[].custom_control`); serving the bytes over `doCommand` exists only until the
 * machine or registry can serve the declared file. Do not build new integrations on it. Module
 * authors keep their manifests and drop the handler when delivery moves.
 */
export const CUSTOM_CONTROL_COMMAND = 'get-custom-control'

// The policy the host injects into every custom control artifact before rendering it.
export const CUSTOM_CONTROL_CSP = [
	"default-src 'none'",
	"script-src 'unsafe-inline'",
	"style-src 'unsafe-inline'",
	'img-src data: blob:',
	'media-src blob:',
	'font-src data:',
	"connect-src 'none'",
	"base-uri 'none'",
	"form-action 'none'",
].join('; ')

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CUSTOM_CONTROL_CSP}">`

// The artifact is untrusted, so the injection point has to be where the browser's parser sees a
// real tag. A DOM parser is off the table (it would have to serialize the artifact back), so this
// is a regex anchored at the start of the document that matches only tags written plainly enough
// that the browser cannot read them differently:
// - Only whitespace, comments, and a doctype may precede the tags. An unanchored `<head>` could sit
//   inside a comment, script, or attribute value, where the meta would be inert text.
// - A comment must end at its first `-->` and may not use the early endings (`<!-->`, `--!>`) the
//   browser also honors, since a tag after an early ending is real to the browser and not to us.
// - Whitespace is the five HTML characters, not JS `\s`, which also matches U+00A0 and friends.
// - A quoted attribute value may not contain `<` or `>`, so the first `>` always ends the tag.
// Anything stranger fails the match, and the meta then goes in a fresh head at the start.
const SPACE = String.raw`[\t\n\f\r ]`
const COMMENT = String.raw`<!--(?!-?>)(?:(?!--!?>)[\s\S])*-->`
const SKIPPED = String.raw`(?:${SPACE}|${COMMENT})*`
const VALUE = String.raw`"[^"<>]*"|'[^'<>]*'|[^\t\n\f\r "'<>=\x60]+`
const ATTRIBUTE = String.raw`${SPACE}+[^\t\n\f\r "'<>/=]+(?:${SPACE}*=${SPACE}*(?:${VALUE}))?`
const openingTag = (name: string) => String.raw`<${name}(?:${ATTRIBUTE})*${SPACE}*>`

const DOCUMENT_START = new RegExp(
	String.raw`^(${SKIPPED}(?:<!doctype[^>]*>${SKIPPED})?)(${openingTag('html')})?(${SKIPPED})(${openingTag('head')})?`,
	'i'
)

export interface CustomControlArtifact {
	html: string
	revision?: string
	/** The `custom_control` path the module declared for this model in its `meta.json`, when reported. */
	path?: string
}

interface DoCommandClient {
	doCommand(command: Record<string, JsonValue>): Promise<JsonValue>
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
	if (reply.revision !== undefined) artifact.revision = reply.revision
	if (reply.path !== undefined) artifact.path = reply.path
	return artifact
}

/**
 * Returns the artifact with the host's Content Security Policy injected as the first child of
 * `<head>`, creating the head when the artifact has none, so the policy applies before any other
 * element parses. An artifact whose head already opens with this exact meta is returned unchanged.
 */
export const prepareArtifact = (html: string): string => {
	const [, beforeTags = '', htmlTag = '', between = '', headTag = ''] =
		DOCUMENT_START.exec(html) ?? []

	if (headTag) {
		const headEnd = beforeTags.length + htmlTag.length + between.length + headTag.length
		return html.startsWith(CSP_META, headEnd) ? html : insertAt(html, headEnd, CSP_META)
	}

	return insertAt(html, beforeTags.length + htmlTag.length, `<head>${CSP_META}</head>`)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

const assertArtifact: (value: unknown) => asserts value is CustomControlArtifact = (value) => {
	if (!isRecord(value)) throw new Error('Invalid custom control reply: expected an object')
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

const insertAt = (html: string, index: number, inserted: string) =>
	html.slice(0, index) + inserted + html.slice(index)
