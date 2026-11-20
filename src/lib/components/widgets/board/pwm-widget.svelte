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
	const PERCENT = 100
	const DUTY_CYCLE_DECIMALS = 2
	const PIN_PLACEHOLDER = '11'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A getter that moves the pin from write to read, so the user decides when it runs.
	const getDutyCycleMutation = createResourceMutation(client, 'getPWM')

	const id = $props.id()
	const labelId = `${id}-label`

	let ownPin = $state('')
	let reading = $state.raw<{ pin: string; dutyCycleFraction: number }>()

	const activePin = $derived((sharedPin ?? ownPin).trim())
	const hasPin = $derived(activePin !== '')
	const hintId = `${id}-hint`
	const isHintShown = $derived(sharedPin !== undefined && !hasPin)
	// A reading belongs to the pin it came from, so it hides when the pin changes.
	const dutyCycleFraction = $derived(
		reading?.pin === activePin ? reading.dutyCycleFraction : undefined
	)
	const dutyCycleText = $derived(
		dutyCycleFraction === undefined
			? MISSING_VALUE
			: formatNumeric(dutyCycleFraction * PERCENT, DUTY_CYCLE_DECIMALS)
	)

	const readDutyCycle = () => {
		if (!hasPin) return
		const pinToRead = activePin
		getDutyCycleMutation.mutate([pinToRead], {
			onSuccess: (value) => {
				reading = { pin: pinToRead, dutyCycleFraction: value }
			},
		})
	}
</script>

<ApiSection
	method="PWM"
	api={ResourceTriplets.Board}
	mutations={[getDutyCycleMutation]}
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
			onclick={readDutyCycle}
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
			Duty cycle
		</span>
		<output class="readout font-roboto-mono">
			<span class="readout-value">{dutyCycleText}</span>
			<span class="readout-suffix">%</span>
		</output>
	</div>
</ApiSection>
