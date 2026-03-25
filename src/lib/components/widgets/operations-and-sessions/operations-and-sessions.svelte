<script lang="ts">
	import { Icon } from '@viamrobotics/prime-core'
	import { createRobotMutation, createRobotQuery, useRobotClient } from '@viamrobotics/svelte-sdk'
	import { slide } from 'svelte/transition'

	import ErrorDisplay from '$lib/components/error.svelte'

	import OperationsTable from './operations-table.svelte'
	import RttPill from './rtt-pill.svelte'
	import SessionsTable from './sessions-table.svelte'

	interface Props {
		partID: string
	}

	const { partID }: Props = $props()

	let isCollapsed = $state(true)

	const client = useRobotClient(() => partID)
	const operationsQuery = createRobotQuery(client, 'getOperations', () => ({
		refetchInterval: 1000,
	}))
	const cancelOperationMutation = createRobotMutation(client, 'cancelOperation')
	// only enabled if not collapsed
	const sessionsQuery = createRobotQuery(client, 'getSessions', () => ({
		refetchInterval: 1000,
		enabled: !isCollapsed,
	}))

	let rtt = $state(0)
	let then = Date.now()

	$effect.pre(() => {
		if (operationsQuery.isRefetching) {
			then = Date.now()
		} else if (operationsQuery.isSuccess) {
			rtt = Date.now() - then
		}
	})

	const operations = $derived(operationsQuery.data ?? [])

	const cancelOperation = (id: string) => cancelOperationMutation.mutate([id])

	const id = $props.id()
	const collapseID = `${id}-ops-sessions-collapse`
	const headingID = `${id}-ops-sessions-heading`
</script>

<!-- z-10 is enough to ensure it is above the 'maplibre Google Maps' floating element-->
<section
	class="fixed bottom-0 z-10 w-full bg-white"
	aria-labelledby={headingID}
>
	<header>
		<button
			class="group border-light bg-extralight flex h-8 w-full items-center gap-2 border-y px-2 py-[11px]"
			aria-controls={collapseID}
			aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} Operations and Sessions`}
			aria-expanded={!isCollapsed}
			onclick={() => (isCollapsed = !isCollapsed)}
		>
			<Icon
				cx="text-gray-6"
				name={isCollapsed ? 'chevron-up' : 'chevron-down'}
			/>
			<h3
				id={headingID}
				class="font-roboto-mono text-subtle-1 text-xs tracking-wider uppercase"
			>
				Operations and Sessions
			</h3>
			{#if operations}
				<spacer class="w-4"></spacer>
				<span class="font-roboto-mono text-subtle-2 text-xs">RTT</span>
				<RttPill {rtt} />
			{/if}
		</button>
	</header>

	{#if !isCollapsed}
		<!-- 
  NOTE(zp, 2024-09-04) height is calculated here using 30vh because the parent (section) is the child of a flexbox and so it has to use min-h in order to get the right height (not h))
    but transition:slide and transition-[height] dont work without a height change (not a min-height change) so I can't put it on the section 
    (transition-[min-height] doesn't work).
   -->
		<div
			transition:slide={{ duration: 250 }}
			class="flex h-[calc(30vh-32px)] flex-col gap-4 overflow-y-auto px-4 pt-3 pb-4"
		>
			<div class="flex h-max flex-col gap-2">
				<span class="text-default text-sm font-semibold">Operations</span>
				{#if operations}
					<OperationsTable
						{operations}
						{cancelOperation}
					/>
				{/if}
				<ErrorDisplay lastError={operationsQuery.error} />
				<ErrorDisplay lastError={cancelOperationMutation.error} />
			</div>
			<div class="flex h-max flex-col gap-2">
				<span class="text-default text-sm font-semibold">Sessions</span>
				{#if sessionsQuery.data}
					<SessionsTable
						sessions={sessionsQuery.data}
						ourSessionId={client.current?.sessionId}
					/>
				{/if}
				<ErrorDisplay lastError={sessionsQuery.error} />
			</div>
		</div>
	{/if}
</section>
