<!--
@component
One named pin in `Board.Pin`'s list: its level with Read, High and Low, its duty cycle, and its
frequency. The level is the last one written or read, never polled, since a read turns the pin
into an input. Level reads and every write share the pin's conflict group with SetGpio, SetPwm,
and SetPwmFrequency. Status
text goes to `onStatusChange` and every error to the enclosing section's indicator.
-->
<script lang="ts">
	import type { Attachment } from 'svelte/attachments'

	import { NumberField, Slider } from '@viamrobotics/prime-controls'
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { useReportedError } from '#lib/components/MediaFrame/use-reported-error.svelte.js'
	import { untrack } from 'svelte'
	import { on } from 'svelte/events'

	import type { BoardNameEntryProps } from './board-name-entry-props'

	import { useBoardState } from './board-state.svelte'
	import BoardNamedEntry from './BoardNamedEntry.svelte'
	import { PIN_BUSY_REASON } from './pin-held-back-reason'
	import { retryKeepingFocus } from './retry-keeping-focus'

	const { partID, resourceName, name, onRemove, onStatusChange }: BoardNameEntryProps = $props()

	const PWM_POLL_MS = 5000
	const PERCENT = 100
	const MISSING_VALUE = '-'
	// Keys a focused range steps by. A step sends on the key's release, never per repeat.
	const RANGE_STEP_KEYS = new Set([
		'ArrowUp',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
		'Home',
		'End',
		'PageUp',
		'PageDown',
	])

	const id = $props.id()
	const levelLabelId = `${id}-level`

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A failed read stops its own poll. Retry starts it again once a read succeeds.
	let isDutyPolling = $state(true)
	let isFrequencyPolling = $state(true)
	let dutySlot = $state<HTMLDivElement>()
	let frequencySlot = $state<HTMLDivElement>()

	const CONTROL_SELECTOR = 'input, [role="slider"]'
	const controlIn = (slot: HTMLDivElement | undefined) =>
		slot?.querySelector<HTMLElement>(CONTROL_SELECTOR)

	const pollEvery = (
		isPolling: boolean,
		intervalMs: number
	): { refetchInterval: number | false } => ({
		refetchInterval: isPolling ? intervalMs : false,
	})

	const pinArgs = (): [pin: string] => [name]

	// Not a polled query: on a Linux board GetGPIO reopens the line as an input, which ends a drive.
	const readLevelMutation = createResourceMutation(client, 'getGPIO')
	const dutyQuery = createResourceQuery(client, 'getPWM', pinArgs, () =>
		pollEvery(isDutyPolling, PWM_POLL_MS)
	)
	const frequencyQuery = createResourceQuery(client, 'getPWMFrequency', pinArgs, () =>
		pollEvery(isFrequencyPolling, PWM_POLL_MS)
	)
	const setLevelMutation = createResourceMutation(client, 'setGPIO')
	const setDutyMutation = createResourceMutation(client, 'setPWM')
	const setFrequencyMutation = createResourceMutation(client, 'setPWMFrequency')

	useReportedError(() => readLevelMutation.error)
	useReportedError(() => dutyQuery.error)
	useReportedError(() => frequencyQuery.error)
	useReportedError(() => setLevelMutation.error)
	useReportedError(() => setDutyMutation.error)
	useReportedError(() => setFrequencyMutation.error)

	$effect(() => {
		if (dutyQuery.isError) isDutyPolling = false
	})
	$effect(() => {
		if (frequencyQuery.isError) isFrequencyPolling = false
	})

	const retryDuty = async () => {
		const result = await dutyQuery.refetch()
		if (result.isSuccess) isDutyPolling = true
	}
	const retryFrequency = async () => {
		const result = await frequencyQuery.refetch()
		if (result.isSuccess) isFrequencyPolling = true
	}

	// Level, duty cycle, and frequency writes join the pin's conflict group, so only one is in flight.
	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))
	const guard = $derived(pinGuard(name))

	// Such as "11 high", while its write is in flight.
	let sendingText = $state('')

	// The level last written or read. Unknown until one of them succeeds, and after one fails.
	let level = $state<boolean | undefined>()
	let isReadingLevel = $state(false)

	const busyReason = $derived(guard.isBusy ? PIN_BUSY_REASON : undefined)

	const sendLevel = async (isHigh: boolean) => {
		const outcome = guard.run(() => {
			sendingText = `${name} ${isHigh ? 'high' : 'low'}`
			return setLevelMutation.mutateAsync([name, isHigh])
		})
		if (outcome === undefined) return
		const result = await outcome
		sendingText = ''
		level = result === 'succeeded' ? isHigh : undefined
	}

	const readLevel = async () => {
		let levelRead: boolean | undefined
		const outcome = guard.run(async () => {
			isReadingLevel = true
			levelRead = await readLevelMutation.mutateAsync([name])
		})
		if (outcome === undefined) return
		const result = await outcome
		isReadingLevel = false
		level = result === 'succeeded' ? levelRead : undefined
	}

	const levelText = $derived(level ? 'High' : 'Low')

	// Duty cycle. The shown value is held while the range or readout is focused, dragged, or edited,
	// then the value in flight, then the board's.
	let dutyHeld = $state<number | undefined>()
	let dutyInFlight = $state<number | undefined>()
	let isDutyDragging = $state(false)
	let isDutyFocused = false
	let isDutyEdited = false
	let isDutyKeyStepping = false

	const polledDuty = $derived(
		dutyQuery.data === undefined ? undefined : Math.round(dutyQuery.data * PERCENT)
	)
	const dutyShown = $derived(dutyHeld ?? dutyInFlight ?? polledDuty ?? 0)
	// Another write holds the group. The duty cycle's own send keeps it enabled, so focus stays on it.
	const isDutyDisabled = $derived(guard.isBusy && dutyInFlight === undefined)

	const setDutyShown = (percent: number) => {
		dutyHeld = percent
		isDutyEdited = true
	}

	const holdDuty = () => {
		dutyHeld ??= dutyShown
	}

	const releaseDutyHold = () => {
		if (isDutyFocused || isDutyDragging || isDutyEdited || dutyInFlight !== undefined) return
		dutyHeld = undefined
	}

	const sendDuty = async (percent: number) => {
		isDutyEdited = false
		const outcome = guard.run(() => {
			sendingText = `${name} duty cycle ${percent}%`
			dutyInFlight = percent
			return setDutyMutation.mutateAsync([name, percent / PERCENT])
		})
		if (outcome === undefined) {
			// Dropped: another write holds the group, so the shown value returns to the board's.
			dutyHeld = undefined
			return
		}
		const result = await outcome
		sendingText = ''
		await dutyQuery.refetch()
		dutyInFlight = undefined
		// A failed send returns the shown value to the board's, even while focused.
		if (result === 'failed') dutyHeld = undefined
		releaseDutyHold()
	}

	const isRangeEvent = (event: Event): event is Event & { target: HTMLInputElement } =>
		event.target instanceof HTMLInputElement && event.target.type === 'range'

	const isReadoutEvent = (event: Event): event is Event & { target: HTMLInputElement } =>
		event.target instanceof HTMLInputElement && event.target.type === 'number'

	// The slider's range and readout both bubble their pointer, key, focus, and change events here.
	const dutyGestures: Attachment<HTMLElement> = (node) => {
		const stopDragging = () => {
			if (!isDutyDragging) return
			isDutyDragging = false
			releaseDutyHold()
		}
		const offs = [
			on(node, 'pointerdown', (event) => {
				if (!isRangeEvent(event) || event.target.disabled) return
				holdDuty()
				isDutyDragging = true
			}),
			on(window, 'pointerup', stopDragging),
			on(window, 'pointercancel', stopDragging),
			// A pointer release fires the range's change. A keyboard step fires one per repeat, so it waits for keyup.
			on(node, 'change', (event) => {
				if (!isRangeEvent(event) || isDutyKeyStepping) return
				isDutyDragging = false
				void sendDuty(dutyShown)
			}),
			on(node, 'keydown', (event) => {
				if (isRangeEvent(event) && RANGE_STEP_KEYS.has(event.key)) {
					holdDuty()
					isDutyKeyStepping = true
					return
				}
				if (isReadoutEvent(event) && event.key === 'Enter' && isDutyEdited) {
					void sendDuty(dutyShown)
				}
			}),
			on(node, 'keyup', (event) => {
				if (!isRangeEvent(event) || !RANGE_STEP_KEYS.has(event.key) || !isDutyKeyStepping) return
				isDutyKeyStepping = false
				if (isDutyEdited) void sendDuty(dutyShown)
			}),
			on(node, 'focusin', () => {
				holdDuty()
				isDutyFocused = true
			}),
			on(node, 'focusout', (event) => {
				if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return
				isDutyFocused = false
				isDutyKeyStepping = false
				if (isReadoutEvent(event) && isDutyEdited) {
					void sendDuty(dutyShown)
					return
				}
				releaseDutyHold()
			}),
		]
		return () => {
			for (const off of offs) off()
		}
	}

	// Frequency. Held while focused or edited, then the value in flight, then the board's.
	let isFrequencyHeld = $state(false)
	let frequencyDraft = $state<number | undefined>()
	let frequencyInFlight = $state<number | undefined>()
	let isFrequencyEdited = false

	const polledFrequency = $derived(frequencyQuery.data)
	const frequencyShown = $derived.by(() => {
		if (isFrequencyHeld) return frequencyDraft
		return frequencyInFlight ?? polledFrequency
	})
	// The board takes whole hertz, a uint64.
	const isFrequencyValid = $derived(
		frequencyShown !== undefined && Number.isInteger(frequencyShown) && frequencyShown >= 0
	)
	const isFrequencyFieldDisabled = $derived(guard.isBusy && frequencyInFlight === undefined)
	const frequencyBlockedReason = $derived(
		isFrequencyValid ? busyReason : 'Enter a whole number of hertz.'
	)

	const setFrequencyShown = (frequencyHz: number | undefined) => {
		isFrequencyHeld = true
		frequencyDraft = frequencyHz
		isFrequencyEdited = true
	}

	const holdFrequency = () => {
		if (isFrequencyHeld) return
		frequencyDraft = frequencyShown
		isFrequencyHeld = true
	}

	let isFrequencyFocused = false

	const releaseFrequencyHold = () => {
		if (isFrequencyFocused || isFrequencyEdited || frequencyInFlight !== undefined) return
		isFrequencyHeld = false
	}

	const sendFrequency = async () => {
		const frequencyHz = frequencyShown
		if (frequencyHz === undefined || frequencyBlockedReason !== undefined) return
		const outcome = guard.run(() => {
			sendingText = `${name} frequency ${frequencyHz} Hz`
			frequencyInFlight = frequencyHz
			return setFrequencyMutation.mutateAsync([name, frequencyHz])
		})
		if (outcome === undefined) return
		isFrequencyEdited = false
		await outcome
		sendingText = ''
		await frequencyQuery.refetch()
		frequencyInFlight = undefined
		releaseFrequencyHold()
	}

	const onFrequencyKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') void sendFrequency()
	}

	const onFrequencyFocus = () => {
		holdFrequency()
		isFrequencyFocused = true
	}

	const onFrequencyBlur = () => {
		isFrequencyFocused = false
		releaseFrequencyHold()
	}

	const isAnyReadStopped = $derived(dutyQuery.isError || frequencyQuery.isError)

	const statusTextFor = () => {
		if (guard.isBusy && sendingText !== '') return `Sending ${sendingText}.`
		if (isReadingLevel) return `Reading ${name} level.`
		if (isDutyDragging) return `Release to send ${name} duty cycle ${dutyShown}%`
		if (isAnyReadStopped) return `${name} is not polling`
		return ''
	}

	const statusText = $derived(statusTextFor())

	$effect(() => {
		onStatusChange(statusText)
	})
</script>

{#snippet retryButton(
	label: string,
	onRetry: () => Promise<void>,
	slot: () => HTMLDivElement | undefined
)}
	<button
		type="button"
		class="button button-xs"
		aria-label={`Retry ${label} of pin ${name}`}
		onclick={(event) => retryKeepingFocus(event.currentTarget, onRetry, () => controlIn(slot()))}
	>
		Retry
	</button>
{/snippet}

{#snippet stoppedReadout(
	label: string,
	onRetry: () => Promise<void>,
	slot: () => HTMLDivElement | undefined
)}
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<div class="flex min-w-19 flex-1 items-center gap-1">
			<span class="text-subtle-1 shrink-0 text-xs">{label}</span>
			<output class="readout font-roboto-mono">
				<span class="readout-value">{MISSING_VALUE}</span>
			</output>
		</div>
		{@render retryButton(label.toLowerCase(), onRetry, slot)}
	</div>
{/snippet}

<BoardNamedEntry
	{name}
	removeLabel={`Remove pin ${name}`}
	{onRemove}
>
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<div class="flex min-w-19 flex-1 items-center gap-1">
			<span
				id={levelLabelId}
				class="text-subtle-1 shrink-0 text-xs"
			>
				Level
			</span>
			<output
				class="readout font-roboto-mono"
				aria-labelledby={levelLabelId}
			>
				<span class="readout-value inline-flex items-center gap-2">
					{#if level === undefined}
						{MISSING_VALUE}
					{:else}
						<StatusDot
							state={level ? 'success' : 'disabled'}
							label={`Level of pin ${name}`}
						/>
						{levelText}
					{/if}
				</span>
			</output>
		</div>
		<div
			role="group"
			aria-label={`Level of pin ${name}`}
			class="flex items-center gap-1"
		>
			<HeldBack reason={busyReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-xs"
						aria-label={`Read level of pin ${name}`}
						{...heldBack}
						onclick={readLevel}
					>
						Read
					</button>
				{/snippet}
			</HeldBack>
			<HeldBack reason={busyReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-xs"
						{...heldBack}
						onclick={() => sendLevel(true)}
					>
						High
					</button>
				{/snippet}
			</HeldBack>
			<HeldBack reason={busyReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-xs"
						{...heldBack}
						onclick={() => sendLevel(false)}
					>
						Low
					</button>
				{/snippet}
			</HeldBack>
		</div>
	</div>

	<div bind:this={dutySlot}>
		{#if dutyQuery.isError}
			{@render stoppedReadout('Duty cycle', retryDuty, () => dutySlot)}
		{:else}
			<div {@attach dutyGestures}>
				<Slider
					label="Duty cycle"
					suffix="%"
					min={0}
					max={PERCENT}
					step={1}
					disabled={isDutyDisabled}
					bind:value={() => dutyShown, setDutyShown}
				/>
			</div>
		{/if}
	</div>

	<div bind:this={frequencySlot}>
		{#if frequencyQuery.isError}
			{@render stoppedReadout('Frequency', retryFrequency, () => frequencySlot)}
		{:else}
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
				<NumberField
					class="min-w-40 flex-1"
					label="Frequency"
					suffix="Hz"
					min={0}
					step={1}
					state={isFrequencyValid ? undefined : 'error'}
					disabled={isFrequencyFieldDisabled}
					onkeydown={onFrequencyKeydown}
					onfocus={onFrequencyFocus}
					onblur={onFrequencyBlur}
					{...emptyOnClear(() => setFrequencyShown(undefined))}
					bind:value={() => frequencyShown, setFrequencyShown}
				/>
				<HeldBack reason={frequencyBlockedReason}>
					{#snippet children(heldBack)}
						<button
							type="button"
							class="button button-xs"
							aria-label={`Set frequency of pin ${name}`}
							{...heldBack}
							onclick={sendFrequency}
						>
							Set
						</button>
					{/snippet}
				</HeldBack>
			</div>
		{/if}
	</div>
</BoardNamedEntry>
