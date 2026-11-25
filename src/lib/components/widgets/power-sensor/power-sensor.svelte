<script lang="ts">
	import { Switch } from '@viamrobotics/prime-core'
	import { PowerSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/api-section.svelte'
	import ConnectionStatus from '#lib/components/connection-status.svelte'
	import ReadingsList from '#lib/components/readings-list.svelte'
	import RefetchController from '#lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import { Section } from '#lib/components/section/index.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { slide } from 'svelte/transition'

	import BatteryReading from './battery-reading.svelte'
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

	// A machine whose RDK predates GetProperties fails this query. The battery section then stays
	// hidden, and the failure is not shown, since no section lists this query.
	const propertiesQuery = createResourceQuery(client, 'getProperties')

	const isBatteryPercentSupported = $derived(
		propertiesQuery.data?.isBatteryPercentSupported === true
	)

	const isChargingSupported = $derived(propertiesQuery.data?.isChargingSupported === true)

	const batteryPercentQuery = createResourceQuery(client, 'getBatteryPercent', () => ({
		enabled: isBatteryPercentSupported,
		refetchInterval: refetchInterval.current,
	}))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4 pb-3">
			<RefetchController
				{refetchInterval}
				queries={[currentQuery, voltageQuery, powerQuery, batteryPercentQuery, readingsQuery]}
			/>
		</div>

		<div class="@container">
			<div
				class={[
					'grid w-full grid-cols-1 divide-y @2xl:divide-x @2xl:divide-y-0',
					isBatteryPercentSupported ? '@2xl:grid-cols-4' : '@2xl:grid-cols-3',
				]}
			>
				<ApiSection
					queries={[currentQuery]}
					method="GetCurrent"
					api={ResourceTriplets.PowerSensor}
					class="grow flex-col gap-4 pb-5"
				>
					{#if currentQuery.data !== undefined}
						<CurrentReading data={currentQuery.data} />
					{/if}
				</ApiSection>
				<ApiSection
					queries={[voltageQuery]}
					method="GetVoltage"
					api={ResourceTriplets.PowerSensor}
					class="grow flex-col gap-4 pb-5"
				>
					{#if voltageQuery.data !== undefined}
						<VoltageReading data={voltageQuery.data} />
					{/if}
				</ApiSection>
				<ApiSection
					queries={[powerQuery]}
					method="GetPower"
					api={ResourceTriplets.PowerSensor}
					class="grow flex-col gap-4 pb-5"
				>
					{#if powerQuery.data !== undefined}
						<PowerReading data={powerQuery.data} />
					{/if}
				</ApiSection>
				{#if isBatteryPercentSupported}
					<ApiSection
						queries={[batteryPercentQuery]}
						method="GetBatteryPercent"
						api={ResourceTriplets.PowerSensor}
						class="grow flex-col gap-4 pb-5"
					>
						{#if batteryPercentQuery.data !== undefined}
							<BatteryReading
								data={batteryPercentQuery.data}
								{isChargingSupported}
							/>
						{/if}
					</ApiSection>
				{/if}
			</div>
		</div>

		<ApiSection
			queries={[readingsQuery]}
			class="grow flex-col gap-4"
			method="GetReadings"
			api={ResourceTriplets.PowerSensor}
		>
			{#snippet subheading()}
				<Section.Text>
					Get all the measurements and data that this power sensor provides
				</Section.Text>
			{/snippet}
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
					{#if readingsQuery.data !== undefined}
						<ReadingsList data={readingsQuery.data} />
					{/if}
				</div>
			{/if}
		</ApiSection>
	{/snippet}
</ConnectionStatus>
