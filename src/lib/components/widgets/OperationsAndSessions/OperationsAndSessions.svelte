<script lang="ts">
	import { Progress } from '@viamrobotics/prime-ui'
	import { createRobotMutation, createRobotQuery, useRobotClient } from '@viamrobotics/svelte-sdk'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'

	import { createRoundTripTimer } from './create-round-trip-timer.svelte'
	import OperationsTable from './OperationsTable.svelte'
	import RttPill from './RttPill.svelte'
	import SessionsTable from './SessionsTable.svelte'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()

	// Operations and sessions belong to the machine, so the store is named for the robot client.
	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => 'robot',
		'robot/getOperations'
	)

	const client = useRobotClient(() => partID)
	const operationsQuery = createRobotQuery(client, 'getOperations', () => ({
		refetchInterval: refetchInterval.current,
	}))
	const cancelOperationMutation = createRobotMutation(client, 'cancelOperation')
	const sessionsQuery = createRobotQuery(client, 'getSessions', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const killStatusText = $derived(cancelOperationMutation.error ? 'Kill failed' : '')

	const sectionErrors = useSectionErrors(() => ({
		queries: [operationsQuery, sessionsQuery],
		mutations: [cancelOperationMutation],
	}))

	const roundTripTimer = createRoundTripTimer(() => partID, 'getOperations')

	const operations = $derived(operationsQuery.data ?? [])

	const cancelOperation = (id: string) => cancelOperationMutation.mutate([id])
	const pendingOperationId = $derived(
		cancelOperationMutation.isPending ? cancelOperationMutation.variables?.[0] : undefined
	)

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
		{#if operationsQuery.data}
			<OperationsTable
				{operations}
				{cancelOperation}
				{pendingOperationId}
			/>
		{:else if operationsQuery.isLoading}
			<Progress label="Loading operations" />
		{/if}
		<StatusLine text={killStatusText} />
	</div>
	<div class="flex min-w-0 flex-col gap-2">
		<h4 class="text-default text-sm font-semibold">Sessions</h4>
		{#if sessionsQuery.data}
			<SessionsTable
				sessions={sessionsQuery.data}
				ourSessionId={client.current?.sessionId}
			/>
		{:else if sessionsQuery.isLoading}
			<Progress label="Loading sessions" />
		{/if}
	</div>
	<RefetchController
		{refetchInterval}
		queries={[operationsQuery, sessionsQuery]}
	/>
</section>
