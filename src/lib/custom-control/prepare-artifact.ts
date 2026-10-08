import { CUSTOM_CONTROL_CSP } from './content-security-policy.ts'

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

const insertAt = (html: string, index: number, inserted: string) =>
	html.slice(0, index) + inserted + html.slice(index)

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
