<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useBoardState } from './board-state.svelte'
	import MissingPinHint from './missing-pin-hint.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** The pin to set. Set, the widget draws no `Pin` field, and `''` disables Execute. */
		pin?: string
	}

	const { partID, resourceName, pin: sharedPin }: Props = $props()

	const MIN_FREQUENCY_HZ = 0
	const PIN_PLACEHOLDER = '11'
	const DEFAULT_FREQUENCY_HZ = 0

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const setFrequencyMutation = createResourceMutation(client, 'setPWMFrequency')
	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))

	let ownPin = $state('')
	let frequencyHz = $state<number | undefined>(DEFAULT_FREQUENCY_HZ)

	const activePin = $derived((sharedPin ?? ownPin).trim())
	const hasPin = $derived(activePin !== '')
	// The board takes whole hertz, a uint64.
	const isFrequencyValid = $derived(
		frequencyHz !== undefined && Number.isInteger(frequencyHz) && frequencyHz >= MIN_FREQUENCY_HZ
	)
	const canExecute = $derived(hasPin && isFrequencyValid)
	const guard = $derived(pinGuard(activePin))
	const id = $props.id()
	const hintId = `${id}-hint`
	const valueHintId = `${id}-value`
	const VALUE_HINT = 'Enter a whole number of hertz to execute.'
	const isHintShown = $derived(sharedPin !== undefined && !hasPin)

	const executeDescribedBy = $derived.by(() => {
		if (isHintShown) return hintId
		if (!isFrequencyValid) return valueHintId
		return undefined
	})

	const execute = () => {
		if (!canExecute || frequencyHz === undefined) return
		const frequencyToSend = frequencyHz
		void guard.run(() => setFrequencyMutation.mutateAsync([activePin, frequencyToSend]))
	}
</script>

<ApiSection
	method="SetPWMFrequency"
	api={ResourceTriplets.Board}
	mutations={[setFrequencyMutation]}
	class="flex-col gap-2"
>
	{#if isHintShown}
		<MissingPinHint id={hintId} />
	{/if}
	<div class="flex flex-wrap items-end gap-2">
		{#if sharedPin === undefined}
			<TextField
				class="min-w-40 flex-1"
				label="Pin"
				placeholder={PIN_PLACEHOLDER}
				bind:value={ownPin}
			/>
		{/if}
		<NumberField
			class="min-w-40 flex-1"
			label="Frequency"
			suffix="Hz"
			min={MIN_FREQUENCY_HZ}
			step={1}
			state={isFrequencyValid ? undefined : 'error'}
			aria-describedby={isFrequencyValid ? undefined : valueHintId}
			bind:value={frequencyHz}
		/>
	</div>
	{#if !isFrequencyValid}
		<span
			id={valueHintId}
			class="text-subtle-1 text-xs">{VALUE_HINT}</span
		>
	{/if}
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={!canExecute || guard.isBusy}
			aria-describedby={executeDescribedBy}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</ApiSection>
