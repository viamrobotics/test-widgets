<script lang="ts">
	import { SwitchClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { createInFlightGuard } from '$lib/components/in-flight-guard.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'

	import Position from './position.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500

	const client = createResourceClient(
		SwitchClient,
		() => partID,
		() => resourceName
	)

	const positionQuery = createResourceQuery(client, 'getPosition', {
		refetchInterval: POLL_INTERVAL_MS,
	})
	const numberOfPositionsQuery = createResourceQuery(client, 'getNumberOfPositions')
	const setPositionMutation = createResourceMutation(client, 'setPosition')

	const sectionErrors = useSectionErrors(() => ({
		queries: [positionQuery, numberOfPositionsQuery],
		mutations: [setPositionMutation],
	}))

	// Every position pick is one conflict group: two picks in flight would contradict each other.
	const guard = createInFlightGuard()

	let sendingLabel = $state('')

	// No optimistic write: the selection follows GetPosition, re-read once SetPosition settles.
	const onSelect = async (position: number, label: string) => {
		const outcome = guard.run(() => {
			sendingLabel = label
			return setPositionMutation.mutateAsync([position])
		})
		if (outcome === undefined) return
		await outcome
		sendingLabel = ''
		void positionQuery.refetch()
	}

	const statusText = $derived(guard.isBusy ? `Sending ${sendingLabel}.` : '')
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
					{#if positionQuery.data !== undefined && numberOfPositionsQuery.data !== undefined}
						{@const labels = numberOfPositionsQuery.data[1]}
						<div class="flex w-full min-w-0 flex-col gap-1">
							<Position
								numPositions={numberOfPositionsQuery.data[0]}
								{labels}
								currentPosition={positionQuery.data}
								isBusy={guard.isBusy}
								onSelect={(position) => onSelect(position, labels[position] ?? String(position))}
							/>
							<StatusLine text={statusText} />
						</div>
					{/if}
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
