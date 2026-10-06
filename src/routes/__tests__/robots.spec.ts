import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadRobots } from '../robots'

describe('loadRobots', () => {
	afterEach(() => {
		vi.unstubAllEnvs()
	})

	it.each([undefined, ''])('returns {} for %j', (value) => {
		vi.stubEnv('VITE_PLAYGROUND_ROBOTS', value)
		expect(loadRobots()).toEqual({})
	})

	it('returns the record for valid JSON', () => {
		const robot = { host: 'h', partId: 'p', signalingAddress: 's' }
		vi.stubEnv('VITE_PLAYGROUND_ROBOTS', JSON.stringify({ a: robot }))
		expect(loadRobots()).toEqual({ a: robot })
	})

	it('throws naming the env var for malformed input', () => {
		vi.stubEnv('VITE_PLAYGROUND_ROBOTS', '{nope')
		expect(() => loadRobots()).toThrow(/VITE_PLAYGROUND_ROBOTS/u)
	})
})
