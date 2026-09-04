import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_JOG_QUEUE_TIMING, useJogQueue } from '../useJogQueue.svelte'

const timing = DEFAULT_JOG_QUEUE_TIMING

describe('useJogQueue', () => {
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

	const pendingSend = () => {
		const resolvers: (() => void)[] = []
		const send = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolvers.push(resolve)
				})
		)
		const resolveMoves = () => {
			for (const resolve of resolvers) resolve()
		}
		return { send, resolveMoves }
	}

	it('queues one step on tap and sends the target after the debounce', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5, 30)

		expect(queue.entryFor(0)).toEqual({
			jointIndex: 0,
			startDegrees: 30,
			deltaDegrees: 5,
			status: 'queuing',
		})
		vi.advanceTimersByTime(timing.sendDebounceMs - 1)
		expect(send).not.toHaveBeenCalled()

		vi.advanceTimersByTime(1)
		expect(send).toHaveBeenCalledWith(new Map([[0, 35]]))
	})

	it('adds taps within the debounce window into one send from the starting position', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5, 30)
		vi.advanceTimersByTime(timing.sendDebounceMs - 1)
		queue.tap(0, 5, 30)
		vi.advanceTimersByTime(timing.sendDebounceMs - 1)
		queue.tap(0, -1, 30)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).toHaveBeenCalledTimes(1)
		expect(send).toHaveBeenCalledWith(new Map([[0, 39]]))
	})

	it('keeps adding while held and sends once after release', () => {
		const { send, queue } = createSubject()

		queue.beginHold(0, 5, 30)
		expect(queue.entryFor(0)?.deltaDegrees).toBe(5)

		vi.advanceTimersByTime(timing.holdRepeatDelayMs - 1)
		expect(queue.entryFor(0)?.deltaDegrees).toBe(5)

		vi.advanceTimersByTime(1 + timing.holdRepeatIntervalMs * 2)
		expect(queue.entryFor(0)?.deltaDegrees).toBe(15)
		expect(send).not.toHaveBeenCalled()

		queue.endHold()
		vi.advanceTimersByTime(timing.holdRepeatIntervalMs)
		expect(queue.entryFor(0)?.deltaDegrees).toBe(15)

		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(send).toHaveBeenCalledTimes(1)
		expect(send).toHaveBeenCalledWith(new Map([[0, 45]]))
	})

	it('keeps each joint on its own entry and debounce', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5, 10)
		vi.advanceTimersByTime(100)
		queue.tap(1, -5, 20)

		expect(queue.entryFor(0)).toMatchObject({ deltaDegrees: 5, status: 'queuing' })
		expect(queue.entryFor(1)).toMatchObject({ deltaDegrees: -5, status: 'queuing' })
		expect(send).not.toHaveBeenCalled()

		vi.advanceTimersByTime(timing.sendDebounceMs - 100)
		expect(send).toHaveBeenCalledTimes(1)
		expect(send).toHaveBeenLastCalledWith(new Map([[0, 15]]))

		vi.advanceTimersByTime(100)
		expect(send).toHaveBeenCalledTimes(2)
	})

	it('folds a joint still moving into the next send so it is not dragged back', async () => {
		const { send, resolveMoves } = pendingSend()
		const { queue } = createSubject(send)

		queue.tap(0, 5, 10)
		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(queue.entryFor(0)?.status).toBe('sending')

		queue.tap(1, 5, 20)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).toHaveBeenLastCalledWith(
			new Map([
				[0, 15],
				[1, 25],
			])
		)

		resolveMoves()
		await vi.advanceTimersByTimeAsync(0)
		expect(queue.entryFor(0)?.status).toBe('sent')
		expect(queue.entryFor(1)?.status).toBe('sent')
	})

	it('lets a sent joint finish its result display while another joint is jogged', async () => {
		const { queue } = createSubject()

		queue.tap(0, 5, 10)
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)
		expect(queue.entryFor(0)?.status).toBe('sent')

		queue.tap(1, 5, 20)
		expect(queue.entryFor(0)?.status).toBe('sent')

		vi.advanceTimersByTime(timing.resultDisplayMs)
		expect(queue.entryFor(0)).toBeUndefined()
		expect(queue.entryFor(1)).toBeDefined()
	})

	it('marks the entry failed when the move rejects', async () => {
		const { queue } = createSubject(vi.fn().mockRejectedValue(new Error('arm offline')))

		queue.tap(0, 5, 0)
		await vi.advanceTimersByTimeAsync(timing.sendDebounceMs)

		expect(queue.entryFor(0)?.status).toBe('failed')
	})

	it('ignores presses on a joint while its move is in flight', () => {
		const { send } = pendingSend()
		const { queue } = createSubject(send)

		queue.tap(0, 5, 0)
		vi.advanceTimersByTime(timing.sendDebounceMs)
		expect(queue.entryFor(0)?.status).toBe('sending')

		queue.tap(0, 5, 0)
		expect(queue.entryFor(0)).toMatchObject({ deltaDegrees: 5, status: 'sending' })
	})

	it('drops a queue that nets to zero without sending', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5, 0)
		queue.tap(0, -5, 0)
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).not.toHaveBeenCalled()
		expect(queue.entryFor(0)).toBeUndefined()
	})

	it('dispose cancels the pending sends', () => {
		const { send, queue } = createSubject()

		queue.tap(0, 5, 0)
		queue.tap(1, 5, 0)
		queue.dispose()
		vi.advanceTimersByTime(timing.sendDebounceMs)

		expect(send).not.toHaveBeenCalled()
	})
})
