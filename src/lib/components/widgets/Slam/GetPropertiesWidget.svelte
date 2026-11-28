<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { slamApi, SlamClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		SlamClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the service runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const properties = $derived(propertiesQuery.data)

	const mappingModeLabels: Record<slamApi.MappingMode, string> = {
		[slamApi.MappingMode.UNSPECIFIED]: MISSING_VALUE,
		[slamApi.MappingMode.CREATE_NEW_MAP]: 'Create new map',
		[slamApi.MappingMode.LOCALIZE_ONLY]: 'Localize only',
		[slamApi.MappingMode.UPDATE_EXISTING_MAP]: 'Update existing map',
	}

	const sensorTypeLabels: Record<slamApi.SensorType, string> = {
		[slamApi.SensorType.UNSPECIFIED]: MISSING_VALUE,
		[slamApi.SensorType.CAMERA]: 'Camera',
		[slamApi.SensorType.MOVEMENT_SENSOR]: 'Movement sensor',
	}

	const cloudSlamText = $derived.by(() => {
		if (properties === undefined) return MISSING_VALUE
		return properties.cloudSlam ? 'Yes' : 'No'
	})

	const mappingModeText = $derived(
		properties === undefined
			? MISSING_VALUE
			: (mappingModeLabels[properties.mappingMode] ?? MISSING_VALUE)
	)

	const stateFileTypeText = $derived(
		properties?.internalStateFileType === undefined || properties.internalStateFileType === ''
			? MISSING_VALUE
			: properties.internalStateFileType
	)

	const sensors = $derived(properties?.sensorInfo ?? [])

	const id = $props.id()
</script>

{#snippet rowLabel(text: string, labelId: string)}
	<span
		id={labelId}
		class="text-subtle-1 w-31 shrink-0 text-xs"
	>
		{text}
	</span>
{/snippet}

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Slam}
	queries={[propertiesQuery]}
	class="grow flex-col gap-2"
>
	<div
		role="group"
		aria-label="Properties"
		class="flex flex-col gap-1"
	>
		<div class="flex min-w-0 items-center gap-2">
			{@render rowLabel('Cloud SLAM', `${id}-cloud-slam`)}
			<span
				role="group"
				aria-labelledby="{id}-cloud-slam"
				class="readout font-roboto-mono min-w-0"
			>
				<span class="readout-value inline-flex items-center gap-2">
					{#if properties !== undefined}
						<StatusDot
							state={properties.cloudSlam ? 'success' : 'disabled'}
							label={cloudSlamText}
						/>
					{/if}
					{cloudSlamText}
				</span>
			</span>
		</div>
		<div class="flex min-w-0 items-center gap-2">
			{@render rowLabel('Mapping mode', `${id}-mapping-mode`)}
			<span
				role="group"
				aria-labelledby="{id}-mapping-mode"
				class="readout font-roboto-mono min-w-0"
			>
				<span class="readout-value">{mappingModeText}</span>
			</span>
		</div>
		<div class="flex min-w-0 items-center gap-2">
			{@render rowLabel('Internal state file type', `${id}-file-type`)}
			<span
				role="group"
				aria-labelledby="{id}-file-type"
				class="readout font-roboto-mono min-w-0"
			>
				<span class="readout-value">{stateFileTypeText}</span>
			</span>
		</div>
	</div>

	<p
		id="{id}-sensors"
		class="text-xs font-semibold"
	>
		Sensors
	</p>
	{#if sensors.length === 0}
		<p
			role="group"
			aria-labelledby="{id}-sensors"
			class="readout font-roboto-mono"
		>
			<span class="readout-value">{MISSING_VALUE}</span>
		</p>
	{:else}
		<ul
			aria-labelledby="{id}-sensors"
			class="flex flex-col gap-1"
		>
			{#each sensors as sensor, index (index)}
				<li class="flex min-w-0 items-center justify-between gap-2">
					<span class="readout font-roboto-mono min-w-0 truncate">{sensor.name}</span>
					<span class="text-subtle-2 shrink-0 text-xs">
						{sensorTypeLabels[sensor.type] ?? MISSING_VALUE}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</ApiSection>
