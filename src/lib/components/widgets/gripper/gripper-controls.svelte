<script lang="ts">
	import { GripperClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import GripperStatusPill from './gripper-status-pill.svelte'
	import OpenGrabControl from './open-grab-control.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500

	const client = createResourceClient(
		GripperClient,
		() => partID,
		() => resourceName
	)

	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const isHoldingQuery = createResourceQuery(client, 'isHoldingSomething', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	// Stop is never guarded, so it sends even while Open or Grab is in flight.
	const stopMutation = createResourceMutation(client, 'stop')

	const sectionErrors = useSectionErrors(() => ({
		queries: [isMovingQuery, isHoldingQuery],
		mutations: [stopMutation],
	}))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container min-w-0">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-3 p-2"
			>
				<Section.Heading class="justify-between">
					Controls
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
					{/snippet}
				</Section.Heading>

				<Section.Body isLoading={sectionErrors.isLoading}>
					<div
						role="group"
						aria-label="At a glance"
						class="flex min-w-0 items-center justify-between gap-2 @2xl:justify-start @2xl:gap-4"
					>
						<GripperStatusPill
							isMoving={isMovingQuery.data}
							isHolding={isHoldingQuery.data}
						/>
						<StopButton
							onStop={() => {
								stopMutation.mutate([], {})
							}}
						/>
					</div>

					<OpenGrabControl
						{partID}
						{resourceName}
						isEmbedded
					/>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
