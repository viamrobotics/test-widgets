<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { InputControllerClient, type InputControllerEvent } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	// The event types the input controller API names. The field takes any other name too.
	const KNOWN_EVENT_NAMES = [
		'AllEvents',
		'Connect',
		'Disconnect',
		'ButtonPress',
		'ButtonRelease',
		'ButtonHold',
		'ButtonChange',
		'PositionChangeAbs',
		'PositionChangeRel',
	]
	const DEFAULT_EVENT = 'ButtonPress'
	const CONTROL_PLACEHOLDER = 'ButtonSouth'
	const TIME_PLACEHOLDER = 'Now'
	const TIME_HINT = 'A time such as 2026-01-31T10:00:00Z. Empty sends the current time.'
	const VALUE_STEP = 0.1
	const ZONED_TIME =
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/u
	const MS_PER_SECOND = 1000
	const NANOS_PER_MS = 1_000_000

	const MISSING_CONTROL_REASON = 'Enter a control name.'
	const MISSING_EVENT_REASON = 'Enter an event name.'
	const MISSING_VALUE_REASON = 'Enter a value.'
	const INVALID_TIME_REASON = 'Enter a time such as 2026-01-31T10:00:00Z, or leave it empty.'

	let control = $state('')
	let eventName = $state(DEFAULT_EVENT)
	let controlValue = $state<number | undefined>(0)
	let time = $state('')

	const idPrefix = $props.id()
	const eventListId = `${idPrefix}-events`
	const reasonId = `${idPrefix}-reason`

	const trimmedControl = $derived(control.trim())
	const trimmedEventName = $derived(eventName.trim())
	const trimmedTime = $derived(time.trim())
	const isValueValid = $derived(controlValue !== undefined && Number.isFinite(controlValue))
	// `Date.parse` alone reads "1" as a date, and reads a time with no zone in the browser's zone.
	// It also refuses a date or clock that `Date.parse` would roll over, such as February 30.
	const parseTime = (text: string) => {
		const match = ZONED_TIME.exec(text)
		if (match === null) return Number.NaN
		// An unmatched seconds group is undefined, and `Number(undefined)` is NaN, so it reads as 0 first.
		const [year, month, day, hour, minute, second = 0] = match
			.slice(1)
			.map((group) => Number(group ?? 0))
		const rebuilt = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day, hour, minute, second))
		const readsBack =
			rebuilt.getUTCFullYear() === year &&
			rebuilt.getUTCMonth() === (month ?? 1) - 1 &&
			rebuilt.getUTCDate() === day &&
			rebuilt.getUTCHours() === hour &&
			rebuilt.getUTCMinutes() === minute &&
			rebuilt.getUTCSeconds() === second
		return readsBack ? Date.parse(text) : Number.NaN
	}
	// Undefined for an empty field, and NaN for text that is not a time.
	const chosenTimeMs = $derived(trimmedTime === '' ? undefined : parseTime(trimmedTime))
	const isTimeValid = $derived(chosenTimeMs === undefined || !Number.isNaN(chosenTimeMs))

	const blockedReason = $derived.by(() => {
		if (trimmedControl === '') return MISSING_CONTROL_REASON
		if (trimmedEventName === '') return MISSING_EVENT_REASON
		if (!isValueValid) return MISSING_VALUE_REASON
		if (!isTimeValid) return INVALID_TIME_REASON
		return undefined
	})
	// One reason shows at a time, so only the field it names is marked and described.
	const describedByFor = (reason: string) => (blockedReason === reason ? reasonId : undefined)
	const stateFor = (reason: string) => (blockedReason === reason ? 'error' : undefined)

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const triggerEventMutation = createResourceMutation(client, 'triggerEvent')

	const buildEvent = (eventValue: number): InputControllerEvent => {
		const timeMs = chosenTimeMs ?? Date.now()
		const seconds = Math.floor(timeMs / MS_PER_SECOND)
		return {
			event: trimmedEventName,
			control: trimmedControl,
			value: eventValue,
			time: {
				seconds: BigInt(seconds),
				nanos: (timeMs - seconds * MS_PER_SECOND) * NANOS_PER_MS,
			},
		}
	}

	const execute = () => {
		if (blockedReason !== undefined || controlValue === undefined) return
		triggerEventMutation.mutate([buildEvent(controlValue)])
	}
</script>

<ApiSection
	method="TriggerEvent"
	api={ResourceTriplets.InputController}
	class="grow flex-col gap-2"
	mutations={[triggerEventMutation]}
>
	<TextField
		label="Control"
		placeholder={CONTROL_PLACEHOLDER}
		aria-describedby={describedByFor(MISSING_CONTROL_REASON)}
		bind:value={control}
	/>
	<TextField
		label="Event"
		list={eventListId}
		aria-describedby={describedByFor(MISSING_EVENT_REASON)}
		bind:value={eventName}
	/>
	<datalist id={eventListId}>
		{#each KNOWN_EVENT_NAMES as name (name)}
			<option value={name}></option>
		{/each}
	</datalist>
	<NumberField
		{...emptyOnClear(() => (controlValue = undefined))}
		label="Value"
		step={VALUE_STEP}
		state={stateFor(MISSING_VALUE_REASON)}
		aria-describedby={describedByFor(MISSING_VALUE_REASON)}
		bind:value={controlValue}
	/>
	<TextField
		label="Time"
		hint={TIME_HINT}
		placeholder={TIME_PLACEHOLDER}
		state={stateFor(INVALID_TIME_REASON)}
		aria-describedby={describedByFor(INVALID_TIME_REASON)}
		bind:value={time}
	/>
	{#if blockedReason !== undefined}
		<p
			id={reasonId}
			class="text-subtle-1 text-xs"
		>
			{blockedReason}
		</p>
	{/if}
	<div class="flex justify-end">
		<HeldBack
			reason={blockedReason}
			{reasonId}
		>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={execute}
				>
					<Icon icon={mdiPlayCircleOutline} />
					Execute
				</button>
			{/snippet}
		</HeldBack>
	</div>
</ApiSection>
