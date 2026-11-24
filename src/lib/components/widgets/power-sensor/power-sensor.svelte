<script lang="ts">
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import ReadingsList from '$lib/components/readings-list.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import CurrentReading from './current-reading.svelte'
	import PowerReading from './power-reading.svelte'
	import VoltageReading from './voltage-reading.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'power-sensor'
	)

	let isGetReadingsEnabled = $state(false)

	const client = createResourceClient(
		PowerSensorClient,
		() => partID,
		() => resourceName
	)

	const currentQuery = createResourceQuery(client, 'getCurrent', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const voltageQuery = createResourceQuery(client, 'getVoltage', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const powerQuery = createResourceQuery(client, 'getPower', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const readingsQuery = createResourceQuery(client, 'getReadings', () => ({
		enabled: isGetReadingsEnabled,
		refetchInterval: refetchInterval.current,
	}))

	const readingsJson = $derived(
		readingsQuery.data === undefined ? undefined : JSON.stringify(readingsQuery.data, null, 2)
	)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y">
				<div class="p-2">
					<RefetchController
						{refetchInterval}
						queries={[voltageQuery, currentQuery, powerQuery, readingsQuery]}
					/>
				</div>

				<div
					class="grid w-full grid-cols-1 divide-y @2xl:grid-cols-3 @2xl:divide-x @2xl:divide-y-0"
				>
					<div class="flex min-w-0 flex-col">
						<ApiSection
							queries={[voltageQuery]}
							method="GetVoltage"
							api={ResourceTriplets.PowerSensor}
							class="grow flex-col gap-4"
						>
							<VoltageReading data={voltageQuery.data} />
						</ApiSection>
					</div>
					<div class="flex min-w-0 flex-col">
						<ApiSection
							queries={[currentQuery]}
							method="GetCurrent"
							api={ResourceTriplets.PowerSensor}
							class="grow flex-col gap-4"
						>
							<CurrentReading data={currentQuery.data} />
						</ApiSection>
					</div>
					<div class="flex min-w-0 flex-col">
						<ApiSection
							queries={[powerQuery]}
							method="GetPower"
							api={ResourceTriplets.PowerSensor}
							class="grow flex-col gap-4"
						>
							<PowerReading data={powerQuery.data} />
						</ApiSection>
					</div>
				</div>

				<div class="flex min-w-0 flex-col">
					<Section.Scope
						method="GetReadings"
						api={ResourceTriplets.PowerSensor}
					>
						<div class="p-2 pb-0">
							<Section.Heading>
								<Section.Method />
								{#snippet aside()}
									<Section.Errors />
									{#if readingsJson !== undefined}
										<span class="ml-auto">
											<CopyButton
												data={readingsJson}
												ariaLabel="Copy JSON"
											/>
										</span>
									{/if}
								{/snippet}
							</Section.Heading>
						</div>
						<ApiSection
							queries={[readingsQuery]}
							class="grow flex-col gap-4"
							method="GetReadings"
							api={ResourceTriplets.PowerSensor}
						>
							<Field
								label="Show readings"
								class="flex items-center gap-2"
							>
								<Checkbox bind:checked={isGetReadingsEnabled} />
								<Label />
							</Field>
							{#if isGetReadingsEnabled && readingsQuery.data !== undefined}
								<ReadingsList
									data={readingsQuery.data}
									showCopy={false}
								/>
							{/if}
						</ApiSection>
					</Section.Scope>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
