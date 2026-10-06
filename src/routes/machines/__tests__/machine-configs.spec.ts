import { beforeEach, describe, expect, it } from 'vitest'

import { createMachineConfigs } from '../machine-configs.svelte'

const KEY = 'test-widgets:machines'
const cfg = (partId: string) => ({ host: 'h', partId, signalingAddress: 's' })
const env = { e1: cfg('e1'), e2: cfg('e2') }

const readStorage = () => JSON.parse(localStorage.getItem(KEY) ?? '{}')

describe('createMachineConfigs', () => {
	beforeEach(() => {
		localStorage.removeItem(KEY)
	})

	it('lists env machines first, then stored', () => {
		localStorage.setItem(KEY, JSON.stringify({ s1: cfg('s1') }))
		const configs = createMachineConfigs(env)
		expect(configs.current.map((c) => c.name)).toEqual(['e1', 'e2', 's1'])
	})

	it('persists added machines to localStorage', () => {
		const configs = createMachineConfigs({})
		configs.add([{ name: 'a', ...cfg('a') }])
		expect(configs.current.map((c) => c.name)).toEqual(['a'])
		expect(readStorage()).toEqual({ a: cfg('a') })
	})

	it('replaces by name', () => {
		const configs = createMachineConfigs({})
		configs.add([{ name: 'a', ...cfg('old') }])
		configs.add([{ name: 'a', ...cfg('new') }])
		expect(configs.current).toEqual([{ name: 'a', ...cfg('new') }])
	})

	it('ignores adds that match env names', () => {
		const configs = createMachineConfigs(env)
		configs.add([{ name: 'e1', ...cfg('other') }])
		expect(configs.current).toHaveLength(2)
		expect(configs.current[0]?.partId).toBe('e1')
		expect(readStorage()).toEqual({})
	})

	it('removes stored machines and ignores env names', () => {
		const configs = createMachineConfigs(env)
		configs.add([{ name: 'a', ...cfg('a') }])
		configs.remove('a')
		configs.remove('e1')
		expect(configs.current.map((c) => c.name)).toEqual(['e1', 'e2'])
		expect(readStorage()).toEqual({})
	})

	it('reports env names', () => {
		const configs = createMachineConfigs(env)
		expect(configs.isEnvConfig('e1')).toBe(true)
		expect(configs.isEnvConfig('zzz')).toBe(false)
	})

	it('filters invalid stored entries', () => {
		localStorage.setItem(KEY, JSON.stringify({ bad: { host: 1 }, good: cfg('g') }))
		const configs = createMachineConfigs({})
		expect(configs.current.map((c) => c.name)).toEqual(['good'])
	})

	it('treats a non-record stored value as empty', () => {
		localStorage.setItem(KEY, 'null')
		const configs = createMachineConfigs(env)
		expect(configs.current.map((c) => c.name)).toEqual(['e1', 'e2'])
		configs.add([{ name: 'a', ...cfg('a') }])
		expect(configs.current.map((c) => c.name)).toEqual(['e1', 'e2', 'a'])
	})
})
