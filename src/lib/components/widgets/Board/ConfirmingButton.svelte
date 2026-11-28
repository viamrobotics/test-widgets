<!--
@component
A board verb button. It shows a pending cue while its call is in flight, then a check for 1 s
only when the call succeeded. While another call holds its group it reads disabled and says why. Focus stays on it either way.
-->
<script lang="ts">
	import { mdiCheck } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import HeldBack from '#lib/components/HeldBack.svelte'

	interface Props {
		verb: 'Get' | 'Set'
		/** Runs the call. Resolves `true` when it succeeded. */
		onclick: () => Promise<boolean>
		/** True while another call in the button's conflict group is in flight. */
		isBusy?: boolean
		/** Why the button is held back for a reason of the caller's own, such as no pin. */
		blockedReason?: string
	}

	const { verb, onclick, isBusy = false, blockedReason: callerReason }: Props = $props()

	const DONE_MS = 1000
	const BUSY_REASON = 'Wait for the call in flight to finish.'

	let phase = $state<'ready' | 'pending' | 'done'>('ready')
	let doneTimer: ReturnType<typeof setTimeout> | undefined

	// Its own call in flight shows the pending cue, never a held-back reason, since a press then does nothing.
	const blockedReason = $derived.by(() => {
		if (phase === 'pending') return undefined
		if (callerReason !== undefined) return callerReason
		return isBusy ? BUSY_REASON : undefined
	})

	// The visible word is gone while pending or done, so the name carries the verb.
	const ariaLabel = $derived.by(() => {
		if (phase === 'done') return `${verb}, done`
		if (phase === 'pending') return verb
		return undefined
	})

	const handleClick = async () => {
		if (phase === 'pending' || blockedReason !== undefined) return
		clearTimeout(doneTimer)
		phase = 'pending'
		const succeeded = await onclick()
		if (!succeeded) {
			phase = 'ready'
			return
		}
		phase = 'done'
		doneTimer = setTimeout(() => {
			phase = 'ready'
		}, DONE_MS)
	}

	$effect(() => () => clearTimeout(doneTimer))
</script>

<HeldBack reason={blockedReason}>
	{#snippet children(heldBack)}
		<button
			type="button"
			class="button button-xs min-w-8.5"
			aria-busy={phase === 'pending'}
			aria-label={ariaLabel}
			{...heldBack}
			onclick={handleClick}
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
			{:else}
				{verb}
			{/if}
		</button>
	{/snippet}
</HeldBack>
