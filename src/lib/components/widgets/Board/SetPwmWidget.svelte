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
		/** The pin to set. Set, the widget draws no `Pin` field, and `''` disables Execute. */
		pin?: string
	}

	const { partID, resourceName, pin: sharedPin }: Props = $props()

	const MIN_DUTY_CYCLE = 0
	const MAX_DUTY_CYCLE = 100
	const PERCENT = 100
	const DEFAULT_DUTY_CYCLE = 50
	const PIN_PLACEHOLDER = '11'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const setPWMMutation = createResourceMutation(client, 'setPWM')
	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))

	let ownPin = $state('')
	let dutyCycle = $state<number | undefined>(DEFAULT_DUTY_CYCLE)

	const activePin = $derived((sharedPin ?? ownPin).trim())
	const hasPin = $derived(activePin !== '')
	const isDutyCycleValid = $derived(
		dutyCycle !== undefined &&
			Number.isFinite(dutyCycle) &&
			dutyCycle >= MIN_DUTY_CYCLE &&
			dutyCycle <= MAX_DUTY_CYCLE
	)
	const canExecute = $derived(hasPin && isDutyCycleValid)
	const guard = $derived(pinGuard(activePin))
	const id = $props.id()
	const valueHintId = `${id}-value`
	const VALUE_HINT = 'Enter a duty cycle from 0 to 100 to execute.'

	const blockedReason = $derived.by(() => {
		if (!hasPin) return missingPinReason(sharedPin === undefined)
		if (!isDutyCycleValid) return VALUE_HINT
		return guard.isBusy ? PIN_BUSY_REASON : undefined
	})

	const execute = () => {
		if (!canExecute || dutyCycle === undefined) return
		const dutyCycleFraction = dutyCycle / PERCENT
		void guard.run(() => setPWMMutation.mutateAsync([activePin, dutyCycleFraction]))
	}
</script>

<ApiSection
	method="SetPWM"
	api={ResourceTriplets.Board}
	mutations={[setPWMMutation]}
	class="flex-col gap-2"
>
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
			label="Duty cycle"
			hint="Accepts 0 to 100. Sent to the board as a fraction from 0 to 1."
			suffix="%"
			min={MIN_DUTY_CYCLE}
			max={MAX_DUTY_CYCLE}
			step={1}
			state={isDutyCycleValid ? undefined : 'error'}
			aria-describedby={isDutyCycleValid ? undefined : valueHintId}
			{...emptyOnClear(() => (dutyCycle = undefined))}
			bind:value={dutyCycle}
		/>
	</div>
	{#if !isDutyCycleValid}
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
