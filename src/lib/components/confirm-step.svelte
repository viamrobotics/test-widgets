<!--
@component
A send button with an optional armed step. A press arms it into Cancel and a confirm button, and
only the confirm press sends. While the call is in flight the send button is busy and ignores
presses, and after a success it holds a check for 500 ms.
-->
<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { mdiCheck } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { tick } from 'svelte'

	import type { InFlightOutcome } from './in-flight-guard.svelte'

	interface Props {
		/** Idle label, such as "Reset to zero" or "Execute". */
		label: string
		/** The armed send button's label, such as "Confirm reset". */
		confirmLabel: string
		/** False sends on the first press with no armed step. */
		isConfirmRequired: boolean
		/** Sends the call. Pass the guard's `run` result, so `undefined` means the group was busy and nothing was sent. */
		onconfirm: () => Promise<InFlightOutcome> | undefined
		/** True while the host's group is busy with another call. */
		disabled?: boolean
		/** Bound by a host that locks its fields while armed. */
		isArmed?: boolean
		class?: ClassValue
	}

	let {
		label,
		confirmLabel,
		isConfirmRequired,
		onconfirm,
		disabled = false,
		isArmed = $bindable(false),
		class: className,
	}: Props = $props()

	const DONE_MS = 500
	const DISARM_MS = 10_000

	let phase = $state<'ready' | 'pending' | 'done'>('ready')
	let sendButton = $state<HTMLButtonElement>()
	let cancelButton = $state<HTMLButtonElement>()
	let armedPair = $state<HTMLDivElement>()

	let doneTimer: ReturnType<typeof setTimeout> | undefined
	let disarmTimer: ReturnType<typeof setTimeout> | undefined
	let isTornDown = false
	// Safari does not focus a clicked button, so pressing Confirm blurs Cancel with no next target.
	let isPointerDownInPair = false

	// The host's group is busy with our own call while pending, and that state reads busy, not disabled.
	const isSendDisabled = $derived(disabled && phase === 'ready')

	const send = async () => {
		phase = 'pending'
		const outcome = onconfirm()
		const result = outcome === undefined ? undefined : await outcome
		if (result !== 'succeeded' || isTornDown) {
			phase = 'ready'
			return
		}
		phase = 'done'
		doneTimer = setTimeout(() => {
			phase = 'ready'
		}, DONE_MS)
	}

	const disarm = () => {
		clearTimeout(disarmTimer)
		isPointerDownInPair = false
		isArmed = false
	}

	const focusSendButton = async () => {
		await tick()
		sendButton?.focus()
	}

	const arm = async () => {
		isArmed = true
		disarmTimer = setTimeout(() => {
			const hadFocus = armedPair?.contains(document.activeElement) ?? false
			disarm()
			if (hadFocus) void focusSendButton()
		}, DISARM_MS)
		await tick()
		cancelButton?.focus()
	}

	const handlePress = () => {
		if (phase === 'pending' || isSendDisabled) return
		clearTimeout(doneTimer)
		phase = 'ready'
		if (isConfirmRequired) {
			void arm()
			return
		}
		void send()
	}

	const handleCancel = () => {
		if (!isArmed) return
		disarm()
		void focusSendButton()
	}

	const handleConfirm = () => {
		if (!isArmed || phase === 'pending' || disabled) return
		disarm()
		void focusSendButton()
		void send()
	}

	const handleFocusOut = (event: FocusEvent) => {
		if (!isArmed) return
		const nextFocusTarget = event.relatedTarget
		if (nextFocusTarget instanceof Node && armedPair?.contains(nextFocusTarget)) return
		if (nextFocusTarget === null && isPointerDownInPair) return
		disarm()
	}

	const handlePairPointerDown = () => {
		isPointerDownInPair = true
	}

	const handlePointerEnd = () => {
		isPointerDownInPair = false
	}

	$effect(() => () => {
		isTornDown = true
		clearTimeout(doneTimer)
		clearTimeout(disarmTimer)
	})
</script>

<svelte:window
	onpointerup={handlePointerEnd}
	onpointercancel={handlePointerEnd}
/>

<div class={['flex flex-wrap justify-end gap-2', className]}>
	{#if isArmed}
		<div
			bind:this={armedPair}
			class="flex flex-wrap justify-end gap-2"
			onfocusout={handleFocusOut}
		>
			<button
				bind:this={cancelButton}
				type="button"
				class="button button-compact button-outline"
				onpointerdown={handlePairPointerDown}
				onclick={handleCancel}
			>
				Cancel
			</button>
			<button
				type="button"
				class="button button-compact button-danger"
				{disabled}
				onpointerdown={handlePairPointerDown}
				onclick={handleConfirm}
			>
				{confirmLabel}
			</button>
		</div>
	{:else}
		<button
			bind:this={sendButton}
			type="button"
			class="button button-compact"
			aria-busy={phase === 'pending'}
			disabled={isSendDisabled}
			onclick={handlePress}
		>
			{#if phase === 'pending'}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{:else if phase === 'done'}
				<Icon
					icon={mdiCheck}
					size="sm"
				/>
			{/if}
			{label}
		</button>
	{/if}
</div>
