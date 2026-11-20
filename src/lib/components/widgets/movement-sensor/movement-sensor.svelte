<script lang="ts">
	import { Checkbox, Field, Label } from '@viamrobotics/prime-ui'
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import { prefersReducedMotion } from 'svelte/motion'
	import { slide } from 'svelte/transition'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
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
	import PropertiesReadout from './properties-readout.svelte'
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

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the sensor runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

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

	const properties = $derived(propertiesQuery.data)

	const polledQueries = $derived([
		...(properties?.positionSupported === true ? [positionQuery] : []),
		...(properties?.orientationSupported === true ? [orientationQuery] : []),
		...(properties?.compassHeadingSupported === true ? [compassHeadingQuery] : []),
		...(properties?.angularVelocitySupported === true ? [angularVelocityQuery] : []),
		...(properties?.linearVelocitySupported === true ? [linearVelocityQuery] : []),
		...(properties?.linearAccelerationSupported === true ? [linearAccelerationQuery] : []),
		accuracyQuery,
		...(showFullReadings ? [readingsQuery] : []),
	])

	const propertiesErrors = useSectionErrors(() => ({ queries: [propertiesQuery] }))
	const readingsErrors = useSectionErrors(() => ({ queries: [readingsQuery] }))

	const readingsJson = $derived(JSON.stringify(readingsQuery.data, null, 2))

	const READINGS_SLIDE_MS = 150
	const readingsSlideMs = $derived(prefersReducedMotion.current ? 0 : READINGS_SLIDE_MS)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container mx-auto max-w-4xl">
			<div class="flex flex-col">
				<div
					role="group"
					aria-label="Refresh"
					class="flex items-center gap-2 border-b p-2"
				>
					<RefetchController
						{refetchInterval}
						queries={polledQueries}
					/>
					<Section.Errors errors={propertiesErrors.errors} />
				</div>

				<Section.Body isLoading={propertiesErrors.isLoading}>
					{#if propertiesQuery.data?.positionSupported}
						<Map
							coordinate={positionQuery.data?.coordinate}
							rotation={orientationQuery.data?.oZ}
						/>
					{/if}
				</Section.Body>

				<div class="grid grid-cols-1 @2xl:grid-cols-2">
					{#if propertiesQuery.data?.positionSupported}
						<ApiSection
							method="GetPosition"
							api={ResourceTriplets.MovementSensor}
							queries={[positionQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if positionQuery.data !== undefined}
								<Position data={positionQuery.data} />
							{/if}
						</ApiSection>
					{/if}

					{#if propertiesQuery.data?.orientationSupported}
						<ApiSection
							method="GetOrientation"
							api={ResourceTriplets.MovementSensor}
							queries={[orientationQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if orientationQuery.data !== undefined}
								<Orientation data={orientationQuery.data} />
							{/if}
						</ApiSection>
					{/if}

					{#if propertiesQuery.data?.compassHeadingSupported}
						<ApiSection
							method="GetCompassHeading"
							api={ResourceTriplets.MovementSensor}
							queries={[compassHeadingQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if compassHeadingQuery.data !== undefined}
								<CompassHeading data={compassHeadingQuery.data} />
							{/if}
						</ApiSection>
					{/if}

					{#if propertiesQuery.data?.angularVelocitySupported}
						<ApiSection
							method="GetAngularVelocity"
							api={ResourceTriplets.MovementSensor}
							queries={[angularVelocityQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if angularVelocityQuery.data !== undefined}
								<Vector3
									data={angularVelocityQuery.data}
									unit="°/s"
								/>
							{/if}
						</ApiSection>
					{/if}

					{#if propertiesQuery.data?.linearVelocitySupported}
						<ApiSection
							method="GetLinearVelocity"
							api={ResourceTriplets.MovementSensor}
							queries={[linearVelocityQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if linearVelocityQuery.data !== undefined}
								<Vector3
									data={linearVelocityQuery.data}
									unit="m/s"
								/>
							{/if}
						</ApiSection>
					{/if}

					{#if propertiesQuery.data?.linearAccelerationSupported}
						<ApiSection
							method="GetLinearAcceleration"
							api={ResourceTriplets.MovementSensor}
							queries={[linearAccelerationQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if linearAccelerationQuery.data !== undefined}
								<Vector3
									data={linearAccelerationQuery.data}
									unit="m/s²"
								/>
							{/if}
						</ApiSection>
					{/if}

					{#if propertiesQuery.data !== undefined}
						<ApiSection
							method="GetAccuracy"
							api={ResourceTriplets.MovementSensor}
							queries={[accuracyQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							{#if accuracyQuery.data !== undefined}
								<Accuracy data={accuracyQuery.data} />
							{/if}
						</ApiSection>
					{/if}
					<Section
						errorReporter={readingsErrors}
						class="min-w-0 flex-col gap-2 border-b"
					>
						<Section.Heading>
							<Section.Method
								method="GetReadings"
								api={ResourceTriplets.MovementSensor}
							/>
							{#snippet aside()}
								<Section.Errors errors={readingsErrors.errors} />
								{#if showFullReadings && readingsQuery.data !== undefined}
									<span class="ml-auto">
										<CopyButton
											data={readingsJson}
											ariaLabel="Copy JSON"
										/>
									</span>
								{/if}
							{/snippet}
						</Section.Heading>

						<Field class="flex items-center gap-2">
							<Checkbox bind:checked={showFullReadings} />
							<Label>Show readings</Label>
						</Field>

						{#if showFullReadings}
							<div transition:slide={{ duration: readingsSlideMs }}>
								<Section.Body isLoading={readingsErrors.isLoading}>
									{#if readingsQuery.data !== undefined}
										<ReadingsList
											data={readingsQuery.data}
											showCopy={false}
										/>
									{/if}
								</Section.Body>
							</div>
						{/if}
					</Section>
					{#if propertiesQuery.data !== undefined}
						<ApiSection
							method="GetProperties"
							api={ResourceTriplets.MovementSensor}
							queries={[propertiesQuery]}
							class="min-w-0 flex-col gap-2 border-b"
						>
							<PropertiesReadout properties={propertiesQuery.data} />
						</ApiSection>
					{/if}
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>
