<!--
@component
A send button with an optional armed step. A press arms it into Cancel and a confirm button, and
only the confirm press sends. The armed step holds until Cancel, the confirm press, or focus
leaving the pair. While the call is in flight the send button is busy and ignores presses. After
a success it holds a check for 500 ms and announces the result.
-->
<script lang="ts">
	import { mdiCheck } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { tick } from 'svelte'

	import type { InFlightOutcome } from './in-flight-guard.svelte'

	import HeldBack from './HeldBack.svelte'

	interface Props {
		/** Idle label, such as "Reset to zero" or "Execute". */
		label: string
		/** The armed send button's label, such as "Confirm reset". */
		confirmLabel: string
		/** False sends on the first press with no armed step. */
		isConfirmRequired: boolean
		/** Sends the call. Pass the guard's `run` result, so `undefined` means the group was busy and nothing was sent. */
		onconfirm: () => Promise<InFlightOutcome> | undefined
		/** Why the send is held back, such as the host's group being busy with another call. */
		blockedReason?: string
		/** Bound by a host that locks its fields while armed. */
		isArmed?: boolean
	}

	let {
		label,
		confirmLabel,
		isConfirmRequired,
		onconfirm,
		blockedReason,
		isArmed = $bindable(false),
	}: Props = $props()

	const DONE_MS = 500

	let phase = $state<'ready' | 'pending' | 'done'>('ready')
	let announcement = $state('')
	let sendButton = $state<HTMLButtonElement>()
	let cancelButton = $state<HTMLButtonElement>()
	let armedPair = $state<HTMLDivElement>()

	let doneTimer: ReturnType<typeof setTimeout> | undefined
	let isTornDown = false
	// Safari does not focus a clicked button, so pressing Confirm blurs Cancel with no next target.
	let isPointerDownInPair = false

	// The host's group is busy with our own call while pending, and that state reads busy, not disabled.
	const sendBlockedReason = $derived(phase === 'ready' ? blockedReason : undefined)

	const send = async () => {
		phase = 'pending'
		const outcome = onconfirm()
		const result = outcome === undefined ? undefined : await outcome
		if (result !== 'succeeded' || isTornDown) {
			phase = 'ready'
			return
		}
		phase = 'done'
		announcement = `${label}: done`
		doneTimer = setTimeout(() => {
			phase = 'ready'
		}, DONE_MS)
	}

	const disarm = () => {
		isPointerDownInPair = false
		isArmed = false
	}

	const focusSendButton = async () => {
		await tick()
		sendButton?.focus()
	}

	const arm = async () => {
		isArmed = true
		await tick()
		cancelButton?.focus()
	}

	const handlePress = () => {
		if (phase === 'pending' || sendBlockedReason !== undefined) return
		clearTimeout(doneTimer)
		phase = 'ready'
		announcement = ''
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
		if (!isArmed || phase === 'pending' || blockedReason !== undefined) return
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
	})
</script>

<svelte:window
	onpointerup={handlePointerEnd}
	onpointercancel={handlePointerEnd}
/>

<div class="flex flex-wrap justify-end gap-2">
	<span
		aria-live="polite"
		class="sr-only">{announcement}</span
	>
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
			<HeldBack reason={blockedReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact button-danger"
						onpointerdown={handlePairPointerDown}
						{...heldBack}
						onclick={handleConfirm}
					>
						{confirmLabel}
					</button>
				{/snippet}
			</HeldBack>
		</div>
	{:else}
		<HeldBack reason={sendBlockedReason}>
			{#snippet children(heldBack)}
				<button
					bind:this={sendButton}
					type="button"
					class="button button-compact"
					aria-busy={phase === 'pending'}
					{...heldBack}
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
			{/snippet}
		</HeldBack>
	{/if}
</div>
