<!--
@component
A board verb button. It shows a pending cue while its call is in flight, then a check for 1 s
only when the call succeeded. Its own pending call keeps it enabled, so focus stays on it.
-->
<script lang="ts">
	import { mdiCheck } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'

	interface Props {
		verb: 'Get' | 'Set'
		/** Runs the call. Resolves `true` when it succeeded. */
		onclick: () => Promise<boolean>
		/** True while another call in the button's conflict group is in flight. */
		isBusy?: boolean
	}

	const { verb, onclick, isBusy = false }: Props = $props()

	const DONE_MS = 1000

	let phase = $state<'ready' | 'pending' | 'done'>('ready')
	let doneTimer: ReturnType<typeof setTimeout> | undefined

	const isDisabled = $derived(isBusy && phase !== 'pending')

	// The visible word is gone while pending or done, so the name carries the verb.
	const ariaLabel = $derived.by(() => {
		if (phase === 'done') return `${verb}, done`
		if (phase === 'pending') return verb
		return undefined
	})

	const handleClick = async () => {
		if (phase === 'pending') return
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

<button
	type="button"
	class="button button-xs min-w-8.5"
	aria-busy={phase === 'pending'}
	disabled={isDisabled}
	aria-label={ariaLabel}
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
