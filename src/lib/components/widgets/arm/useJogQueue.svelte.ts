export type JogQueueStatus = 'queuing' | 'sending' | 'sent' | 'failed'
export type JogDirection = 'decrease' | 'increase'

export interface JogQueueEntry {
	jointIndex: number
	/** Sum of every queued step in degrees. Negative when decreasing. */
	deltaDegrees: number
	anchor: JogDirection
	status: JogQueueStatus
}

export interface JogQueueTiming {
	/** Quiet time after the last press or repeat before the queued total is sent. */
	sendDebounceMs: number
	/** How long a button is held before it starts repeating. */
	holdRepeatDelayMs: number
	/** Time between repeats while the button stays held. */
	holdRepeatIntervalMs: number
	/** How long the sent or failed result stays visible. */
	resultDisplayMs: number
}

export const DEFAULT_JOG_QUEUE_TIMING: JogQueueTiming = {
	sendDebounceMs: 300,
	holdRepeatDelayMs: 400,
	holdRepeatIntervalMs: 150,
	resultDisplayMs: 1200,
}

interface JogQueueOptions {
	timing?: JogQueueTiming
	/** Moves one joint by `deltaDegrees`. Rejects when the move fails. */
	send: (jointIndex: number, deltaDegrees: number) => Promise<void>
}

/**
 * Collects jog presses on a single joint into one move. Presses within the
 * debounce window, and repeats while a button is held, add to the same
 * entry. The total is sent once the input goes quiet. Pressing a different
 * joint sends the pending total right away and starts a new entry.
 */
export const useJogQueue = ({ send, timing = DEFAULT_JOG_QUEUE_TIMING }: JogQueueOptions) => {
	let entry = $state.raw<JogQueueEntry | undefined>()
	let debounceTimer: ReturnType<typeof setTimeout> | undefined
	let holdDelayTimer: ReturnType<typeof setTimeout> | undefined
	let holdRepeatTimer: ReturnType<typeof setInterval> | undefined
	let resultTimer: ReturnType<typeof setTimeout> | undefined

	const clearHoldTimers = () => {
		clearTimeout(holdDelayTimer)
		clearInterval(holdRepeatTimer)
	}

	const flush = async () => {
		clearTimeout(debounceTimer)
		if (entry?.status !== 'queuing') return
		if (entry.deltaDegrees === 0) {
			entry = undefined
			return
		}

		const sending: JogQueueEntry = { ...entry, status: 'sending' }
		entry = sending

		let status: JogQueueStatus = 'sent'
		try {
			await send(sending.jointIndex, sending.deltaDegrees)
		} catch {
			status = 'failed'
		}

		// A press on another joint replaced this entry while the move was in flight.
		if (entry !== sending) return

		entry = { ...sending, status }
		resultTimer = setTimeout(() => {
			entry = undefined
		}, timing.resultDisplayMs)
	}

	const add = (jointIndex: number, stepDegrees: number) => {
		clearTimeout(debounceTimer)
		if (entry?.status === 'sending') return

		clearTimeout(resultTimer)

		const anchor: JogDirection = stepDegrees < 0 ? 'decrease' : 'increase'
		if (entry?.status === 'queuing') {
			if (entry.jointIndex === jointIndex) {
				entry = { ...entry, deltaDegrees: entry.deltaDegrees + stepDegrees, anchor }
				return
			}
			void flush()
		}
		entry = { jointIndex, deltaDegrees: stepDegrees, anchor, status: 'queuing' }
	}

	const scheduleSend = () => {
		clearTimeout(debounceTimer)
		if (entry?.status !== 'queuing') return

		debounceTimer = setTimeout(() => {
			void flush()
		}, timing.sendDebounceMs)
	}

	/** One discrete press, such as a keyboard or assistive-technology activation. */
	const tap = (jointIndex: number, stepDegrees: number) => {
		add(jointIndex, stepDegrees)
		scheduleSend()
	}

	/** A pointer press. Queues one step now and keeps adding while held. */
	const beginHold = (jointIndex: number, stepDegrees: number) => {
		clearHoldTimers()
		add(jointIndex, stepDegrees)
		holdDelayTimer = setTimeout(() => {
			holdRepeatTimer = setInterval(() => {
				add(jointIndex, stepDegrees)
			}, timing.holdRepeatIntervalMs)
		}, timing.holdRepeatDelayMs)
	}

	/** A pointer release. Stops repeating and schedules the send. */
	const endHold = () => {
		clearHoldTimers()
		scheduleSend()
	}

	const dispose = () => {
		clearHoldTimers()
		clearTimeout(debounceTimer)
		clearTimeout(resultTimer)
	}

	return {
		get entry() {
			return entry
		},
		tap,
		beginHold,
		endHold,
		dispose,
	}
}
