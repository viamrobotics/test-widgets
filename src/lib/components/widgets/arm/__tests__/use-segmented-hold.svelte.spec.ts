import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'

import {
	type LookaheadDriver,
	type RunWhileHeldDriver,
	type SteppingDriver,
	useSegmentedHold,
} from '../use-segmented-hold.svelte'

const HOLD_DELAY_MS = 400
const MICROTASK_ROUNDS = 20
const ONE_SEGMENT_PER_EXECUTE = 1
const TWO_SEGMENTS_PER_EXECUTE = 2

interface Deferred<TValue> {
	promise: Promise<TValue>
	resolve: (value: TValue) => void
	reject: (reason: unknown) => void
}

const deferred = <TValue>(): Deferred<TValue> => {
	let resolve: (value: TValue) => void = () => {}
	let reject: (reason: unknown) => void = () => {}
	const promise = new Promise<TValue>((onResolve, onReject) => {
		resolve = onResolve
		reject = onReject
	})
	return { promise, resolve, reject }
}

const flush = async () => {
	for (let round = 0; round < MICROTASK_ROUNDS; round += 1) {
		await Promise.resolve()
	}
}

interface RecordedCall<TValue> {
	signal: AbortSignal
	result: Deferred<TValue>
}

interface Plan {
	stepNumber: number
	segments?: readonly Plan[]
}

const joinTestPlans = (segments: readonly Plan[]): Plan => {
	if (segments.length === 1) {
		return segments[0]
	}
	return { stepNumber: segments[0].stepNumber, segments }
}

const createSteppingDriver = () => {
	const steps: (RecordedCall<void> & { stepNumber: number })[] = []
	const driver: SteppingDriver = {
		kind: 'stepping',
		moveStep: (stepNumber, signal) => {
			const result = deferred<void>()
			steps.push({ stepNumber, signal, result })
			return result.promise
		},
	}
	return { driver, steps }
}

const createLookaheadDriver = () => {
	const plans: (RecordedCall<Plan> & { stepNumber: number; previous: Plan | undefined })[] = []
	const executions: (RecordedCall<void> & { plan: Plan })[] = []
	const state = { isCurrent: true }
	const driver: LookaheadDriver<Plan> = {
		kind: 'lookahead',
		planStep: (stepNumber, previous, signal) => {
			const result = deferred<Plan>()
			plans.push({ stepNumber, previous, signal, result })
			return result.promise
		},
		joinPlans: joinTestPlans,
		executePlan: (plan, signal) => {
			const result = deferred<void>()
			executions.push({ plan, signal, result })
			return result.promise
		},
		isPlanCurrent: () => state.isCurrent,
	}
	return { driver, plans, executions, state }
}

const createRunWhileHeldDriver = () => {
	const runs: RecordedCall<void>[] = []
	const driver: RunWhileHeldDriver = {
		kind: 'run-while-held',
		run: (signal) => {
			const result = deferred<void>()
			runs.push({ signal, result })
			return result.promise
		},
	}
	return { driver, runs }
}

const setup = (segmentsPerExecute: number) => {
	const guard = createInFlightGuard()
	const stop = vi.fn(() => Promise.resolve())
	const hold = useSegmentedHold({ guard, stop, holdDelayMs: HOLD_DELAY_MS, segmentsPerExecute })
	return { guard, stop, hold }
}

const startTwoSegmentHold = async () => {
	const subject = setup(TWO_SEGMENTS_PER_EXECUTE)
	const lookahead = createLookaheadDriver()
	subject.hold.press(lookahead.driver)
	const first = { stepNumber: 1 }
	const second = { stepNumber: 2 }
	lookahead.plans[0].result.resolve(first)
	await flush()
	lookahead.plans[1].result.resolve(second)
	await flush()
	return { ...subject, ...lookahead, first, second }
}

describe('useSegmentedHold', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('release mid-segment after the hold delay calls stop once, even while a segment is in flight', async () => {
		const { stop, hold, guard } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()

		hold.press(driver)
		vi.advanceTimersByTime(HOLD_DELAY_MS)
		hold.release()
		hold.release()

		expect(steps[0].signal.aborted, 'the segment in flight is aborted').toBe(true)
		expect(stop).toHaveBeenCalledTimes(1)
		expect(guard.isBusy, 'the group stays busy until the aborted call settles').toBe(true)

		steps[0].result.reject(new Error('stopped before reaching target'))
		await flush()

		expect(stop, 'settling the aborted call sends no second stop').toHaveBeenCalledTimes(1)
		expect(steps, 'nothing goes out after the release').toHaveLength(1)
		expect(hold.phase).toBe('idle')
		expect(guard.isBusy).toBe(false)
	})

	it('release after the delay drops the queued plan and calls stop once during a lookahead segment', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, plans, executions } = createLookaheadDriver()

		hold.press(driver)
		plans[0].result.resolve({ stepNumber: 1 })
		await flush()
		plans[1].result.resolve({ stepNumber: 2 })
		await flush()
		expect(hold.phase).toBe('moving-next-planned')

		vi.advanceTimersByTime(HOLD_DELAY_MS)
		hold.release()

		expect(hold.phase, 'the queued plan is dropped').toBe('moving')
		expect(executions[0].signal.aborted).toBe(true)
		expect(stop).toHaveBeenCalledTimes(1)

		executions[0].result.reject(new Error('stopped before reaching target'))
		await flush()

		expect(executions, 'the queued plan never goes out').toHaveLength(1)
		expect(hold.failure).toBeUndefined()
		expect(hold.phase).toBe('idle')
	})

	it('a click completes one step and calls no stop', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()

		hold.press(driver)
		hold.release()

		expect(steps[0].signal.aborted, 'a click lets the step finish').toBe(false)
		steps[0].result.resolve()
		await flush()

		expect(steps).toHaveLength(1)
		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})

	it('steps again only after the previous step resolves while held', async () => {
		const { hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()

		hold.press(driver)
		await flush()
		expect(steps, 'step 2 waits for step 1').toHaveLength(1)

		steps[0].result.resolve()
		await flush()

		expect(steps.map((step) => step.stepNumber)).toEqual([1, 2])
		expect(hold.phase).toBe('moving')
	})

	it('a release between segments, with only the next plan pending, ends the loop with no stop call', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, plans, executions } = createLookaheadDriver()
		hold.press(driver)
		plans[0].result.resolve({ stepNumber: 1 })
		await flush()
		executions[0].result.resolve()
		await flush()
		vi.advanceTimersByTime(HOLD_DELAY_MS)

		hold.release()

		expect(plans[1].signal.aborted, 'the pending plan is abandoned').toBe(true)
		plans[1].result.reject(new Error('aborted'))
		await flush()
		expect(stop, 'the arm is already at rest').not.toHaveBeenCalled()
		expect(executions).toHaveLength(1)
		expect(hold.failure).toBeUndefined()
		expect(hold.phase).toBe('idle')
	})

	it('a press while the guard is busy sends nothing then or later', async () => {
		const { guard, stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const other = deferred<void>()
		const otherOutcome = guard.run(() => other.promise)
		const { driver, steps } = createSteppingDriver()

		const accepted = hold.press(driver)

		expect(accepted).toBe(false)
		expect(hold.phase).toBe('idle')
		other.resolve()
		await otherOutcome
		await flush()
		vi.advanceTimersByTime(HOLD_DELAY_MS)
		hold.release()
		expect(steps, 'a dropped press never fires once the group frees').toHaveLength(0)
		expect(stop).not.toHaveBeenCalled()
	})

	it('lookahead plans step k+1 from step k and executes it when held and current', async () => {
		const { hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, plans, executions } = createLookaheadDriver()

		hold.press(driver)
		const first = { stepNumber: 1 }
		plans[0].result.resolve(first)
		await flush()

		expect(executions[0].plan).toBe(first)
		expect(plans[1].stepNumber).toBe(2)
		expect(plans[1].previous, 'the next plan starts where the running one ends').toBe(first)
		expect(hold.phase).toBe('moving')

		const second = { stepNumber: 2 }
		plans[1].result.resolve(second)
		await flush()
		expect(hold.phase).toBe('moving-next-planned')
		expect(executions, 'the queued plan waits for the running segment').toHaveLength(1)

		executions[0].result.resolve()
		await flush()

		expect(executions[1].plan).toBe(second)
		expect(hold.phase).toBe('moving')
		expect(plans[2].previous).toBe(second)
	})

	it('lookahead drops a stale plan and ends at rest with no stop', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, plans, executions, state } = createLookaheadDriver()
		hold.press(driver)
		plans[0].result.resolve({ stepNumber: 1 })
		await flush()
		plans[1].result.resolve({ stepNumber: 2 })
		await flush()

		state.isCurrent = false
		executions[0].result.resolve()
		await flush()

		expect(executions, 'a stale plan is never sent').toHaveLength(1)
		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})

	it('lookahead drops the queued plan after a click', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, plans, executions } = createLookaheadDriver()
		hold.press(driver)
		plans[0].result.resolve({ stepNumber: 1 })
		await flush()
		plans[1].result.resolve({ stepNumber: 2 })
		await flush()

		hold.release()
		executions[0].result.resolve()
		await flush()

		expect(executions).toHaveLength(1)
		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})

	it('a planning failure ends after the current step with failure set and no stop', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, plans, executions } = createLookaheadDriver()
		hold.press(driver)
		plans[0].result.resolve({ stepNumber: 1 })
		await flush()

		plans[1].result.reject(new Error('cannot plan'))
		await flush()

		expect(hold.failure, 'the running step finishes first').toBeUndefined()
		expect(executions[0].signal.aborted).toBe(false)

		executions[0].result.resolve()
		await flush()

		expect(hold.failure?.message).toBe('cannot plan')
		expect(executions).toHaveLength(1)
		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})

	it('a rejection after your own release is the normal end, not a failure', async () => {
		const { hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()
		hold.press(driver)
		vi.advanceTimersByTime(HOLD_DELAY_MS)

		hold.release()
		steps[0].result.reject(new Error('stopped before reaching target'))
		await flush()

		expect(hold.failure).toBeUndefined()
	})

	it('any other rejection sets failure and ends the hold', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()
		hold.press(driver)

		steps[0].result.reject(new Error('out of reach'))
		await flush()

		expect(hold.failure?.message).toBe('out of reach')
		expect(steps).toHaveLength(1)
		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})

	it('a new press clears failure', async () => {
		const { hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()
		hold.press(driver)
		steps[0].result.reject(new Error('out of reach'))
		await flush()

		hold.press(driver)

		expect(hold.failure).toBeUndefined()
	})

	it('a run-while-held click calls stop', () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, runs } = createRunWhileHeldDriver()

		hold.press(driver)
		hold.release()

		expect(runs[0].signal.aborted).toBe(true)
		expect(stop).toHaveBeenCalledTimes(1)
	})

	it('a run-while-held call that resolves ends the hold with no stop', async () => {
		const { stop, hold } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, runs } = createRunWhileHeldDriver()
		hold.press(driver)

		runs[0].result.resolve()
		await flush()
		hold.release()

		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})

	it('cancel aborts the call in flight and calls no stop', async () => {
		const { stop, hold, guard } = setup(ONE_SEGMENT_PER_EXECUTE)
		const { driver, steps } = createSteppingDriver()
		hold.press(driver)
		vi.advanceTimersByTime(HOLD_DELAY_MS)

		hold.cancel()
		hold.release()

		expect(steps[0].signal.aborted).toBe(true)
		steps[0].result.reject(new Error('stopped before reaching target'))
		await flush()

		expect(stop).not.toHaveBeenCalled()
		expect(hold.failure).toBeUndefined()
		expect(steps).toHaveLength(1)
		expect(hold.phase).toBe('idle')
		expect(guard.isBusy).toBe(false)
	})

	it('at two segments per execute, the first execute receives the joined plan of segments 1 and 2', async () => {
		const { plans, executions, first, second } = await startTwoSegmentHold()

		expect(plans[1].stepNumber).toBe(2)
		expect(plans[1].previous, 'segment 2 chains from segment 1').toBe(first)
		expect(executions).toHaveLength(1)
		expect(executions[0].plan.segments).toEqual([first, second])
	})

	it('at two segments per execute, the lookahead plans segments 3 and 4 from segment 2', async () => {
		const { hold, plans, executions, second } = await startTwoSegmentHold()
		const third = { stepNumber: 3 }
		const fourth = { stepNumber: 4 }

		plans[2].result.resolve(third)
		await flush()
		plans[3].result.resolve(fourth)
		await flush()
		executions[0].result.resolve()
		await flush()

		expect(plans[2].stepNumber).toBe(3)
		expect(
			plans[2].previous,
			'the next group starts from the last segment, not the joined plan'
		).toBe(second)
		expect(plans[3].stepNumber).toBe(4)
		expect(plans[3].previous).toBe(third)
		expect(executions[1].plan.segments).toEqual([third, fourth])
		expect(hold.phase).toBe('moving')
	})

	it('at two segments per execute, a planning failure on segment 4 drops the group and sets failure after the current execute', async () => {
		const { hold, stop, plans, executions } = await startTwoSegmentHold()
		plans[2].result.resolve({ stepNumber: 3 })
		await flush()

		plans[3].result.reject(new Error('cannot plan segment 4'))
		await flush()

		expect(hold.failure, 'the running execute finishes first').toBeUndefined()
		expect(executions[0].signal.aborted).toBe(false)

		executions[0].result.resolve()
		await flush()

		expect(hold.failure?.message).toBe('cannot plan segment 4')
		expect(executions, 'segment 3 alone is never sent').toHaveLength(1)
		expect(stop).not.toHaveBeenCalled()
		expect(hold.phase).toBe('idle')
	})
})
