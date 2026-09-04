export type JogQueueStatus = 'queuing' | 'sending' | 'sent' | 'failed'

export interface JogQueueEntry {
	jointIndex: number
	/** Where the joint was when the entry started, in degrees. */
	startDegrees: number
	/** Sum of every queued step in degrees. Negative when decreasing. */
	deltaDegrees: number
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
	/**
	 * Moves every joint in `targetsByJoint` to its target, in degrees. The map
	 * holds the joint being sent plus any joint whose earlier move is still in
	 * flight or just finished, so a new move never drags those joints back to a
	 * stale polled position. Rejects when the move fails.
	 */
	send: (targetsByJoint: ReadonlyMap<number, number>) => Promise<void>
}

/** The position the entry moves its joint to, in degrees. */
export const jogTargetDegrees = (entry: JogQueueEntry) => entry.startDegrees + entry.deltaDegrees

/**
 * Collects jog presses into one move per joint. Presses within the debounce
 * window, and repeats while a button is held, add to that joint's entry. The
 * total is sent once the joint's input goes quiet. Each joint has its own
 * entry and timers, so jogging a second joint leaves the first joint's badge
 * to run through sending, its result, and clearing on its own.
 */
export const useJogQueue = ({ send, timing = DEFAULT_JOG_QUEUE_TIMING }: JogQueueOptions) => {
	// $state.raw: the map is replaced wholesale on every change so readers re-run without deep proxies.
	let entries = $state.raw<ReadonlyMap<number, JogQueueEntry>>(new Map())
	const debounceTimers = new Map<number, ReturnType<typeof setTimeout>>()
	const resultTimers = new Map<number, ReturnType<typeof setTimeout>>()
	let holdDelayTimer: ReturnType<typeof setTimeout> | undefined
	let holdRepeatTimer: ReturnType<typeof setInterval> | undefined
	let heldJointIndex: number | undefined

	const setEntry = (jointIndex: number, entry: JogQueueEntry | undefined) => {
		const next = new Map(entries)
		if (entry) {
			next.set(jointIndex, entry)
		} else {
			next.delete(jointIndex)
		}
		entries = next
	}

	const clearHoldTimers = () => {
		clearTimeout(holdDelayTimer)
		clearInterval(holdRepeatTimer)
	}

	const committedTargets = () => {
		const targets = new Map<number, number>()
		for (const entry of entries.values()) {
			if (entry.status === 'sending' || entry.status === 'sent') {
				targets.set(entry.jointIndex, jogTargetDegrees(entry))
			}
		}
		return targets
	}

	const flush = async (jointIndex: number) => {
		clearTimeout(debounceTimers.get(jointIndex))
		const entry = entries.get(jointIndex)
		if (entry?.status !== 'queuing') return
		if (entry.deltaDegrees === 0) {
			setEntry(jointIndex, undefined)
			return
		}

		const sending: JogQueueEntry = { ...entry, status: 'sending' }
		setEntry(jointIndex, sending)

		let status: JogQueueStatus = 'sent'
		try {
			await send(committedTargets())
		} catch {
			status = 'failed'
		}

		setEntry(jointIndex, { ...sending, status })
		resultTimers.set(
			jointIndex,
			setTimeout(() => {
				setEntry(jointIndex, undefined)
			}, timing.resultDisplayMs)
		)
	}

	const add = (jointIndex: number, stepDegrees: number, startDegrees: number) => {
		clearTimeout(debounceTimers.get(jointIndex))
		const current = entries.get(jointIndex)
		if (current?.status === 'sending') return

		clearTimeout(resultTimers.get(jointIndex))
		if (current?.status === 'queuing') {
			setEntry(jointIndex, { ...current, deltaDegrees: current.deltaDegrees + stepDegrees })
			return
		}
		setEntry(jointIndex, { jointIndex, startDegrees, deltaDegrees: stepDegrees, status: 'queuing' })
	}

	const scheduleSend = (jointIndex: number) => {
		clearTimeout(debounceTimers.get(jointIndex))
		if (entries.get(jointIndex)?.status !== 'queuing') return

		debounceTimers.set(
			jointIndex,
			setTimeout(() => {
				void flush(jointIndex)
			}, timing.sendDebounceMs)
		)
	}

	/**
	 * One discrete press, such as a keyboard or assistive-technology activation.
	 * `startDegrees` is the joint's current position and is only used when the
	 * press starts a new entry.
	 */
	const tap = (jointIndex: number, stepDegrees: number, startDegrees: number) => {
		add(jointIndex, stepDegrees, startDegrees)
		scheduleSend(jointIndex)
	}

	/** A pointer press. Queues one step now and keeps adding while held. */
	const beginHold = (jointIndex: number, stepDegrees: number, startDegrees: number) => {
		clearHoldTimers()
		heldJointIndex = jointIndex
		add(jointIndex, stepDegrees, startDegrees)
		holdDelayTimer = setTimeout(() => {
			holdRepeatTimer = setInterval(() => {
				add(jointIndex, stepDegrees, startDegrees)
			}, timing.holdRepeatIntervalMs)
		}, timing.holdRepeatDelayMs)
	}

	/** A pointer release. Stops repeating and schedules the held joint's send. */
	const endHold = () => {
		clearHoldTimers()
		if (heldJointIndex === undefined) return

		scheduleSend(heldJointIndex)
		heldJointIndex = undefined
	}

	const dispose = () => {
		clearHoldTimers()
		for (const timer of debounceTimers.values()) clearTimeout(timer)
		for (const timer of resultTimers.values()) clearTimeout(timer)
	}

	return {
		entryFor: (jointIndex: number) => entries.get(jointIndex),
		tap,
		beginHold,
		endHold,
		dispose,
	}
}
