import { flushSync } from 'svelte'
import { describe, expect, it } from 'vitest'

import { createExtraParamsStore, type ExtraParamsStore } from '../extra-params-store.svelte.ts'

const createSubject = (scope: string) => {
	let store!: ExtraParamsStore
	const cleanup = $effect.root(() => {
		store = createExtraParamsStore(
			() => 'part-1',
			() => 'sensor-1',
			scope
		)
	})
	flushSync()
	return { store, cleanup }
}

describe('createExtraParamsStore', () => {
	it('starts empty with no params and no error', () => {
		const { store, cleanup } = createSubject('spec-initial')

		expect(store.text).toBe('')
		expect(store.current).toBeUndefined()
		expect(store.error).toBeUndefined()

		cleanup()
	})

	it('parses valid JSON text into current', () => {
		const { store, cleanup } = createSubject('spec-valid')

		store.text = '{"quality": 75}'
		flushSync()

		expect(store.current).toEqual({ quality: 75 })
		expect(store.error).toBeUndefined()

		cleanup()
	})

	it('keeps the last valid params and reports the error while text is invalid', () => {
		const { store, cleanup } = createSubject('spec-last-valid')

		store.text = '{"quality": 75}'
		flushSync()
		store.text = '{"quality": '
		flushSync()

		expect(store.error).toBeInstanceOf(Error)
		expect(store.current).toEqual({ quality: 75 })

		cleanup()
	})

	it('clears params when the text is emptied', () => {
		const { store, cleanup } = createSubject('spec-cleared')

		store.text = '{"quality": 75}'
		flushSync()
		store.text = ''
		flushSync()

		expect(store.current).toBeUndefined()
		expect(store.error).toBeUndefined()

		cleanup()
	})

	it('persists text so a new store for the same card restores it', () => {
		const first = createSubject('spec-persisted')
		first.store.text = '{"a": 1}'
		flushSync()
		first.cleanup()

		const second = createSubject('spec-persisted')

		expect(second.store.text).toBe('{"a": 1}')
		expect(second.store.current).toEqual({ a: 1 })

		second.cleanup()
	})
})
