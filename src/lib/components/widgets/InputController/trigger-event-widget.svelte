<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, Select, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { InputControllerClient, type InputControllerEvent } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const EVENT_NAMES = [
		'ButtonPress',
		'ButtonRelease',
		'ButtonHold',
		'ButtonChange',
		'PositionChangeAbs',
		'PositionChangeRel',
	]
	const EVENT_ITEMS = EVENT_NAMES.map((name) => ({ value: name, label: name }))
	const DEFAULT_EVENT = 'ButtonPress'
	const CONTROL_PLACEHOLDER = 'ButtonSouth'
	const MIN_CONTROL_VALUE = -1
	const MAX_CONTROL_VALUE = 1
	const VALUE_STEP = 0.1
	const MS_PER_SECOND = 1000
	const NANOS_PER_MS = 1_000_000

	let control = $state('')
	let eventName = $state(DEFAULT_EVENT)
	let controlValue = $state<number | undefined>(0)

	const idPrefix = $props.id()
	const eventLabelId = `${idPrefix}-event`
	const hintId = `${idPrefix}-hint`

	const trimmedControl = $derived(control.trim())
	const isControlMissing = $derived(trimmedControl === '')
	const isValueValid = $derived(
		controlValue !== undefined &&
			Number.isFinite(controlValue) &&
			controlValue >= MIN_CONTROL_VALUE &&
			controlValue <= MAX_CONTROL_VALUE
	)
	const canExecute = $derived(!isControlMissing && isValueValid)
	const isHintShown = $derived(!canExecute)
	const isHintOnControl = $derived(isHintShown && isControlMissing)
	const isHintOnValue = $derived(isHintShown && !isControlMissing)
	const hintText = $derived(
		isControlMissing
			? 'Enter a control name.'
			: `Enter a value from ${MIN_CONTROL_VALUE} to ${MAX_CONTROL_VALUE}.`
	)

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const triggerEventMutation = createResourceMutation(client, 'triggerEvent')

	const setEventName = (next: string | undefined) => {
		if (next !== undefined) eventName = next
	}

	const buildEvent = (eventValue: number): InputControllerEvent => {
		const now = Date.now()
		return {
			event: eventName,
			control: trimmedControl,
			value: eventValue,
			time: {
				seconds: BigInt(Math.floor(now / MS_PER_SECOND)),
				nanos: (now % MS_PER_SECOND) * NANOS_PER_MS,
			},
		}
	}

	const execute = () => {
		if (!canExecute || controlValue === undefined) return
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
		aria-describedby={isHintOnControl ? hintId : undefined}
		bind:value={control}
	/>
	<div class="flex flex-col gap-1">
		<span
			id={eventLabelId}
			class="text-subtle-1 text-xs"
		>
			Event
		</span>
		<Select
			items={EVENT_ITEMS}
			bind:value={() => eventName, setEventName}
			aria-labelledby={eventLabelId}
		/>
	</div>
	<NumberField
		label="Value"
		min={MIN_CONTROL_VALUE}
		max={MAX_CONTROL_VALUE}
		step={VALUE_STEP}
		state={isValueValid ? undefined : 'error'}
		aria-describedby={isHintOnValue ? hintId : undefined}
		bind:value={controlValue}
	/>
	{#if isHintShown}
		<p
			id={hintId}
			class="text-subtle-1 text-xs"
		>
			{hintText}
		</p>
	{/if}
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={!canExecute}
			aria-describedby={isHintShown ? hintId : undefined}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</ApiSection>
