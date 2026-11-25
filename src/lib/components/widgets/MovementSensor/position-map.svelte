<script lang="ts">
	import { Folder, Panel } from '@viamrobotics/prime-controls'
	import {
		CenterControls,
		DirectionalMarker,
		FollowControls,
		MapLibre,
		MapLibreMarker,
		MapProviders,
		SatelliteControls,
	} from '@viamrobotics/prime-map'
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import { Section, useSectionErrors } from '$lib/components/section'

	import { safeReadCoordinate } from './safe-read-coordinate'
	import SupportRow from './support-row.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500
	// Street level: close enough to see the marker move, wide enough to keep the surroundings.
	const MAP_ZOOM = 15

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the sensor runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const isPositionSupported = $derived(propertiesQuery.data?.positionSupported === true)
	const isHeadingSupported = $derived(propertiesQuery.data?.compassHeadingSupported === true)

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: isPositionSupported,
		refetchInterval: POLL_INTERVAL_MS,
	}))
	const compassHeadingQuery = createResourceQuery(client, 'getCompassHeading', () => ({
		enabled: isHeadingSupported,
		refetchInterval: POLL_INTERVAL_MS,
	}))

	const sectionErrors = useSectionErrors(() => ({
		queries: [
			propertiesQuery,
			...(isPositionSupported ? [positionQuery] : []),
			...(isHeadingSupported ? [compassHeadingQuery] : []),
		],
	}))

	const latitude = $derived(safeReadCoordinate(positionQuery.data?.coordinate?.latitude))
	const longitude = $derived(safeReadCoordinate(positionQuery.data?.coordinate?.longitude))
	const heading = $derived(isHeadingSupported ? compassHeadingQuery.data : undefined)

	let isFollowing = $state(true)
</script>

<div class="@container flex min-w-0 grow flex-col">
	<Section
		errorReporter={sectionErrors}
		class="min-w-0 grow flex-col gap-3 p-2"
	>
		<Section.Heading class="justify-between">
			Map
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>

		<Section.Body isLoading={sectionErrors.isLoading}>
			{#if propertiesQuery.data !== undefined}
				{#if isPositionSupported}
					<div
						role="region"
						aria-label="Map"
						class="relative aspect-4/3 w-full"
					>
						<MapLibre
							zoom={MAP_ZOOM}
							options={{ attributionControl: { compact: false } }}
							mapProvider={MapProviders.googleMaps}
							mapProviderKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
						>
							<div
								class="absolute top-2 right-2 z-10 flex max-h-full max-w-[calc(100%-1rem)] flex-col"
							>
								<Panel
									aria-label="Map view panel"
									class="min-h-0 w-full min-w-44 overflow-auto"
								>
									<Folder title="Map view">
										<div class="flex flex-col gap-2 px-2 pb-2">
											<FollowControls
												bind:following={isFollowing}
												lat={latitude}
												lng={longitude}
											/>
											<fieldset
												disabled={isFollowing}
												class="min-w-0"
											>
												<CenterControls />
											</fieldset>
											<SatelliteControls />
										</div>
									</Folder>
								</Panel>
							</div>

							{#if latitude !== undefined && longitude !== undefined && heading !== undefined}
								<DirectionalMarker
									lat={latitude}
									lng={longitude}
									rotation={heading}
								/>
							{:else if latitude !== undefined && longitude !== undefined}
								<MapLibreMarker
									lat={latitude}
									lng={longitude}
								/>
							{/if}
						</MapLibre>
					</div>
				{:else}
					<SupportRow
						label="Position"
						isSupported={false}
					/>
				{/if}
			{/if}
		</Section.Body>
	</Section>
</div>
