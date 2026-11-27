<script lang="ts">
	import { EncoderClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { Section } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useEncoderState } from './encoder-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const BUSY_REASON = 'Wait for the reset in flight to finish.'

	const client = createResourceClient(
		EncoderClient,
		() => partID,
		() => resourceName
	)

	const resetMutation = createResourceMutation(client, 'resetPosition')
	const encoderState = untrack(() => useEncoderState(partID, resourceName))
	const resetGuard = encoderState.reset

	const busyReason = $derived(resetGuard.isBusy ? BUSY_REASON : undefined)
	// Another widget for this encoder can send the reset, and it reads the same here.
	const statusText = $derived.by(() => {
		if (resetGuard.isBusy) return 'Resetting'
		if (encoderState.lastResetOutcome === 'succeeded') return 'Position reset'
		if (encoderState.lastResetOutcome === 'failed') return 'Reset failed'
		return ''
	})

	const reset = () => {
		void encoderState.runReset(() => resetMutation.mutateAsync([]))
	}
</script>

<ApiSection
	class="grow flex-col gap-3"
	method="ResetPosition"
	api={ResourceTriplets.Encoder}
	mutations={[resetMutation]}
>
	<Section.Text>Set the current position as the new zero position</Section.Text>
	<div class="flex">
		<HeldBack reason={busyReason}>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={reset}
				>
					{#if resetGuard.isBusy}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Reset to zero
				</button>
			{/snippet}
		</HeldBack>
	</div>
	<StatusLine text={statusText} />
</ApiSection>
