<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { TextField, ToggleButtons } from '@viamrobotics/prime-controls'
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
		/** The pin to write. Set, the widget draws no `Pin` field, and `''` disables Execute with a hint. */
		pin?: string
	}

	const { partID, resourceName, pin }: Props = $props()

	const LEVEL_ITEMS = [
		{ value: 'low', label: 'Low' },
		{ value: 'high', label: 'High' },
	]
	const HIGH_LEVEL = 'high'
	const PIN_PLACEHOLDER = '11'

	let ownPin = $state('')
	let level = $state(HIGH_LEVEL)

	const hasOwnPinField = $derived(pin === undefined)
	const activePin = $derived(pin ?? ownPin)
	const trimmedPin = $derived(activePin.trim())
	const isPinMissing = $derived(trimmedPin === '')
	const isHintShown = $derived(!hasOwnPinField && isPinMissing)

	const hintId = $props.id()

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const setGPIOMutation = createResourceMutation(client, 'setGPIO')
	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))
	const guard = $derived(pinGuard(trimmedPin))

	const execute = () => {
		if (isPinMissing) return
		void guard.run(() => setGPIOMutation.mutateAsync([trimmedPin, level === HIGH_LEVEL]))
	}
</script>

<ApiSection
	method="SetGPIO"
	api={ResourceTriplets.Board}
	class="grow flex-col gap-2"
	mutations={[setGPIOMutation]}
>
	{#if isHintShown}
		<MissingPinHint id={hintId} />
	{/if}
	{#if hasOwnPinField}
		<TextField
			class="max-w-40"
			label="Pin"
			placeholder={PIN_PLACEHOLDER}
			bind:value={ownPin}
		/>
	{/if}
	<ToggleButtons
		label="Level"
		items={LEVEL_ITEMS}
		bind:value={level}
	/>
	<div class="flex justify-end">
		<button
			type="button"
			class="button button-compact"
			disabled={isPinMissing || guard.isBusy}
			aria-describedby={isHintShown ? hintId : undefined}
			onclick={execute}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
</ApiSection>
