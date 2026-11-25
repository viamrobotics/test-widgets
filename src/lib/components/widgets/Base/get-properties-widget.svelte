<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { formatNumeric } from '$lib/format'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the base runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const properties = $derived(propertiesQuery.data)

	const idPrefix = $props.id()

	const rows = $derived([
		{ label: 'Width', value: properties?.widthMeters },
		{ label: 'Turning radius', value: properties?.turningRadiusMeters },
		{ label: 'Wheel circumference', value: properties?.wheelCircumferenceMeters },
	])
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Base}
	queries={[propertiesQuery]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		Returns the width, turning radius, and wheel circumference of the base, in meters.
	{/snippet}
	{#each rows as row, index (row.label)}
		{@const labelId = `${idPrefix}-${index}`}
		<div
			role="group"
			aria-labelledby={labelId}
			class="flex min-w-0 items-center gap-2"
		>
			<span
				id={labelId}
				class="text-subtle-1 w-36 shrink-0 truncate text-xs">{row.label}</span
			>
			<span class="readout font-roboto-mono">
				<span class="readout-value">
					{row.value === undefined ? MISSING_VALUE : formatNumeric(row.value)}
				</span>
				{#if row.value !== undefined}
					<span class="readout-suffix">m</span>
				{/if}
			</span>
		</div>
	{/each}
</ApiSection>
