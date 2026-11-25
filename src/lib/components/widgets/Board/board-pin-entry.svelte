<!--
@component
One named pin in `Board.Pin`'s list: its polled level with High and Low, its duty cycle, and its
frequency. Writes share the pin's conflict group with SetGpio, SetPwm, and SetPwmFrequency. Status
text goes to `onStatusChange` and every error to the enclosing section's indicator.
-->
<script lang="ts">
	import type { Attachment } from 'svelte/attachments'

	import { mdiClose } from '@mdi/js'
	import { NumberField, Slider } from '@viamrobotics/prime-controls'
	import { Icon, StatusDot } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'
	import { on } from 'svelte/events'

	import { useReportedError } from '$lib/components/media-frame/use-reported-error.svelte'

	import type { BoardNameEntryProps } from './board-name-entry-props'

	import { useBoardState } from './board-state.svelte'

	const { partID, resourceName, name, onRemove, onStatusChange }: BoardNameEntryProps = $props()

	const LEVEL_POLL_MS = 1000
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
	const nameId = `${id}-name`
	const levelLabelId = `${id}-level`

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A failed read stops its own poll. Retry starts it again once a read succeeds.
	let isLevelPolling = $state(true)
	let isDutyPolling = $state(true)
	let isFrequencyPolling = $state(true)

	const pollEvery = (
		isPolling: boolean,
		intervalMs: number
	): { refetchInterval: number | false } => ({
		refetchInterval: isPolling ? intervalMs : false,
	})

	const pinArgs = (): [pin: string] => [name]

	const levelQuery = createResourceQuery(client, 'getGPIO', pinArgs, () =>
		pollEvery(isLevelPolling, LEVEL_POLL_MS)
	)
	const dutyQuery = createResourceQuery(client, 'getPWM', pinArgs, () =>
		pollEvery(isDutyPolling, PWM_POLL_MS)
	)
	const frequencyQuery = createResourceQuery(client, 'getPWMFrequency', pinArgs, () =>
		pollEvery(isFrequencyPolling, PWM_POLL_MS)
	)
	const setLevelMutation = createResourceMutation(client, 'setGPIO')
	const setDutyMutation = createResourceMutation(client, 'setPWM')
	const setFrequencyMutation = createResourceMutation(client, 'setPWMFrequency')

	useReportedError(() => levelQuery.error)
	useReportedError(() => dutyQuery.error)
	useReportedError(() => frequencyQuery.error)
	useReportedError(() => setLevelMutation.error)
	useReportedError(() => setDutyMutation.error)
	useReportedError(() => setFrequencyMutation.error)

	$effect(() => {
		if (levelQuery.isError) isLevelPolling = false
	})
	$effect(() => {
		if (dutyQuery.isError) isDutyPolling = false
	})
	$effect(() => {
		if (frequencyQuery.isError) isFrequencyPolling = false
	})

	const retryLevel = async () => {
		const result = await levelQuery.refetch()
		if (result.isSuccess) isLevelPolling = true
	}
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

	const sendLevel = async (isHigh: boolean) => {
		const outcome = guard.run(() => {
			sendingText = `${name} ${isHigh ? 'high' : 'low'}`
			return setLevelMutation.mutateAsync([name, isHigh])
		})
		if (outcome === undefined) return
		await outcome
		sendingText = ''
		void levelQuery.refetch()
	}

	const levelText = $derived(levelQuery.data ? 'High' : 'Low')

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
	const isFrequencyValid = $derived(
		frequencyShown !== undefined && Number.isFinite(frequencyShown) && frequencyShown >= 0
	)
	const isFrequencyFieldDisabled = $derived(guard.isBusy && frequencyInFlight === undefined)

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
		if (frequencyHz === undefined || !isFrequencyValid) return
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

	const isAnyReadStopped = $derived(
		levelQuery.isError || dutyQuery.isError || frequencyQuery.isError
	)

	const statusTextFor = () => {
		if (guard.isBusy && sendingText !== '') return `Sending ${sendingText}.`
		if (isDutyDragging) return `Release to send ${name} duty cycle ${dutyShown}%`
		if (isAnyReadStopped) return `${name} is not polling`
		return ''
	}

	const statusText = $derived(statusTextFor())

	$effect(() => {
		onStatusChange(statusText)
	})
</script>

{#snippet retryButton(label: string, onclick: () => Promise<void>)}
	<button
		type="button"
		class="button button-xs"
		aria-label={`Retry ${label} of pin ${name}`}
		{onclick}
	>
		Retry
	</button>
{/snippet}

{#snippet stoppedReadout(label: string, onRetry: () => Promise<void>)}
	<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<div class="flex min-w-19 flex-1 items-center gap-1">
			<span class="text-subtle-1 shrink-0 text-xs">{label}</span>
			<output class="readout font-roboto-mono">
				<span class="readout-value">{MISSING_VALUE}</span>
			</output>
		</div>
		{@render retryButton(label.toLowerCase(), onRetry)}
	</div>
{/snippet}

<div
	role="group"
	aria-labelledby={nameId}
	class="border-light flex min-w-0 flex-col gap-1 border-t pt-2"
>
	<div class="flex items-center gap-1">
		<h4
			id={nameId}
			class="min-w-0 flex-1 truncate text-xs font-semibold"
		>
			<span class="font-roboto-mono">{name}</span>
		</h4>
		<button
			type="button"
			class="icon-button size-6"
			aria-label={`Remove pin ${name}`}
			onclick={onRemove}
		>
			<Icon
				icon={mdiClose}
				size="sm"
			/>
		</button>
	</div>

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
					{#if levelQuery.isError || levelQuery.data === undefined}
						{MISSING_VALUE}
					{:else}
						<StatusDot
							state={levelQuery.data ? 'success' : 'disabled'}
							label={`Level of pin ${name}`}
						/>
						{levelText}
					{/if}
				</span>
			</output>
		</div>
		{#if levelQuery.isError}
			{@render retryButton('level', retryLevel)}
		{/if}
		<div
			role="group"
			aria-label={`Drive pin ${name}`}
			class="flex items-center gap-1"
		>
			<button
				type="button"
				class="button button-xs"
				disabled={guard.isBusy}
				onclick={() => sendLevel(true)}
			>
				High
			</button>
			<button
				type="button"
				class="button button-xs"
				disabled={guard.isBusy}
				onclick={() => sendLevel(false)}
			>
				Low
			</button>
		</div>
	</div>

	{#if dutyQuery.isError}
		{@render stoppedReadout('Duty cycle', retryDuty)}
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

	{#if frequencyQuery.isError}
		{@render stoppedReadout('Frequency', retryFrequency)}
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
				bind:value={() => frequencyShown, setFrequencyShown}
			/>
			<button
				type="button"
				class="button button-xs"
				aria-label={`Set frequency of pin ${name}`}
				disabled={guard.isBusy || !isFrequencyValid}
				onclick={sendFrequency}
			>
				Set
			</button>
		</div>
	{/if}
</div>
