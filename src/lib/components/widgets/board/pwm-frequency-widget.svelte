<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import MissingPinHint from '$lib/components/widgets/board/missing-pin-hint.svelte'
	import { formatNumeric } from '$lib/format'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		/** The pin to read. Set, the widget draws no `Pin` field, and `''` disables Get. */
		pin?: string
	}

	const { partID, resourceName, pin: sharedPin }: Props = $props()

	const MISSING_VALUE = '-'
	const FREQUENCY_DECIMALS = 0
	const PIN_PLACEHOLDER = '11'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A getter that moves the pin from write to read, so the user decides when it runs.
	const getFrequencyMutation = createResourceMutation(client, 'getPWMFrequency')

	const id = $props.id()
	const labelId = `${id}-label`

	let ownPin = $state('')
	let reading = $state.raw<{ pin: string; frequencyHz: number }>()

	const activePin = $derived((sharedPin ?? ownPin).trim())
	const hasPin = $derived(activePin !== '')
	const hintId = `${id}-hint`
	const isHintShown = $derived(sharedPin !== undefined && !hasPin)
	// A reading belongs to the pin it came from, so it hides when the pin changes.
	const frequencyHz = $derived(reading?.pin === activePin ? reading.frequencyHz : undefined)
	const frequencyText = $derived(
		frequencyHz === undefined ? MISSING_VALUE : formatNumeric(frequencyHz, FREQUENCY_DECIMALS)
	)

	const readFrequency = () => {
		if (!hasPin) return
		const pinToRead = activePin
		getFrequencyMutation.mutate([pinToRead], {
			onSuccess: (value) => {
				reading = { pin: pinToRead, frequencyHz: value }
			},
		})
	}
</script>

<ApiSection
	method="PWMFrequency"
	api={ResourceTriplets.Board}
	mutations={[getFrequencyMutation]}
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
		<button
			type="button"
			class="button button-compact ml-auto"
			disabled={!hasPin}
			aria-describedby={isHintShown ? hintId : undefined}
			onclick={readFrequency}
		>
			Get
		</button>
	</div>
	<div
		role="group"
		aria-labelledby={labelId}
		class="flex flex-col gap-1"
	>
		<span
			id={labelId}
			class="text-subtle-1 text-xs"
		>
			Frequency
		</span>
		<output class="readout font-roboto-mono">
			<span class="readout-value">{frequencyText}</span>
			<span class="readout-suffix">Hz</span>
		</output>
	</div>
</ApiSection>
