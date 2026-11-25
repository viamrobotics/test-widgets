<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { formatPositionReadout, MISSING_VALUE } from './motor-readout-format'

	const UNSUPPORTED_MESSAGE = 'This motor does not report its position.'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', {
		refetchInterval: false,
	})

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: propertiesQuery.data?.positionReporting === true,
		refetchInterval: 500,
	}))

	const labelId = $props.id()
	const unsupportedHintId = `${labelId}-unsupported`

	const reportsPosition = $derived(propertiesQuery.data?.positionReporting === true)
	const isPositionUnsupported = $derived(propertiesQuery.data?.positionReporting === false)
	const position = $derived(
		reportsPosition && positionQuery.data !== undefined
			? formatPositionReadout(positionQuery.data)
			: MISSING_VALUE
	)
	const hasPosition = $derived(position !== MISSING_VALUE)
</script>

<ApiSection
	method="GetPosition"
	api={ResourceTriplets.Motor}
	queries={[propertiesQuery, positionQuery]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		Reports the position of an encoded motor in revolutions from zero/home.
	{/snippet}
	<div class="flex min-w-0 items-center gap-2">
		<span
			id={labelId}
			class="text-subtle-1 text-xs"
		>
			Position
		</span>
		<span
			role="group"
			aria-labelledby={labelId}
			aria-describedby={isPositionUnsupported ? unsupportedHintId : undefined}
			class="readout font-roboto-mono min-w-0"
		>
			<span class="readout-value">{position}</span>
			{#if hasPosition}
				<span class="readout-suffix">rev</span>
			{/if}
		</span>
	</div>
	{#if isPositionUnsupported}
		<span
			id={unsupportedHintId}
			class="text-subtle-1 text-xs"
		>
			{UNSUPPORTED_MESSAGE}
		</span>
	{/if}
</ApiSection>
