<script lang="ts">
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import HistoryLine from '#lib/components/HistoryLine.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'

	import CurrentReading from './CurrentReading.svelte'
	import { formatHistorySpan } from './format-history-span'
	import PowerReading from './PowerReading.svelte'
	import { createSampleHistory, HISTORY_SAMPLES } from './sample-history.svelte'
	import VoltageReading from './VoltageReading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'power-sensor-reading-history'
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

	// The last rate that polled. Pause and Resume to the same rate keep the history.
	let lastPollingRate = refetchInterval.current === false ? undefined : refetchInterval.current
	const historyKey = $derived.by(() => {
		const rate = refetchInterval.current
		if (rate !== false) lastPollingRate = rate
		return `${partID}/${resourceName}/${lastPollingRate}`
	})

	const historySpan = $derived(formatHistorySpan(refetchInterval.current))

	const voltageHistory = createSampleHistory(
		() => voltageQuery.dataUpdatedAt,
		() => voltageQuery.data?.[0],
		() => historyKey
	)
	const currentHistory = createSampleHistory(
		() => currentQuery.dataUpdatedAt,
		() => currentQuery.data?.[0],
		() => historyKey
	)
	const powerHistory = createSampleHistory(
		() => powerQuery.dataUpdatedAt,
		() => powerQuery.data,
		() => historyKey
	)
</script>

<div class="@container flex min-w-0 grow flex-col">
	<Section
		errorReporter={sectionErrors}
		class="min-w-0 grow flex-col gap-3 p-2"
	>
		<Section.Heading class="justify-between">
			Reading history
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
					<div class="min-w-0 flex-1">
						<HistoryLine
							samples={voltageHistory.samples}
							capacity={HISTORY_SAMPLES}
						/>
					</div>
				</div>
				<div class="flex min-w-0 items-center gap-2">
					<CurrentReading data={currentQuery.data} />
					<div class="min-w-0 flex-1">
						<HistoryLine
							samples={currentHistory.samples}
							capacity={HISTORY_SAMPLES}
						/>
					</div>
				</div>
				<div class="flex min-w-0 items-center gap-2">
					<PowerReading data={powerQuery.data} />
					<div class="min-w-0 flex-1">
						<HistoryLine
							samples={powerHistory.samples}
							capacity={HISTORY_SAMPLES}
						/>
					</div>
				</div>
				<p class="text-subtle-2 m-0 text-xs">{historySpan}</p>
			</div>
		</Section.Body>
	</Section>
</div>
