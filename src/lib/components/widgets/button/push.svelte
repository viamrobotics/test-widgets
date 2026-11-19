<script lang="ts">
	import { ButtonClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

	// Set on the press itself, because the mutation's own pending state reaches the component a tick later.
	let isPending = $state(false)

	const push = () => {
		if (isPending) return
		isPending = true
		pushMutation.mutate([], {
			onSettled: () => {
				isPending = false
			},
		})
	}
</script>

<ApiSection
	method="Push"
	api={ResourceTriplets.Button}
	mutations={[pushMutation]}
>
	<div class="flex">
		<!-- Not disabled while in flight, so focus stays put. The handler ignores the press instead. -->
		<button
			type="button"
			class="button button-compact"
			aria-busy={isPending}
			onclick={push}
		>
			{#if isPending}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{/if}
			Push
		</button>
	</div>
</ApiSection>
