<script lang="ts">
	import { createRobotMutation, createRobotQuery, useRobotClient } from '@viamrobotics/svelte-sdk'

	import { Section, useSectionErrors } from '$lib/components/section'

	import { createRoundTripTimer } from './create-round-trip-timer.svelte'
	import OperationsTable from './operations-table.svelte'
	import RttPill from './rtt-pill.svelte'
	import SessionsTable from './sessions-table.svelte'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()

	const POLL_INTERVAL_MS = 1000

	const client = useRobotClient(() => partID)
	const operationsQuery = createRobotQuery(client, 'getOperations', () => ({
		refetchInterval: POLL_INTERVAL_MS,
	}))
	const cancelOperationMutation = createRobotMutation(client, 'cancelOperation')
	const sessionsQuery = createRobotQuery(client, 'getSessions', () => ({
		refetchInterval: POLL_INTERVAL_MS,
	}))

	const sectionErrors = useSectionErrors(() => ({
		queries: [operationsQuery, sessionsQuery],
		mutations: [cancelOperationMutation],
	}))

	const roundTripTimer = createRoundTripTimer(() => partID, 'getOperations')

	const operations = $derived(operationsQuery.data ?? [])

	const cancelOperation = (id: string) => cancelOperationMutation.mutate([id])

	const id = $props.id()
	const headingId = `${id}-ops-sessions-heading`
</script>

<section
	class="flex min-w-0 flex-col gap-4"
	aria-labelledby={headingId}
>
	<!-- px-0.5 holds the error indicator's 2px touch target inside the pane. -->
	<header class="flex flex-wrap items-center gap-2 px-0.5">
		<h3
			id={headingId}
			class="text-default text-sm font-semibold"
		>
			Operations and sessions
		</h3>
		<RttPill rtt={roundTripTimer.current} />
		<div class="ml-auto">
			<Section.Errors errors={sectionErrors.errors} />
		</div>
	</header>

	<div class="flex min-w-0 flex-col gap-2">
		<h4 class="text-default text-sm font-semibold">Operations</h4>
		<OperationsTable
			{operations}
			{cancelOperation}
		/>
	</div>
	<div class="flex min-w-0 flex-col gap-2">
		<h4 class="text-default text-sm font-semibold">Sessions</h4>
		{#if sessionsQuery.data}
			<SessionsTable
				sessions={sessionsQuery.data}
				ourSessionId={client.current?.sessionId}
			/>
		{/if}
	</div>
</section>
