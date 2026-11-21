import { describe, expect, it, vi } from 'vitest'

import { createInFlightGuard, type InFlightGuard } from '../in-flight-guard.svelte'

interface Deferred {
	promise: Promise<void>
	resolve: () => void
	reject: (reason: unknown) => void
}

const deferred = (): Deferred => {
	let resolve = () => {}
	let reject: (reason: unknown) => void = () => {}
	const promise = new Promise<void>((onResolve, onReject) => {
		resolve = () => onResolve()
		reject = onReject
	})
	return { promise, resolve, reject }
}

const startHeldCall = (guard: InFlightGuard) => {
	const call = deferred()
	const outcome = guard.run(() => call.promise)
	return { call, outcome }
}

describe('createInFlightGuard', () => {
	it('is idle before any call', () => {
		const guard = createInFlightGuard()

		expect(guard.isBusy, 'a fresh guard holds nothing').toBe(false)
	})

	it('is busy while a call is in flight', () => {
		const guard = createInFlightGuard()

		startHeldCall(guard)

		expect(guard.isBusy, 'the call has not settled').toBe(true)
	})

	it('is idle again after the call succeeds, and reports succeeded', async () => {
		const guard = createInFlightGuard()
		const { call, outcome } = startHeldCall(guard)

		call.resolve()

		await expect(outcome).resolves.toBe('succeeded')
		expect(guard.isBusy, 'the call settled').toBe(false)
	})

	it('drops a run made while busy: returns undefined and never calls its mutation', async () => {
		const guard = createInFlightGuard()
		const { call, outcome } = startHeldCall(guard)
		const dropped = vi.fn(() => Promise.resolve())

		const result = guard.run(dropped)

		expect(result).toBeUndefined()
		call.resolve()
		await outcome
		expect(
			dropped,
			'a dropped run must not fire after the first call settles'
		).not.toHaveBeenCalled()
	})

	it('releases the group and reports failed when the mutation rejects', async () => {
		const guard = createInFlightGuard()
		const { call, outcome } = startHeldCall(guard)

		call.reject(new Error('move failed'))

		await expect(outcome).resolves.toBe('failed')
		expect(guard.isBusy, 'a rejected call must release the group').toBe(false)
	})

	it('releases the group and reports failed when the mutation throws synchronously', async () => {
		const guard = createInFlightGuard()

		const outcome = guard.run(() => {
			throw new Error('bad arguments')
		})

		await expect(outcome).resolves.toBe('failed')
		expect(guard.isBusy, 'a throwing call must release the group').toBe(false)
	})

	it('runs the next call once the group is released', async () => {
		const guard = createInFlightGuard()
		const { call, outcome } = startHeldCall(guard)
		call.resolve()
		await outcome
		const next = vi.fn(() => Promise.resolve())

		const result = guard.run(next)

		await expect(result).resolves.toBe('succeeded')
		expect(next).toHaveBeenCalledTimes(1)
	})

	it('does not block a second guard while the first is busy', async () => {
		const first = createInFlightGuard()
		const second = createInFlightGuard()
		startHeldCall(first)
		const other = vi.fn(() => Promise.resolve())

		const result = second.run(other)

		expect(second.isBusy, 'the second group took its own call').toBe(true)
		await expect(result).resolves.toBe('succeeded')
		expect(other).toHaveBeenCalledTimes(1)
	})
})
