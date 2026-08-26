<script lang="ts">
	import { Switch } from '@viamrobotics/prime-core'
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { slide } from 'svelte/transition'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Query from '$lib/components/query.svelte'
	import ReadingsList from '$lib/components/readings-list.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'

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
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[currentQuery, voltageQuery, powerQuery, readingsQuery]}
			/>
		</div>

		<div class="@container">
			<div class="grid w-full grid-cols-1 divide-y @2xl:grid-cols-3 @2xl:divide-x @2xl:divide-y-0">
				<ApiSection
					title="GetCurrent"
					api="rdk:component:power_sensor"
					class="pb-5"
				>
					<Query
						query={currentQuery}
						contentCx="h-6"
					>
						{#if currentQuery.data !== undefined}
							<CurrentReading data={currentQuery.data} />
						{/if}
					</Query>
				</ApiSection>
				<ApiSection
					title="GetVoltage"
					api="rdk:component:power_sensor"
					class="pb-5"
				>
					<Query
						query={voltageQuery}
						contentCx="h-6"
					>
						{#if voltageQuery.data !== undefined}
							<VoltageReading data={voltageQuery.data} />
						{/if}
					</Query>
				</ApiSection>
				<ApiSection
					title="GetPower"
					api="rdk:component:power_sensor"
					class="pb-5"
				>
					<Query
						query={powerQuery}
						contentCx="h-6"
					>
						{#if powerQuery.data !== undefined}
							<PowerReading data={powerQuery.data} />
						{/if}
					</Query>
				</ApiSection>
			</div>
		</div>

		<ApiSection
			title="GetReadings"
			api="rdk:component:power_sensor"
			description="Get all the measurements and data that this power sensor provides"
		>
			<Switch
				bind:on={isGetReadingsEnabled}
				cx="text-subtle-2"
				annotated
			/>
			{#if isGetReadingsEnabled}
				<div
					transition:slide={{ duration: 150 }}
					class="pt-2"
				>
					<Query
						query={readingsQuery}
						contentCx="h-6"
					>
						{#if readingsQuery.data !== undefined}
							<ReadingsList data={readingsQuery.data} />
						{/if}
					</Query>
				</div>
			{/if}
		</ApiSection>
	{/snippet}
</ConnectionStatus>
