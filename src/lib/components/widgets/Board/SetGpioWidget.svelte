<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { TextField, ToggleButtons } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useBoardState } from './board-state.svelte'
	import { missingPinReason, PIN_BUSY_REASON } from './pin-held-back-reason'

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

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const setGPIOMutation = createResourceMutation(client, 'setGPIO')
	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))
	const guard = $derived(pinGuard(trimmedPin))
	const blockedReason = $derived.by(() => {
		if (isPinMissing) return missingPinReason(hasOwnPinField)
		return guard.isBusy ? PIN_BUSY_REASON : undefined
	})

	const execute = () => {
		if (blockedReason !== undefined) return
		void guard.run(() => setGPIOMutation.mutateAsync([trimmedPin, level === HIGH_LEVEL]))
	}
</script>

<ApiSection
	method="SetGPIO"
	api={ResourceTriplets.Board}
	class="grow flex-col gap-2"
	mutations={[setGPIOMutation]}
>
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
		<HeldBack reason={blockedReason}>
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
