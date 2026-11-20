<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, TextField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import MissingPinHint from '$lib/components/widgets/board/missing-pin-hint.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
		/** The pin a host holds. Left out, the widget draws its own Pin field. */
		pin?: string
	}

	const { partID, resourceName, pin: hostPin }: Props = $props()

	const PIN_PLACEHOLDER = 'a1'
	const hintId = $props.id()
	const valueHintId = `${hintId}-value`
	const VALUE_HINT = 'Enter a whole number to execute.'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const writeAnalogMutation = createResourceMutation(client, 'writeAnalog')

	let ownPin = $state('')
	let value = $state<number | undefined>(0)

	const hasHostPin = $derived(hostPin !== undefined)
	const activePin = $derived((hostPin ?? ownPin).trim())
	const isHostPinEmpty = $derived(hostPin !== undefined && hostPin.trim() === '')
	// The board takes whole numbers.
	const isValueValid = $derived(value !== undefined && Number.isInteger(value))
	const canExecute = $derived(activePin !== '' && isValueValid)
	const executeDescribedBy = $derived.by(() => {
		if (isHostPinEmpty) return hintId
		if (!isValueValid) return valueHintId
		return undefined
	})

	const execute = () => {
		if (!canExecute || value === undefined) return
		writeAnalogMutation.mutate([activePin, value], {})
	}
</script>

<ApiSection
	class="flex-col gap-2"
	method="WriteAnalog"
	api={ResourceTriplets.Board}
	mutations={[writeAnalogMutation]}
>
	{#if isHostPinEmpty}
		<MissingPinHint id={hintId} />
	{/if}
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
		bind:value
	/>
	{#if !isValueValid}
		<span
			id={valueHintId}
			class="text-subtle-1 text-xs">{VALUE_HINT}</span
		>
	{/if}
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={!canExecute}
			aria-describedby={executeDescribedBy}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</ApiSection>
