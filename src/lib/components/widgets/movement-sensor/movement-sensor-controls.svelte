<script lang="ts">
	import { Folder, Panel } from '@viamrobotics/prime-controls'
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import {
		CenterControls,
		DirectionalMarker,
		FollowControls,
		MapLibre,
		MapLibreMarker,
		MapProviders,
		SatelliteControls,
	} from '$lib/components/maplibre'
	import { Section, useSectionErrors } from '$lib/components/section'
	import { formatNumeric } from '$lib/format'

	import CompassHeading from './compass-heading.svelte'
	import Position from './position.svelte'
	import { safeReadCoordinate } from './safe-read-coordinate'
	import SupportRow from './support-row.svelte'
	import Vector3 from './vector3.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const POLL_INTERVAL_MS = 500
	const ACCURACY_INTERVAL_MS = 5000
	const MISSING_VALUE = '-'
	// Street level: close enough to see the marker move, wide enough to keep the surroundings.
	const MAP_ZOOM = 15

	const GPS_FIX_LABELS: Record<number, string> = {
		0: 'Invalid',
		1: 'GPS',
		2: 'DGPS/DGNSS',
		4: 'RTK',
		5: 'FRTK',
	}

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the sensor runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const hasPosition = $derived(propertiesQuery.data?.positionSupported === true)
	const hasHeading = $derived(propertiesQuery.data?.compassHeadingSupported === true)
	const hasLinearVelocity = $derived(propertiesQuery.data?.linearVelocitySupported === true)
	const hasAccuracy = $derived(hasPosition || hasHeading)

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: hasPosition,
		refetchInterval: POLL_INTERVAL_MS,
	}))
	const compassHeadingQuery = createResourceQuery(client, 'getCompassHeading', () => ({
		enabled: hasHeading,
		refetchInterval: POLL_INTERVAL_MS,
	}))
	const linearVelocityQuery = createResourceQuery(client, 'getLinearVelocity', () => ({
		enabled: hasLinearVelocity,
		refetchInterval: POLL_INTERVAL_MS,
	}))
	const accuracyQuery = createResourceQuery(client, 'getAccuracy', () => ({
		enabled: hasAccuracy,
		refetchInterval: ACCURACY_INTERVAL_MS,
	}))

	const sectionErrors = useSectionErrors(() => ({
		queries: [
			propertiesQuery,
			...(hasPosition ? [positionQuery] : []),
			...(hasHeading ? [compassHeadingQuery] : []),
			...(hasLinearVelocity ? [linearVelocityQuery] : []),
			...(hasAccuracy ? [accuracyQuery] : []),
		],
	}))

	const lat = $derived(safeReadCoordinate(positionQuery.data?.coordinate?.latitude))
	const lng = $derived(safeReadCoordinate(positionQuery.data?.coordinate?.longitude))
	const heading = $derived(hasHeading ? compassHeadingQuery.data : undefined)

	let isFollowing = $state(true)

	const panelId = $props.id()

	const fixLabel = (fix: number | undefined) =>
		fix === undefined ? MISSING_VALUE : (GPS_FIX_LABELS[fix] ?? MISSING_VALUE)

	const hdopText = $derived(
		accuracyQuery.data?.positionHdop === undefined
			? MISSING_VALUE
			: formatNumeric(accuracyQuery.data.positionHdop)
	)
</script>

{#snippet readout(label: string, value: string)}
	<div class="flex min-w-0 items-center gap-2">
		<span
			id="{panelId}-{label}"
			class="text-subtle-1 w-24 shrink-0 text-xs">{label}</span
		>
		<span
			role="group"
			aria-labelledby="{panelId}-{label}"
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{value}</span>
		</span>
	</div>
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container min-w-72">
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
					{#if propertiesQuery.data !== undefined}
						<div class="flex min-w-0 flex-col gap-3">
							{#if hasPosition}
								<div
									role="region"
									aria-label="Map"
									class="relative aspect-[4/3] w-full"
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
															{lat}
															{lng}
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

										{#if lat !== undefined && lng !== undefined && heading !== undefined}
											<DirectionalMarker
												{lat}
												{lng}
												rotation={heading}
											/>
										{:else if lat !== undefined && lng !== undefined}
											<MapLibreMarker
												{lat}
												{lng}
											/>
										{/if}
									</MapLibre>
								</div>
							{/if}

							<div class="grid grid-cols-1 gap-3 @2xl:grid-cols-2">
								<div class="flex min-w-0 flex-col gap-2">
									{#if hasPosition}
										{#if positionQuery.data !== undefined}
											<Position data={positionQuery.data} />
										{/if}
									{:else}
										<SupportRow
											label="Position"
											isSupported={false}
										/>
									{/if}
									{#if hasHeading && compassHeadingQuery.data !== undefined}
										<CompassHeading data={compassHeadingQuery.data} />
									{/if}
								</div>

								<div class="flex min-w-0 flex-col gap-2">
									{#if hasLinearVelocity && linearVelocityQuery.data !== undefined}
										<div class="flex min-w-0 flex-col gap-1">
											<span class="text-subtle-1 text-xs">Linear velocity</span>
											<Vector3
												data={linearVelocityQuery.data}
												unit="m/s"
											/>
										</div>
									{/if}
									{#if hasAccuracy && accuracyQuery.data !== undefined}
										{@render readout(
											'Fix quality',
											fixLabel(accuracyQuery.data.positionNmeaGgaFix)
										)}
										{@render readout('HDOP', hdopText)}
									{/if}
								</div>
							</div>
						</div>
					{/if}
				</Section.Body>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>
