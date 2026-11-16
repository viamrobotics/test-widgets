<script lang="ts">
	import { Switch } from '@viamrobotics/prime-core'
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { slide } from 'svelte/transition'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import ReadingsList from '$lib/components/readings-list.svelte'
	import RefetchController from '$lib/components/refetch-controller.svelte'
	import { createRefetchIntervalStore } from '$lib/components/refetch-interval-store.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

	const propertiesErrors = useSectionErrors(() => ({ queries: [propertiesQuery] }))
	const readingsErrors = useSectionErrors(() => ({ queries: [readingsQuery] }))
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="flex items-center gap-2 p-4">
			<RefetchController
				{refetchInterval}
				queries={[propertiesQuery, positionQuery]}
			/>
			<Section.Errors errors={propertiesErrors.errors} />
		</div>

		<Section.Body isLoading={propertiesErrors.isLoading}>
			{#if propertiesQuery.data !== undefined}
				<div class="@container">
					<div class="flex flex-wrap text-xs @4xl:flex-nowrap">
						<div class="flex w-full flex-col @4xl:w-1/4">
							{#if propertiesQuery.data.positionSupported}
								<ApiSection
									method="GetPosition"
									api={ResourceTriplets.MovementSensor}
									queries={[positionQuery]}
									class="flex-col gap-2"
								>
									{#if positionQuery.data !== undefined}
										<Position data={positionQuery.data} />
									{/if}
								</ApiSection>
							{/if}

							{#if propertiesQuery.data.orientationSupported}
								<ApiSection
									method="GetOrientation"
									api={ResourceTriplets.MovementSensor}
									queries={[orientationQuery]}
									class="flex-col gap-2"
								>
									{#snippet subheading()}
										<span class="text-subtle-2 text-xs font-normal">(º)</span>
									{/snippet}
									{#if orientationQuery.data !== undefined}
										<Orientation data={orientationQuery.data} />
									{/if}
								</ApiSection>
							{/if}

							{#if propertiesQuery.data.compassHeadingSupported}
								<ApiSection
									method="GetCompassHeading"
									api={ResourceTriplets.MovementSensor}
									queries={[compassHeadingQuery]}
									class="flex-col gap-2"
								>
									{#snippet subheading()}
										<span class="text-subtle-2 text-xs font-normal">(º)</span>
									{/snippet}
									{#if compassHeadingQuery.data !== undefined}
										<CompassHeading data={compassHeadingQuery.data} />
									{/if}
								</ApiSection>
							{/if}
						</div>

						<div class="flex w-full flex-col @4xl:w-1/4">
							{#if propertiesQuery.data.angularVelocitySupported}
								<ApiSection
									method="GetAngularVelocity"
									api={ResourceTriplets.MovementSensor}
									queries={[angularVelocityQuery]}
									class="flex-col gap-2"
								>
									{#snippet subheading()}
										<span class="text-subtle-2 text-xs font-normal">(º/s)</span>
									{/snippet}
									{#if angularVelocityQuery.data !== undefined}
										<Vector3 data={angularVelocityQuery.data} />
									{/if}
								</ApiSection>
							{/if}

							{#if propertiesQuery.data.linearVelocitySupported}
								<ApiSection
									method="GetLinearVelocity"
									api={ResourceTriplets.MovementSensor}
									queries={[linearVelocityQuery]}
									class="flex-col gap-2"
								>
									{#snippet subheading()}
										<span class="text-subtle-2 text-xs font-normal">(m/s)</span>
									{/snippet}
									{#if linearVelocityQuery.data !== undefined}
										<Vector3 data={linearVelocityQuery.data} />
									{/if}
								</ApiSection>
							{/if}

							{#if propertiesQuery.data.linearAccelerationSupported}
								<ApiSection
									method="GetLinearAcceleration"
									api={ResourceTriplets.MovementSensor}
									queries={[linearAccelerationQuery]}
									class="flex-col gap-2"
								>
									{#snippet subheading()}
										<span class="text-subtle-2 text-xs font-normal">(m/s<sup>2</sup>)</span>
									{/snippet}
									{#if linearAccelerationQuery.data !== undefined}
										<Vector3 data={linearAccelerationQuery.data} />
									{/if}
								</ApiSection>
							{/if}

							<ApiSection
								method="GetAccuracy"
								api={ResourceTriplets.MovementSensor}
								queries={[accuracyQuery]}
								class="flex-col gap-2"
							>
								{#if accuracyQuery.data !== undefined}
									<Accuracy data={accuracyQuery.data} />
								{/if}
							</ApiSection>
						</div>

						{#if propertiesQuery.data.positionSupported}
							<Map
								coordinate={positionQuery.data?.coordinate}
								rotation={orientationQuery.data?.oZ}
							/>
						{/if}
					</div>
				</div>
			{/if}
		</Section.Body>

		<Section
			errorReporter={readingsErrors}
			class="flex-col gap-4"
		>
			<div class="flex flex-col gap-0.5">
				<Section.Heading>
					<Section.Method
						method="GetReadings"
						api={ResourceTriplets.MovementSensor}
					/>
					{#snippet aside()}
						<Section.Errors errors={readingsErrors.errors} />
					{/snippet}
				</Section.Heading>
				<p class="text-subtle-2 text-xs">Get all the measurements and data from the sensor</p>
			</div>

			<Switch
				annotated
				on:change={onSetShowFullReadings}
			/>

			{#if showFullReadings}
				<div transition:slide={{ duration: 150 }}>
					<Section.Body isLoading={readingsErrors.isLoading}>
						{#if readingsQuery.data !== undefined}
							<ReadingsList data={readingsQuery.data} />
						{/if}
					</Section.Body>
				</div>
			{/if}
		</Section>
	{/snippet}
</ConnectionStatus>
