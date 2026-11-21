<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import HistoryLine from '$lib/components/history-line.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'

	import CurrentReading from './current-reading.svelte'
	import { formatHistorySpan } from './format-history-span'
	import PowerReading from './power-reading.svelte'
	import { createSampleHistory, HISTORY_SAMPLES } from './sample-history.svelte'
	import VoltageReading from './voltage-reading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'power-sensor-controls'
	)

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	const voltageQuery = createResourceQuery(client, 'getVoltage', () => ({
		refetchInterval: refetchInterval.current,
	}))
	const currentQuery = createResourceQuery(client, 'getCurrent', () => ({
		refetchInterval: refetchInterval.current,
	}))
	const powerQuery = createResourceQuery(client, 'getPower', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const sectionErrors = useSectionErrors(() => ({
		queries: [voltageQuery, currentQuery, powerQuery],
	}))

	const historySpan = $derived(formatHistorySpan(refetchInterval.current))

	const voltageHistory = createSampleHistory(
		() => voltageQuery.dataUpdatedAt,
		() => voltageQuery.data?.[0],
		() => refetchInterval.current
	)
	const currentHistory = createSampleHistory(
		() => currentQuery.dataUpdatedAt,
		() => currentQuery.data?.[0],
		() => refetchInterval.current
	)
	const powerHistory = createSampleHistory(
		() => powerQuery.dataUpdatedAt,
		() => powerQuery.data,
		() => refetchInterval.current
	)
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
					<div class="flex w-full min-w-0 flex-col gap-3">
						<RefetchController
							{refetchInterval}
							queries={[voltageQuery, currentQuery, powerQuery]}
						/>
						<div class="flex min-w-0 items-center gap-2">
							<VoltageReading data={voltageQuery.data} />
							<HistoryLine
								samples={voltageHistory.samples}
								capacity={HISTORY_SAMPLES}
								class="flex-1"
							/>
						</div>
						<div class="flex min-w-0 items-center gap-2">
							<CurrentReading data={currentQuery.data} />
							<HistoryLine
								samples={currentHistory.samples}
								capacity={HISTORY_SAMPLES}
								class="flex-1"
							/>
						</div>
						<div class="flex min-w-0 items-center gap-2">
							<PowerReading data={powerQuery.data} />
							<HistoryLine
								samples={powerHistory.samples}
								capacity={HISTORY_SAMPLES}
								class="flex-1"
							/>
						</div>
						<p class="text-subtle-2 m-0 text-xs">{historySpan}</p>
					</div>
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
