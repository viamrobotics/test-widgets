<script lang="ts">
	import { Tooltip } from '@viamrobotics/prime-ui'
	import { BaseClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StopButton from '$lib/components/stop-button.svelte'

	import QuickMoveControl from './quick-move-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const isMovingQuery = createResourceQuery(client, 'isMoving', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	// Stop is never guarded, so it sends even while a drive command is in flight.
	const stopMutation = createResourceMutation(client, 'stop')

	// The composed control adds its own errors through `Section.Error`, so one indicator holds every call's.
	const sectionErrors = useSectionErrors(() => ({
		queries: [isMovingQuery],
		mutations: [stopMutation],
	}))

	const isMoving = $derived(isMovingQuery.data === true)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<!-- The container sits outside the section padding, so a 550 px pane reaches the quick move's `@md`. -->
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

				<Section.Body>
					<div
						role="group"
						aria-label="At a glance"
						class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
					>
						<div class="flex items-center gap-2">
							<Tooltip>
								<Tooltip.Trigger>
									<!-- Keyboard focus is the only way to open the tooltip without a pointer. -->
									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<span
										class={['badge', isMoving ? 'badge-success' : 'badge-neutral']}
										tabindex="0"
									>
										{isMoving ? 'Moving' : 'Idle'}
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>Updates automatically</Tooltip.Content>
							</Tooltip>
							<StopButton
								onStop={() => {
									stopMutation.mutate([], {})
								}}
							/>
						</div>
					</div>

					<QuickMoveControl
						{partID}
						{resourceName}
						isEmbedded
					/>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
