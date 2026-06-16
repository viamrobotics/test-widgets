<script lang="ts">
	import { Switch } from '@viamrobotics/prime-core'
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { slide } from 'svelte/transition'

	import { apiDocsHref } from '$lib/api-docs-href'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import Query from '$lib/components/query.svelte'
	import ReadingsList from '$lib/components/readings-list.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import SectionTitle from '$lib/components/section-title.svelte'

	const MS_API = 'rdk:component:movement_sensor'

	import Accuracy from './accuracy.svelte'
	import CompassHeading from './compass-heading.svelte'
	import Map from './map.svelte'
	import Orientation from './orientation.svelte'
	import Position from './position.svelte'
	import Vector3 from './vector3.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'movement-sensor'
	)
	let showFullReadings = $state(false)

	const onSetShowFullReadings = (event: CustomEvent<boolean>) => {
		showFullReadings = event.detail
	}

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: propertiesQuery.data?.positionSupported === true,
		refetchInterval: refetchInterval.current,
	}))

	const orientationQuery = createResourceQuery(client, 'getOrientation', () => ({
		enabled: propertiesQuery.data?.orientationSupported === true,
		refetchInterval: refetchInterval.current,
	}))

	const compassHeadingQuery = createResourceQuery(client, 'getCompassHeading', () => ({
		enabled: propertiesQuery.data?.compassHeadingSupported === true,
		refetchInterval: refetchInterval.current,
	}))

	const angularVelocityQuery = createResourceQuery(client, 'getAngularVelocity', () => ({
		enabled: propertiesQuery.data?.angularVelocitySupported === true,
		refetchInterval: refetchInterval.current,
	}))

	const linearVelocityQuery = createResourceQuery(client, 'getLinearVelocity', () => ({
		enabled: propertiesQuery.data?.linearVelocitySupported === true,
		refetchInterval: refetchInterval.current,
	}))

	const linearAccelerationQuery = createResourceQuery(client, 'getLinearAcceleration', () => ({
		enabled: propertiesQuery.data?.linearAccelerationSupported === true,
		refetchInterval: refetchInterval.current,
	}))

	const accuracyQuery = createResourceQuery(client, 'getAccuracy', () => ({
		refetchInterval: refetchInterval.current,
	}))

	const readingsQuery = createResourceQuery(client, 'getReadings', () => ({
		enabled: showFullReadings,
		refetchInterval: refetchInterval.current,
	}))

	const headingID = $props.id()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="p-4">
			<RefetchController
				{refetchInterval}
				queries={[propertiesQuery, positionQuery]}
			/>
		</div>

		<Query
			query={propertiesQuery}
			contentCx="p-4 h-14"
		>
			<div class="flex flex-wrap text-xs lg:flex-nowrap">
				<div class="flex w-full flex-col gap-5 py-4 pr-6 pl-4 lg:w-1/4">
					{#if propertiesQuery.data?.positionSupported}
						<div class="flex flex-col gap-2">
							<SectionTitle
								title="GetPosition"
								method="getPosition"
								href={apiDocsHref(MS_API, 'getPosition')}
							/>
							<Query
								query={positionQuery}
								contentCx="h-6"
							>
								{#if positionQuery.data !== undefined}
									<Position data={positionQuery.data} />
								{/if}
							</Query>
						</div>
					{/if}

					{#if propertiesQuery.data?.orientationSupported}
						<div class="flex flex-col gap-2">
							<SectionTitle
								title="GetOrientation"
								method="getOrientation"
								href={apiDocsHref(MS_API, 'getOrientation')}
							>
								{#snippet suffix()}<span class="text-subtle-2 text-xs font-normal">(º)</span
									>{/snippet}
							</SectionTitle>
							<Query
								query={orientationQuery}
								contentCx="h-6"
							>
								{#if orientationQuery.data !== undefined}
									<Orientation data={orientationQuery.data} />
								{/if}
							</Query>
						</div>
					{/if}

					{#if propertiesQuery.data?.compassHeadingSupported}
						<div class="flex flex-col gap-2">
							<SectionTitle
								title="GetCompassHeading"
								method="getCompassHeading"
								href={apiDocsHref(MS_API, 'getCompassHeading')}
							>
								{#snippet suffix()}<span class="text-subtle-2 text-xs font-normal">(º)</span
									>{/snippet}
							</SectionTitle>
							<Query
								query={compassHeadingQuery}
								contentCx="h-6"
							>
								{#if compassHeadingQuery.data !== undefined}
									<CompassHeading data={compassHeadingQuery.data} />
								{/if}
							</Query>
						</div>
					{/if}
				</div>

				<div class="flex w-full flex-col gap-5 p-4 lg:w-1/4">
					{#if propertiesQuery.data?.angularVelocitySupported}
						<div class="flex flex-col gap-2">
							<SectionTitle
								title="GetAngularVelocity"
								method="getAngularVelocity"
								href={apiDocsHref(MS_API, 'getAngularVelocity')}
							>
								{#snippet suffix()}<span class="text-subtle-2 text-xs font-normal">(º/s)</span
									>{/snippet}
							</SectionTitle>
							<Query
								query={angularVelocityQuery}
								contentCx="h-6"
							>
								{#if angularVelocityQuery.data !== undefined}
									<Vector3 data={angularVelocityQuery.data} />
								{/if}
							</Query>
						</div>
					{/if}

					{#if propertiesQuery.data?.linearVelocitySupported}
						<div class="flex flex-col gap-2">
							<SectionTitle
								title="GetLinearVelocity"
								method="getLinearVelocity"
								href={apiDocsHref(MS_API, 'getLinearVelocity')}
							>
								{#snippet suffix()}<span class="text-subtle-2 text-xs font-normal">(m/s)</span
									>{/snippet}
							</SectionTitle>
							<Query
								query={linearVelocityQuery}
								contentCx="h-6"
							>
								{#if linearVelocityQuery.data !== undefined}
									<Vector3 data={linearVelocityQuery.data} />
								{/if}
							</Query>
						</div>
					{/if}

					{#if propertiesQuery.data?.linearAccelerationSupported}
						<div class="flex flex-col gap-2">
							<SectionTitle
								title="GetLinearAcceleration"
								method="getLinearAcceleration"
								href={apiDocsHref(MS_API, 'getLinearAcceleration')}
							>
								{#snippet suffix()}<span class="text-subtle-2 text-xs font-normal"
										>(m/s<sup>2</sup>)</span
									>{/snippet}
							</SectionTitle>
							<Query
								query={linearAccelerationQuery}
								contentCx="h-6"
							>
								{#if linearAccelerationQuery.data !== undefined}
									<Vector3 data={linearAccelerationQuery.data} />
								{/if}
							</Query>
						</div>
					{/if}

					<div class="flex flex-col gap-2">
						<SectionTitle
							title="GetAccuracy"
							method="getAccuracy"
							href={apiDocsHref(MS_API, 'getAccuracy')}
						/>
						<Query
							query={accuracyQuery}
							contentCx="h-6"
						>
							{#if accuracyQuery.data !== undefined}
								<Accuracy data={accuracyQuery.data} />
							{/if}
						</Query>
					</div>
				</div>

				{#if propertiesQuery.data?.positionSupported}
					<Map
						coordinate={positionQuery.data?.coordinate}
						rotation={orientationQuery.data?.oZ}
					/>
				{/if}
			</div>
		</Query>

		<section
			class="flex flex-col gap-4 p-4"
			aria-labelledby={headingID}
		>
			<div class="flex flex-col gap-0.5">
				<SectionTitle
					title="GetReadings"
					method="getReadings"
					href={apiDocsHref(MS_API, 'getReadings')}
					headingId={headingID}
				/>
				<p class="text-subtle-2 text-xs">Get all the measurements and data from the sensor</p>
			</div>

			<Switch
				annotated
				on:change={onSetShowFullReadings}
			/>

			{#if showFullReadings}
				<div transition:slide={{ duration: 150 }}>
					<Query query={readingsQuery}>
						{#if readingsQuery.data !== undefined}
							<ReadingsList data={readingsQuery.data} />
						{/if}
					</Query>
				</div>
			{/if}
		</section>
	{/snippet}
</ConnectionStatus>
