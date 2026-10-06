import { describe, expect, it } from 'vitest'

import { isMachineConfig, parseMachineConfigs } from '../parse-machine-configs'

const base = { host: 'h', partId: 'p', signalingAddress: 's' }

describe('isMachineConfig', () => {
	it('accepts required fields only', () => {
		expect(isMachineConfig(base)).toBe(true)
	})

	it('rejects non-objects and bad optional types', () => {
		expect(isMachineConfig(null)).toBe(false)
		expect(isMachineConfig('x')).toBe(false)
		expect(isMachineConfig({ ...base, disableSessions: 'yes' })).toBe(false)
		expect(isMachineConfig({ ...base, apiKeyId: 1 })).toBe(false)
	})
})

describe('parseMachineConfigs', () => {
	it('parses a flat config with a name', () => {
		expect(parseMachineConfigs(JSON.stringify({ ...base, name: 'a' }))).toEqual([
			{ ...base, name: 'a' },
		])
	})

	it('parses a record in key order', () => {
		const result = parseMachineConfigs(JSON.stringify({ b: base, a: base }))
		expect(result?.map((c) => c.name)).toEqual(['b', 'a'])
	})

	it('keeps optional fields', () => {
		const full = {
			...base,
			serviceHost: 'sh',
			apiKeyId: 'i',
			apiKeyValue: 'v',
			disableSessions: true,
		}
		expect(parseMachineConfigs(JSON.stringify({ m: full }))).toEqual([{ ...full, name: 'm' }])
	})

	it.each([
		['invalid json', '{nope'],
		['array', '[]'],
		['primitive', '3'],
		['missing partId', JSON.stringify({ name: 'a', host: 'h', signalingAddress: 's' })],
		['bad optional type', JSON.stringify({ name: 'a', ...base, disableSessions: 'no' })],
		['empty record', '{}'],
		['one bad entry', JSON.stringify({ a: base, b: { host: 'h' } })],
	])('returns undefined for %s', (_label, text) => {
		expect(parseMachineConfigs(text)).toBeUndefined()
	})
})
