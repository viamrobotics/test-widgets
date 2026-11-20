<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import MissingPinHint from '$lib/components/widgets/board/missing-pin-hint.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		/** The pin to read. Set, the widget draws no `Pin` field, and `''` disables Get with a hint. */
		pin?: string
	}

	const { partID, resourceName, pin }: Props = $props()

	const PIN_PLACEHOLDER = '11'
	const MISSING_VALUE = '-'

	let ownPin = $state('')
	let reading = $state.raw<{ pin: string; isHigh: boolean }>()

	const hasOwnPinField = $derived(pin === undefined)
	const activePin = $derived(pin ?? ownPin)
	const trimmedPin = $derived(activePin.trim())
	const isPinMissing = $derived(trimmedPin === '')
	const isHintShown = $derived(!hasOwnPinField && isPinMissing)
	// A reading belongs to the pin it came from, so it hides when the pin changes.
	const isPinHigh = $derived(reading?.pin === trimmedPin ? reading.isHigh : undefined)
	const stateText = $derived(isPinHigh ? 'High' : 'Low')

	const id = $props.id()
	const hintId = `${id}-hint`
	const STATE_DOT_LABEL = 'Pin state'
	const labelId = `${id}-label`

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// Reading a pin switches it from write to read, so this is a mutation the person triggers.
	const getGPIOMutation = createResourceMutation(client, 'getGPIO')

	const readPin = async () => {
		if (isPinMissing) return
		try {
			const pinToRead = trimmedPin
			reading = { pin: pinToRead, isHigh: await getGPIOMutation.mutateAsync([pinToRead]) }
		} catch {
			// The section's error indicator reports the failure.
		}
	}
</script>

{#snippet getButton()}
	<button
		type="button"
		class="button button-compact ml-auto"
		disabled={isPinMissing}
		aria-describedby={isHintShown ? hintId : undefined}
		onclick={readPin}
	>
		Get
	</button>
{/snippet}

<ApiSection
	method="GetGPIO"
	api={ResourceTriplets.Board}
	class="grow flex-col gap-2"
	mutations={[getGPIOMutation]}
>
	{#if isHintShown}
		<MissingPinHint id={hintId} />
	{/if}
	{#if hasOwnPinField}
		<div class="flex flex-wrap items-end gap-2">
			<TextField
				class="min-w-40 flex-1"
				label="Pin"
				placeholder={PIN_PLACEHOLDER}
				bind:value={ownPin}
			/>
			{@render getButton()}
		</div>
	{:else}
		<div class="flex justify-end">
			{@render getButton()}
		</div>
	{/if}
	<div
		role="group"
		aria-labelledby={labelId}
		class="flex items-center gap-1"
	>
		<span
			id={labelId}
			class="text-subtle-1 shrink-0 text-xs"
		>
			State
		</span>
		<output class="readout font-roboto-mono">
			<span class="readout-value inline-flex items-center gap-2">
				{#if isPinHigh === undefined}
					{MISSING_VALUE}
				{:else}
					<StatusDot
						state={isPinHigh ? 'success' : 'disabled'}
						label={STATE_DOT_LABEL}
					/>
					{stateText}
				{/if}
			</span>
		</output>
	</div>
</ApiSection>
