import { describe, expect, it, vi } from 'vitest'

import {
	CUSTOM_CONTROL_COMMAND,
	CUSTOM_CONTROL_CSP,
	loadCustomControl,
	prepareArtifact,
} from '../custom-control'

const META = `<meta http-equiv="Content-Security-Policy" content="${CUSTOM_CONTROL_CSP}">`

const clientReturning = (reply: unknown) => ({
	doCommand: vi.fn().mockResolvedValue(reply as never),
})

const countOccurrences = (text: string, search: string) => text.split(search).length - 1

// The implementation never parses, so the hostile cases ask the browser's own parser where the meta
// landed. A meta that is not the head's first element would be inert text or a late, ineffective tag.
const parseFirstHeadElement = (html: string) =>
	new DOMParser().parseFromString(html, 'text/html').head.firstElementChild

const ARTIFACTS = {
	'a head': '<!doctype html><html><head><title>t</title></head><body><p>x</p></body></html>',
	'an uppercase head with attributes':
		'<HTML><HEAD lang="en"><title>t</title></HEAD><BODY></BODY></HTML>',
	'no head': '<!doctype html><html lang="en"><body><p>x</p></body></html>',
	'a bare fragment': '<p>x</p>',
}

describe('loadCustomControl', () => {
	it('sends the command once and returns html and revision', async () => {
		const client = clientReturning({ html: '<p>hi</p>', revision: 'r1' })
		await expect(loadCustomControl(client)).resolves.toEqual({
			html: '<p>hi</p>',
			revision: 'r1',
		})
		expect(client.doCommand).toHaveBeenCalledTimes(1)
		expect(client.doCommand).toHaveBeenCalledWith({
			command: CUSTOM_CONTROL_COMMAND,
		})
	})

	it('returns only html when revision is absent', async () => {
		const result = await loadCustomControl(clientReturning({ html: '<p/>' }))
		expect(result).toEqual({ html: '<p/>' })
		expect('revision' in result).toBe(false)
	})

	const badHtml = [
		{ description: 'missing', reply: {} },
		{ description: 'null', reply: { html: null } },
		{ description: 'empty', reply: { html: '' } },
		{ description: 'whitespace-only', reply: { html: ' \n\t' } },
	]
	for (const { description, reply } of badHtml) {
		it(`throws naming html when html is ${description}`, async () => {
			await expect(loadCustomControl(clientReturning(reply))).rejects.toThrow(/html/)
		})
	}

	it('throws naming revision when revision is not a string', async () => {
		await expect(loadCustomControl(clientReturning({ html: '<p/>', revision: 3 }))).rejects.toThrow(
			/revision/
		)
	})

	it('passes path through when present', async () => {
		const result = await loadCustomControl(clientReturning({ html: '<p/>', path: 'ui/index.html' }))
		expect(result).toEqual({ html: '<p/>', path: 'ui/index.html' })
	})

	it('throws naming path when path is not a string', async () => {
		await expect(loadCustomControl(clientReturning({ html: '<p/>', path: 3 }))).rejects.toThrow(
			/path/
		)
	})

	it('rethrows the original error when doCommand rejects', async () => {
		const error = new Error('boom')
		const client = { doCommand: vi.fn().mockRejectedValue(error) }
		await expect(loadCustomControl(client)).rejects.toBe(error)
	})
})

describe('prepareArtifact', () => {
	it('makes the meta the first child of an existing head', () => {
		const html = ARTIFACTS['a head']

		expect(prepareArtifact(html)).toBe(html.replace('<head>', `<head>${META}`))
	})

	it('matches the head case-insensitively and keeps its attributes', () => {
		const html = ARTIFACTS['an uppercase head with attributes']

		expect(prepareArtifact(html)).toBe(html.replace('<HEAD lang="en">', `<HEAD lang="en">${META}`))
	})

	it('creates a head right after the opening html tag when there is none', () => {
		const html = ARTIFACTS['no head']

		expect(prepareArtifact(html)).toBe(
			html.replace('<html lang="en">', `<html lang="en"><head>${META}</head>`)
		)
	})

	it('prefixes a bare fragment with a head holding the meta', () => {
		expect(prepareArtifact(ARTIFACTS['a bare fragment'])).toBe(`<head>${META}</head><p>x</p>`)
	})

	it('does not take a header element for a head', () => {
		expect(prepareArtifact('<header>h</header>')).toBe(`<head>${META}</head><header>h</header>`)
	})

	it('puts a created head after the doctype and leading comments, keeping standards mode', () => {
		const out = prepareArtifact('<!-- built --><!doctype html><p>x</p>')

		expect(out).toBe(`<!-- built --><!doctype html><head>${META}</head><p>x</p>`)
		expect(new DOMParser().parseFromString(out, 'text/html').compatMode).toBe('CSS1Compat')
	})

	it.each(Object.entries(ARTIFACTS))('contains the policy exactly once for %s', (_name, html) => {
		expect(countOccurrences(prepareArtifact(html), CUSTOM_CONTROL_CSP)).toBe(1)
	})

	it.each(Object.entries(ARTIFACTS))('is idempotent for %s', (_name, html) => {
		const once = prepareArtifact(html)

		expect(prepareArtifact(once)).toBe(once)
	})

	it.each(Object.entries(ARTIFACTS))(
		'has the browser parse the meta as the first head element for %s',
		(_name, html) => {
			const first = parseFirstHeadElement(prepareArtifact(html))

			expect(first?.getAttribute('http-equiv')).toBe('Content-Security-Policy')
			expect(first?.getAttribute('content')).toBe(CUSTOM_CONTROL_CSP)
		}
	)

	// The artifact's author is the adversary here: each input hides a head tag, or the meta itself,
	// where a naive search would inject (or skip injecting) a meta the browser never applies.
	describe('when the artifact tries to hide the injection point', () => {
		const HOSTILE = {
			'a head inside a comment': '<!-- <head> --><p>x</p>',
			'a head inside a script string': `<script>const s = '<head>'</script><p>x</p>`,
			'a head inside an attribute value': '<p title="<head>">x</p>',
			'a head whose attribute value contains a closing bracket':
				'<head a=">"><title>t</title></head>',
			'a head tag with a non-breaking space for whitespace':
				'<head lang="en"><title>t</title></head>',
			'a head after a comment that closes early': '<!--> <head> --><p>x</p>',
			'the exact meta inside a comment': `<!-- ${META} --><p>x</p>`,
			'the exact meta inside a script': `<script>const s = '${META}'</script><p>x</p>`,
		}

		it.each(Object.entries(HOSTILE))(
			'still injects a meta the browser applies for %s',
			(_name, html) => {
				const first = parseFirstHeadElement(prepareArtifact(html))

				expect(first?.getAttribute('http-equiv')).toBe('Content-Security-Policy')
				expect(first?.getAttribute('content')).toBe(CUSTOM_CONTROL_CSP)
			}
		)
	})
})
