<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { Section } from '$lib/components/section'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import Vector3 from './vector3.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const REFETCH_INTERVAL_MS = 500
	const MISSING_VALUE = '-'
	const labelId = $props.id()
	const UNIT = 'm/s²'

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	const linearAccelerationQuery = createResourceQuery(client, 'getLinearAcceleration', {
		refetchInterval: REFETCH_INTERVAL_MS,
	})
</script>

<ApiSection
	method="GetLinearAcceleration"
	api={ResourceTriplets.MovementSensor}
	queries={[linearAccelerationQuery]}
	class="grow flex-col gap-4"
>
	<div class="flex min-w-0 flex-col gap-1">
		<span
			id={labelId}
			class="text-subtle-1 text-xs">Linear acceleration</span
		>
		{#if linearAccelerationQuery.data === undefined}
			<span
				role="group"
				aria-labelledby={labelId}
				class="readout font-roboto-mono"
			>
				<span class="readout-value">{MISSING_VALUE}</span>
			</span>
		{:else}
			<div
				role="group"
				aria-labelledby={labelId}
				class="min-w-0"
			>
				<Vector3
					data={linearAccelerationQuery.data}
					unit={UNIT}
				/>
			</div>
		{/if}
	</div>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>
