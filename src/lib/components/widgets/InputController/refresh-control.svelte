<script lang="ts">
	import { InputControllerClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'

	import { useInputControllerState } from './input-controller-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const shared = untrack(() => useInputControllerState(partID, resourceName))

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'input-controller'
	)

	const client = createResourceClient(
		InputControllerClient,
		() => partID,
		() => resourceName
	)

	const eventsQuery = createResourceQuery(client, 'getEvents', () => ({
		refetchInterval: refetchInterval.current,
	}))

	// GetEvents polls at this rate for as long as the row is mounted.
	$effect(() => {
		shared.eventsRefetchInterval = refetchInterval.current
		return () => {
			shared.eventsRefetchInterval = undefined
		}
	})

	const sectionErrors = useSectionErrors(() => ({ queries: [eventsQuery] }))
</script>

<Section
	errorReporter={sectionErrors}
	class="grow flex-col gap-2"
>
	<Section.Heading>
		Refresh
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>

	<Section.Body>
		<ConnectionStatus {partID}>
			{#snippet connected()}
				<RefetchController
					{refetchInterval}
					queries={[eventsQuery]}
				/>
			{/snippet}
		</ConnectionStatus>
	</Section.Body>
</Section>
