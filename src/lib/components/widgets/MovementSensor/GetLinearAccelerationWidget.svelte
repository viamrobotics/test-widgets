<script lang="ts">
	import { MovementSensorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { createRefetchIntervalStore } from '#lib/components/refetch-interval-store.svelte.js'
	import RefetchController from '#lib/components/RefetchController.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import Vector3 from './Vector3.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const labelId = $props.id()
	const UNIT = 'm/s²'

	const refetchInterval = createRefetchIntervalStore(
		() => partID,
		() => resourceName,
		'movement-sensor/getLinearAcceleration'
	)

	const client = createResourceClient(
		MovementSensorClient,
		() => partID,
		() => resourceName
	)

	const linearAccelerationQuery = createResourceQuery(client, 'getLinearAcceleration', () => ({
		refetchInterval: refetchInterval.current,
	}))
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
	<div class="mt-auto">
		<RefetchController
			{refetchInterval}
			queries={[linearAccelerationQuery]}
		/>
	</div>
</ApiSection>
