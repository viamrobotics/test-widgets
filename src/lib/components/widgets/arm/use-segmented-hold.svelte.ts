import type { InFlightGuard } from '$lib/components/in-flight-guard.svelte'

/** Where a hold is. `moving-next-planned` means the next segment's plan is ready in the browser. */
export type HoldPhase = 'idle' | 'moving' | 'moving-next-planned'

/** Sends one step at a time. Step `k + 1` starts only after step `k` resolves with the button held. */
export interface SteppingDriver {
	kind: 'stepping'
	/** Moves one step. `stepNumber` starts at 1. */
	moveStep(stepNumber: number, signal: AbortSignal): Promise<void>
}

/**
 * How many planned segments one `execute` carries. It is tuned together with the segment length,
 * which is one step at the current step size, on a real arm. At 1, only one segment is ever on the
 * robot. Do not raise it without that tuning.
 */
export const SEGMENTS_PER_EXECUTE = 1

/** Plans the next execute's segments while the current execute runs, one execute ahead and no deeper. */
export interface LookaheadDriver<TPlan> {
	kind: 'lookahead'
	/** Plans segment `stepNumber`, starting where `previous` ends, or from the arm's pose for segment 1. */
	planStep(stepNumber: number, previous: TPlan | undefined, signal: AbortSignal): Promise<TPlan>
	/** Joins one execute's consecutive segment plans, in order, into the plan `executePlan` sends. */
	joinPlans(plans: readonly TPlan[]): TPlan
	executePlan(plan: TPlan, signal: AbortSignal): Promise<void>
	/** False when anything changed since `plan` was made, so sending it is unsafe and it is dropped. */
	isPlanCurrent(plan: TPlan): boolean
}

/** One long call that moves until it resolves or the release aborts it, such as Zero or Home. */
export interface RunWhileHeldDriver {
	kind: 'run-while-held'
	run(signal: AbortSignal): Promise<void>
}

/** How a hold moves the arm. The engine knows nothing about arms. The caller supplies the calls. */
export type HoldDriver<TPlan> = SteppingDriver | LookaheadDriver<TPlan> | RunWhileHeldDriver

/** What a segmented hold needs from its caller. */
export interface SegmentedHoldOptions {
	/** The conflict group. It stays busy for the whole hold. */
	guard: InFlightGuard
	/** Stops the arm. Never guarded. Called at most once per hold, on a release that aborts a call. */
	stop: () => Promise<unknown>
	/** A release before this many milliseconds is a click: the step in flight completes, no stop. */
	holdDelayMs: number
	/** Segments per lookahead execute. Pass `SEGMENTS_PER_EXECUTE`. */
	segmentsPerExecute: number
}

/** One press-and-hold on a physical arm. */
export interface SegmentedHold {
	readonly phase: HoldPhase
	/** Why the last hold ended early. A rejection after the engine's own abort is not a failure. */
	readonly failure: Error | undefined
	/**
	 * Starts a hold and clears `failure`.
	 *
	 * @returns False when the guard is busy. Nothing is sent, then or later.
	 */
	press<TPlan>(driver: HoldDriver<TPlan>): boolean
	/** Ends the hold. After the hold delay, or always for `run-while-held`, aborts the call in flight and stops. */
	release(): void
	/** Stop was pressed elsewhere: aborts, drops any queued plan, ends the hold, and calls no stop of its own. */
	cancel(): void
}

interface ActiveHold {
	isHeld: boolean
	isPastDelay: boolean
	stopsOnAnyRelease: boolean
	motionInFlight: number
	motion: AbortController
	lookahead: AbortController
	timer: ReturnType<typeof setTimeout> | undefined
}

type CallResult<TResult> =
	| { status: 'resolved'; value: TResult }
	| { status: 'aborted' }
	| { status: 'rejected'; error: Error }

const toError = (error: unknown): Error =>
	error instanceof Error ? error : new Error(String(error), { cause: error })

const ignoreStopFailure = () => {}

/** Creates the hold engine for one conflict group. */
export const useSegmentedHold = (options: SegmentedHoldOptions): SegmentedHold => {
	let phase = $state<HoldPhase>('idle')
	let failure = $state<Error | undefined>(undefined)
	let active: ActiveHold | undefined

	const clearTimer = (hold: ActiveHold) => {
		if (hold.timer === undefined) {
			return
		}
		clearTimeout(hold.timer)
		hold.timer = undefined
	}

	const dropQueuedPlan = () => {
		if (phase === 'moving-next-planned') {
			phase = 'moving'
		}
	}

	// The caller's stop mutation reports its own error, so the engine only keeps a failed stop from going unhandled.
	const sendStop = () => {
		new Promise<unknown>((resolve) => {
			resolve(options.stop())
		}).catch(ignoreStopFailure)
	}

	const call = async <TResult>(
		hold: ActiveHold,
		controller: AbortController,
		send: (signal: AbortSignal) => Promise<TResult>
	): Promise<CallResult<TResult>> => {
		// Only motion-group calls can leave the arm moving. A lookahead plan in flight alone means the arm is at rest.
		const isMotion = controller === hold.motion
		if (isMotion) {
			hold.motionInFlight += 1
		}
		try {
			const value = await send(controller.signal)
			return { status: 'resolved', value }
		} catch (error) {
			if (controller.signal.aborted) {
				return { status: 'aborted' }
			}
			return { status: 'rejected', error: toError(error) }
		} finally {
			if (isMotion) {
				hold.motionInFlight -= 1
			}
		}
	}

	const recordFailure = <TResult>(result: CallResult<TResult>) => {
		if (result.status === 'rejected') {
			failure = result.error
		}
	}

	const runStepping = async (hold: ActiveHold, driver: SteppingDriver) => {
		for (let stepNumber = 1; ; stepNumber += 1) {
			const result = await call(hold, hold.motion, (signal) => driver.moveStep(stepNumber, signal))
			recordFailure(result)
			if (result.status !== 'resolved' || !hold.isHeld) {
				return
			}
		}
	}

	/** Plans one execute's segments by chaining `planStep`. Any segment that fails drops the whole group. */
	const planGroup = async <TPlan>(
		hold: ActiveHold,
		controller: AbortController,
		driver: LookaheadDriver<TPlan>,
		firstStepNumber: number,
		previous: TPlan | undefined
	): Promise<CallResult<TPlan[]>> => {
		const segments: TPlan[] = []
		let start = previous
		for (let offset = 0; offset < options.segmentsPerExecute; offset += 1) {
			const from = start
			const result = await call(hold, controller, (signal) =>
				driver.planStep(firstStepNumber + offset, from, signal)
			)
			if (result.status !== 'resolved') {
				return result
			}
			segments.push(result.value)
			start = result.value
		}
		return { status: 'resolved', value: segments }
	}

	const planAhead = async <TPlan>(
		hold: ActiveHold,
		driver: LookaheadDriver<TPlan>,
		firstStepNumber: number,
		previous: TPlan | undefined
	): Promise<CallResult<TPlan[]>> => {
		const result = await planGroup(hold, hold.lookahead, driver, firstStepNumber, previous)
		if (result.status === 'resolved' && hold.isHeld) {
			phase = 'moving-next-planned'
		}
		return result
	}

	const runLookahead = async <TPlan>(hold: ActiveHold, driver: LookaheadDriver<TPlan>) => {
		const first = await planGroup(hold, hold.motion, driver, 1, undefined)
		recordFailure(first)
		if (first.status !== 'resolved') {
			return
		}
		let group = first.value
		for (let stepNumber = 1; ; stepNumber += options.segmentsPerExecute) {
			const nextStepNumber = stepNumber + options.segmentsPerExecute
			const next = hold.isHeld ? planAhead(hold, driver, nextStepNumber, group.at(-1)) : undefined
			const joined = driver.joinPlans(group)
			const executed = await call(hold, hold.motion, (signal) => driver.executePlan(joined, signal))
			recordFailure(executed)
			if (executed.status !== 'resolved' || next === undefined) {
				hold.lookahead.abort()
				return
			}
			const planned = await next
			recordFailure(planned)
			if (planned.status !== 'resolved' || !hold.isHeld) {
				return
			}
			if (!planned.value.every((plan) => driver.isPlanCurrent(plan))) {
				return
			}
			group = planned.value
			phase = 'moving'
		}
	}

	const runWhileHeld = async (hold: ActiveHold, driver: RunWhileHeldDriver) => {
		recordFailure(await call(hold, hold.motion, (signal) => driver.run(signal)))
	}

	const runDriver = <TPlan>(hold: ActiveHold, driver: HoldDriver<TPlan>) => {
		if (driver.kind === 'stepping') {
			return runStepping(hold, driver)
		}
		if (driver.kind === 'lookahead') {
			return runLookahead(hold, driver)
		}
		return runWhileHeld(hold, driver)
	}

	const runHold = async <TPlan>(hold: ActiveHold, driver: HoldDriver<TPlan>) => {
		active = hold
		failure = undefined
		phase = 'moving'
		hold.timer = setTimeout(() => {
			hold.timer = undefined
			hold.isPastDelay = true
		}, options.holdDelayMs)
		try {
			await runDriver(hold, driver)
		} finally {
			clearTimer(hold)
			hold.isHeld = false
			active = undefined
			phase = 'idle'
		}
	}

	const press = <TPlan>(driver: HoldDriver<TPlan>) => {
		const hold: ActiveHold = {
			isHeld: true,
			isPastDelay: false,
			stopsOnAnyRelease: driver.kind === 'run-while-held',
			motionInFlight: 0,
			motion: new AbortController(),
			lookahead: new AbortController(),
			timer: undefined,
		}
		return options.guard.run(() => runHold(hold, driver)) !== undefined
	}

	const release = () => {
		const hold = active
		if (!hold?.isHeld) {
			return
		}
		hold.isHeld = false
		clearTimer(hold)
		hold.lookahead.abort()
		dropQueuedPlan()
		const sendsStop = hold.stopsOnAnyRelease || hold.isPastDelay
		if (!sendsStop || hold.motionInFlight === 0) {
			return
		}
		hold.motion.abort()
		sendStop()
	}

	const cancel = () => {
		const hold = active
		if (hold === undefined) {
			return
		}
		hold.isHeld = false
		clearTimer(hold)
		hold.lookahead.abort()
		hold.motion.abort()
		dropQueuedPlan()
	}

	return {
		get phase() {
			return phase
		},
		get failure() {
			return failure
		},
		press,
		release,
		cancel,
	}
}
