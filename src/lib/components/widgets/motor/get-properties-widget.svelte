<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const labelId = $props.id()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	// The properties do not change while the motor runs, so they are read once.
	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })

	const positionReporting = $derived(propertiesQuery.data?.positionReporting)

	const positionReportingText = $derived.by(() => {
		if (positionReporting === undefined) return MISSING_VALUE
		return positionReporting ? 'Yes' : 'No'
	})
</script>

<ApiSection
	method="GetProperties"
	api={ResourceTriplets.Motor}
	queries={[propertiesQuery]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		Returns a message of booleans indicating which optional features the robot's motor supports.
	{/snippet}
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 w-32 shrink-0 truncate text-xs"
		>
			Position reporting
		</span>
		<span
			role="group"
			aria-labelledby={labelId}
			class="readout font-roboto-mono inline-flex items-center gap-2"
		>
			{#if positionReporting !== undefined}
				<StatusDot
					state={positionReporting ? 'success' : 'disabled'}
					label="Position reporting"
				/>
			{/if}
			<span class="readout-value">{positionReportingText}</span>
		</span>
	</div>
</ApiSection>
