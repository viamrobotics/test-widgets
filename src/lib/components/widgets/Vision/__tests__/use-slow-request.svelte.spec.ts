import { flushSync } from 'svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSlowRequest } from '../use-slow-request.svelte.ts'

describe('useSlowRequest', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('is not slow initially when not fetching', () => {
		const cleanup = $effect.root(() => {
			const result = useSlowRequest(() => false)
			flushSync()
			expect(result.isSlow).toBe(false)
		})
		cleanup()
	})

	it('is not slow before the 5s threshold elapses', () => {
		let isFetching = $state(false)
		const cleanup = $effect.root(() => {
			const result = useSlowRequest(() => isFetching)
			flushSync()

			isFetching = true
			flushSync()
			vi.advanceTimersByTime(4999)
			expect(result.isSlow).toBe(false)
		})
		cleanup()
	})

	it('becomes slow after the 5s threshold elapses while fetching', () => {
		let isFetching = $state(false)
		const cleanup = $effect.root(() => {
			const result = useSlowRequest(() => isFetching)
			flushSync()

			isFetching = true
			flushSync()
			vi.advanceTimersByTime(5000)
			expect(result.isSlow).toBe(true)
		})
		cleanup()
	})

	it('resets to not slow when fetching completes', () => {
		let isFetching = $state(false)
		const cleanup = $effect.root(() => {
			const result = useSlowRequest(() => isFetching)
			flushSync()

			isFetching = true
			flushSync()
			vi.advanceTimersByTime(5000)
			expect(result.isSlow).toBe(true)

			isFetching = false
			flushSync()
			expect(result.isSlow).toBe(false)
		})
		cleanup()
	})

	it('does not become slow if fetching completes before the threshold', () => {
		let isFetching = $state(false)
		const cleanup = $effect.root(() => {
			const result = useSlowRequest(() => isFetching)
			flushSync()

			isFetching = true
			flushSync()
			vi.advanceTimersByTime(4000)
			isFetching = false
			flushSync()
			vi.advanceTimersByTime(5000)
			expect(result.isSlow).toBe(false)
		})
		cleanup()
	})

	it('restarts the timer when a new fetch begins', () => {
		let isFetching = $state(false)
		const cleanup = $effect.root(() => {
			const result = useSlowRequest(() => isFetching)
			flushSync()

			isFetching = true
			flushSync()
			vi.advanceTimersByTime(5000)
			expect(result.isSlow).toBe(true)

			isFetching = false
			flushSync()
			expect(result.isSlow).toBe(false)

			isFetching = true
			flushSync()
			vi.advanceTimersByTime(4999)
			expect(result.isSlow).toBe(false)
			vi.advanceTimersByTime(1)
			expect(result.isSlow).toBe(true)
		})
		cleanup()
	})
})
