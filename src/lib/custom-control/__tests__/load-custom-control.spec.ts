import { describe, expect, it, vi } from 'vitest'

import { CUSTOM_CONTROL_COMMAND } from '../custom-control-command'
import { loadCustomControl } from '../load-custom-control'

const clientReturning = (reply: unknown) => ({
	doCommand: vi.fn().mockResolvedValue(reply as never),
})

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
