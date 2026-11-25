<script lang="ts">
	import { mdiCheck } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { EncoderClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { useEncoderState } from './encoder-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const SUCCESS_CUE_MS = 500

	const client = createResourceClient(
		EncoderClient,
		() => partID,
		() => resourceName
	)

	const resetMutation = createResourceMutation(client, 'resetPosition')
	const { reset: resetGuard } = untrack(() => useEncoderState(partID, resourceName))

	let isShowingSuccess = $state(false)
	let successTimeout: number | undefined

	const showSuccessCue = () => {
		window.clearTimeout(successTimeout)
		isShowingSuccess = true
		successTimeout = window.setTimeout(() => {
			isShowingSuccess = false
		}, SUCCESS_CUE_MS)
	}

	const reset = () => {
		void resetGuard
			.run(() => resetMutation.mutateAsync([]))
			?.then((outcome) => {
				if (outcome === 'succeeded') showSuccessCue()
			})
	}

	const statusText = $derived.by(() => {
		if (resetGuard.isBusy) return 'Resetting'
		if (isShowingSuccess) return 'Position reset'
		return ''
	})

	$effect(() => {
		return () => {
			window.clearTimeout(successTimeout)
		}
	})
</script>

<ApiSection
	class="grow flex-col gap-4"
	method="ResetPosition"
	api={ResourceTriplets.Encoder}
	mutations={[resetMutation]}
>
	<Section.Text>Set the current position as the new zero position</Section.Text>
	<div class="flex">
		<button
			type="button"
			class="button button-compact"
			aria-busy={resetGuard.isBusy}
			disabled={resetGuard.isBusy}
			onclick={reset}
		>
			{#if resetGuard.isBusy}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{:else if isShowingSuccess}
				<Icon
					icon={mdiCheck}
					size="sm"
				/>
			{/if}
			Reset to zero
		</button>
		<span
			class="sr-only"
			role="status"
		>
			{statusText}
		</span>
	</div>
</ApiSection>
