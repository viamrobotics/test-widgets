<script lang="ts">
	import { ButtonClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { createInFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		ButtonClient,
		() => partID,
		() => resourceName
	)

	const pushMutation = createResourceMutation(client, 'push')

	// One guard per widget. Its promise settles with the call itself, so a change of resource mid-call cannot leave Push held back.
	const guard = createInFlightGuard()
	let statusText = $state('')

	const BUSY_REASON = 'Wait for the push in flight to finish.'
	const busyReason = $derived(guard.isBusy ? BUSY_REASON : undefined)

	const push = async () => {
		const outcome = await guard.run(() => {
			statusText = 'Pushing'
			return pushMutation.mutateAsync([])
		})
		if (outcome === undefined) return
		statusText = outcome === 'succeeded' ? 'Pushed' : 'Push failed'
	}
</script>

<ApiSection
	method="Push"
	api={ResourceTriplets.Button}
	mutations={[pushMutation]}
	class="grow-0 flex-col gap-1"
>
	<div class="flex">
		<HeldBack reason={busyReason}>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={push}
				>
					{#if guard.isBusy}
						<span
							class="progress-dots"
							aria-hidden="true"
						></span>
					{/if}
					Push
				</button>
			{/snippet}
		</HeldBack>
	</div>
	<StatusLine text={statusText} />
</ApiSection>
