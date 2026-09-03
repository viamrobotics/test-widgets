import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_JOG_QUEUE_TIMING, useJogQueue } from '../useJogQueue.svelte'

const timing = DEFAULT_JOG_QUEUE_TIMING

describe('createJogQueue', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	const createSubject = (send = vi.fn().mockResolvedValue(undefined)) => ({
		send,
		queue: useJogQueue({ send }),
	})

	it('queues one step on tap and sends it after the debounce', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5)

		expect(queue.entry).toEqual({
			jointIndex: 0,
			deltaDegrees: 5,
			anchor: 'increase',
			status: 'queuing',
		})
		vi.advanceTimersByTime(timing.sendDebounceMs - 1)
		expect(send).not.toHaveBeenCalled()

		vi.advanceTimersByTime(1)
		expect(send).toHaveBeenCalledWith(0, 5)
	})

	it('adds taps within the debounce window into one send', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5)
		vi.advanceTimersByTime(timing.sendDebounceMs - 1)
		queue.tap(0, 5)
		vi.advanceTimersByTime(timing.sendDebounceMs - 1)
		queue.tap(0, -1)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).toHaveBeenCalledTimes(1)
		expect(send).toHaveBeenCalledWith(0, 9)
	})

	it('anchors to the most recent direction', () => {
		const { queue } = createSubject()

		queue.tap(0, 5)
		queue.tap(0, -5)

		expect(queue.entry?.anchor).toBe('decrease')
	})

	it('keeps adding while held and sends once after release', () => {
		const { send, queue } = createSubject()

		queue.beginHold(0, 5)
		expect(queue.entry?.deltaDegrees).toBe(5)

		vi.advanceTimersByTime(timing.holdRepeatDelayMs - 1)
		expect(queue.entry?.deltaDegrees).toBe(5)

		vi.advanceTimersByTime(1 + timing.holdRepeatIntervalMs * 2)
		expect(queue.entry?.deltaDegrees).toBe(15)
		expect(send).not.toHaveBeenCalled()

		queue.endHold()
		vi.advanceTimersByTime(timing.holdRepeatIntervalMs)
		expect(queue.entry?.deltaDegrees).toBe(15)

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(send).toHaveBeenCalledTimes(1)
		expect(send).toHaveBeenCalledWith(0, 15)
	})

	it('sends the pending joint right away when a different joint is pressed', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5)
		queue.tap(1, -5)

		expect(send).toHaveBeenCalledTimes(1)
		expect(send).toHaveBeenCalledWith(0, 5)
		expect(queue.entry).toMatchObject({ jointIndex: 1, deltaDegrees: -5, status: 'queuing' })

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(send).toHaveBeenCalledWith(1, -5)
	})

	it('marks the entry sent when the move resolves, then clears it', async () => {
		const { queue } = createSubject()

		queue.tap(0, 5)
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)

		expect(queue.entry?.status).toBe('sent')

		vi.advanceTimersByTime(timing.resultDisplayMs)
		expect(queue.entry).toBeUndefined()
	})

	it('marks the entry failed when the move rejects', async () => {
		const { queue } = createSubject(vi.fn().mockRejectedValue(new Error('arm offline')))

		queue.tap(0, 5)
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)

		expect(queue.entry?.status).toBe('failed')
	})

	it('reports sending while the move is in flight and ignores presses meanwhile', async () => {
		let resolveMove = () => {}
		const send = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveMove = resolve
				})
		)
		const { queue } = createSubject(send)

		queue.tap(0, 5)
		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(queue.entry?.status).toBe('sending')

		queue.tap(0, 5)
		expect(queue.entry).toMatchObject({ deltaDegrees: 5, status: 'sending' })

		resolveMove()
		await vi.advanceTimersByTimeAsync(0)
		expect(queue.entry?.status).toBe('sent')
	})

	it('does not let a superseded send overwrite the next entry', async () => {
		let resolveMove = () => {}
		const send = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveMove = resolve
				})
		)
		const { queue } = createSubject(send)

		queue.tap(0, 5)
		queue.tap(1, 5)
		resolveMove()
		await vi.advanceTimersByTimeAsync(0)

		expect(queue.entry).toMatchObject({ jointIndex: 1, status: 'queuing' })
	})

	it('drops a queue that nets to zero without sending', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5)
		queue.tap(0, -5)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).not.toHaveBeenCalled()
		expect(queue.entry).toBeUndefined()
	})

	it('dispose cancels the pending send', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5)
		queue.dispose()
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).not.toHaveBeenCalled()
	})
})
