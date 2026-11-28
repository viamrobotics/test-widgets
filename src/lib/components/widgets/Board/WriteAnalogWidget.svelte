<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useBoardState } from './board-state.svelte'
	import { missingPinReason, PIN_BUSY_REASON } from './pin-held-back-reason'

	interface Props {
		partID: string
		resourceName: string
		/** The pin a host holds. Left out, the widget draws its own Pin field. */
		pin?: string
	}

	const { partID, resourceName, pin: hostPin }: Props = $props()

	const PIN_PLACEHOLDER = 'a1'
	const id = $props.id()
	const valueHintId = `${id}-value`
	const VALUE_HINT = 'Enter a whole number to execute.'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const writeAnalogMutation = createResourceMutation(client, 'writeAnalog')
	const { analogWriterGuard } = untrack(() => useBoardState(partID, resourceName))

	let ownPin = $state('')
	let value = $state<number | undefined>(0)

	const hasHostPin = $derived(hostPin !== undefined)
	const activePin = $derived((hostPin ?? ownPin).trim())
	// The board takes whole numbers.
	const isValueValid = $derived(value !== undefined && Number.isInteger(value))
	const canExecute = $derived(activePin !== '' && isValueValid)
	const guard = $derived(analogWriterGuard(activePin))
	const blockedReason = $derived.by(() => {
		if (activePin === '') return missingPinReason(!hasHostPin)
		if (!isValueValid) return VALUE_HINT
		return guard.isBusy ? PIN_BUSY_REASON : undefined
	})

	const execute = () => {
		if (!canExecute || value === undefined) return
		const valueToSend = value
		void guard.run(() => writeAnalogMutation.mutateAsync([activePin, valueToSend]))
	}
</script>

<ApiSection
	class="flex-col gap-2"
	method="WriteAnalog"
	api={ResourceTriplets.Board}
	mutations={[writeAnalogMutation]}
>
	{#if !hasHostPin}
		<TextField
			label="Pin"
			placeholder={PIN_PLACEHOLDER}
			bind:value={ownPin}
		/>
	{/if}
	<NumberField
		label="Value"
		step={1}
		state={isValueValid ? undefined : 'error'}
		aria-describedby={isValueValid ? undefined : valueHintId}
		{...emptyOnClear(() => (value = undefined))}
		bind:value
	/>
	{#if !isValueValid}
		<span
			id={valueHintId}
			class="text-subtle-1 text-xs">{VALUE_HINT}</span
		>
	{/if}
	<div class="flex justify-end">
		<HeldBack
			reason={blockedReason}
			reasonId={blockedReason === VALUE_HINT ? valueHintId : undefined}
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
